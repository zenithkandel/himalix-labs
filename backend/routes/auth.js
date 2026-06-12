const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { authPool, storePool } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { sendMail } = require('../config/mail');

require('dotenv').config();

// Helper to generate random referral code
const generateReferralCode = () => {
  return 'HMX-REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
};

/**
 * Fetch Public Config variables (VAT, Delivery, Google OAuth client ID)
 * GET /api/auth/config
 */
router.get('/config', async (req, res) => {
  try {
    const [rows] = await storePool.execute('SELECT key_name, key_value FROM settings');
    const config = {};
    rows.forEach(r => {
      // Map configurations to clean camelCase keys
      if (r.key_name === 'google_client_id') config.googleClientId = r.key_value;
      if (r.key_name === 'google_auth_enabled') config.googleAuthEnabled = r.key_value === '1';
      if (r.key_name === 'sales_tax_rate') config.salesTaxRate = parseFloat(r.key_value);
      if (r.key_name === 'low_stock_threshold') config.lowStockThreshold = parseInt(r.key_value);
      if (r.key_name === 'maintenance_mode') config.maintenanceMode = r.key_value === '1';
      if (r.key_name === 'store_banner_text') config.storeBannerText = r.key_value;
      if (r.key_name === 'delivery_per_km_rate') config.deliveryPerKmRate = parseFloat(r.key_value);
      if (r.key_name === 'delivery_min_charge') config.deliveryMinCharge = parseFloat(r.key_value);
      if (r.key_name === 'delivery_free_threshold') config.deliveryFreeThreshold = parseFloat(r.key_value);
      if (r.key_name === 'referral_bonus_amount') config.referralBonusAmount = parseFloat(r.key_value);
    });
    
    // Add default brand constants
    config.emergencyContactPhone = "9800000000";
    config.emergencyContactEmail = "info@himalixlab.com";

    res.json(config);
  } catch (err) {
    console.error('Failed to query public store configurations:', err.message);
    res.status(500).json({ error: 'Failed to retrieve public configuration parameters.' });
  }
});

/**
 * Local Registration
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  const { email, password, role = 'user', referredByCode } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || null;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password fields are required.' });
  }

  try {
    // 1. Check if email already registered
    const [existing] = await authPool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email address already registered.' });
    }

    // 2. Hash password with 12 rounds
    const passwordHash = await bcrypt.hash(password, 12);
    const referralCode = generateReferralCode();

    // 3. Query Referral bonus settings from store settings
    const [settings] = await storePool.execute('SELECT key_value FROM settings WHERE key_name = "referral_bonus_amount"');
    const referralBonus = settings.length > 0 ? parseFloat(settings[0].key_value) : 5.00;

    // 4. Begin registration transaction on authPool
    const authConn = await authPool.getConnection();
    let userId;
    let sessionId;

    try {
      await authConn.beginTransaction();

      let referrerId = null;
      let initialBalance = 0.00;

      // Handle referrals logic
      if (referredByCode) {
        const [referrer] = await authConn.execute(
          'SELECT id, referral_code FROM users WHERE referral_code = ?',
          [referredByCode]
        );
        if (referrer.length > 0 && referrer[0].referral_code !== referralCode) {
          referrerId = referrer[0].id;
          initialBalance = referralBonus;
        }
      }

      // Insert User
      const [userInsert] = await authConn.execute(
        `INSERT INTO users (email, password_hash, role, referral_code, referred_by, wallet_balance) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, passwordHash, role, referralCode, referrerId, initialBalance]
      );
      userId = userInsert.insertId;

      // Insert Session entry
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const [sessionInsert] = await authConn.execute(
        `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, is_active) 
         VALUES (?, ?, ?, ?, 1)`,
        [userId, sessionToken, ip, req.headers['user-agent'] || null]
      );
      sessionId = sessionInsert.insertId;

      // Log activity
      await authConn.execute(
        `INSERT INTO user_activity_logs (user_id, session_id, action_type, ip_address, details) 
         VALUES (?, ?, 'signup', ?, ?)`,
        [userId, sessionId, ip, JSON.stringify({ email, method: 'local', referredByCode })]
      );

      // If referred, credit referrer wallet and record transactions
      if (referrerId) {
        // Inviteee transaction
        await authConn.execute(
          `INSERT INTO wallet_transactions (user_id, session_id, amount, type, reference_id) 
           VALUES (?, ?, ?, 'referral', ?)`,
          [userId, sessionId, referralBonus, `invitee_bonus_from_${referredByCode}`]
        );

        // Referrer balance update
        await authConn.execute(
          'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
          [referralBonus, referrerId]
        );

        // Referrer transaction
        await authConn.execute(
          `INSERT INTO wallet_transactions (user_id, session_id, amount, type, reference_id) 
           VALUES (?, NULL, ?, 'referral', ?)`,
          [referrerId, referralBonus, `referrer_bonus_for_inviting_user_${userId}`]
        );
      }

      await authConn.commit();
      
      // Issue JWT
      const token = jwt.sign(
        { id: userId, email, role, sessionId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      // Trigger Email Notification (Non-blocking)
      const [receivers] = await storePool.execute(
        'SELECT email_address FROM email_notification_receivers WHERE notify_on_user_registered = 1'
      );
      receivers.forEach(async (r) => {
        try {
          await sendMail(
            r.email_address,
            'New User Registered - Himalix Labs',
            `<p>A new user has registered on Himalix platform: <b>${email}</b></p>`
          );
        } catch (mailErr) {
          console.warn('Mail notification failed:', mailErr.message);
        }
      });

      res.status(201).json({
        token,
        user: {
          id: userId,
          email,
          role,
          wallet_balance: initialBalance,
          referral_code: referralCode
        }
      });

    } catch (txErr) {
      await authConn.rollback();
      throw txErr;
    } finally {
      authConn.release();
    }

  } catch (err) {
    console.error('Registration Exception:', err.message);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * Local Account Login
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || null;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. Query user details
    const [rows] = await authPool.execute(
      'SELECT id, email, password_hash, role, referral_code, wallet_balance FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email credentials or account does not exist.' });
    }

    const user = rows[0];

    // Check if password hash is NULL (registered via Google only)
    if (!user.password_hash) {
      return res.status(400).json({ error: 'This account uses Google login. Please sign in via Google.' });
    }

    // 2. Validate Password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    // 3. Create active session in database
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const [sessionInsert] = await authPool.execute(
      `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, is_active) 
       VALUES (?, ?, ?, ?, 1)`,
      [user.id, sessionToken, ip, req.headers['user-agent'] || null]
    );
    const sessionId = sessionInsert.insertId;

    // Log Activity
    await logActivity(user.id, sessionId, 'login', ip, { email: user.email, method: 'local' });

    // 4. Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        wallet_balance: parseFloat(user.wallet_balance),
        referral_code: user.referral_code
      }
    });

  } catch (err) {
    console.error('Login Exception:', err.message);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * Google Sign-In Route
 * POST /api/auth/google
 */
router.post('/google', async (req, res) => {
  const { token: googleToken } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || null;

  if (!googleToken) {
    return res.status(400).json({ error: 'Google credential ID token is required.' });
  }

  try {
    // 1. Fetch Google auth enabled config
    const [settings] = await storePool.execute('SELECT key_value FROM settings WHERE key_name = "google_auth_enabled"');
    if (settings.length > 0 && settings[0].key_value !== '1') {
      return res.status(400).json({ error: 'Google Sign-In is currently disabled.' });
    }

    // 2. Fetch Google Client ID
    const [clientIdRow] = await storePool.execute('SELECT key_value FROM settings WHERE key_name = "google_client_id"');
    if (clientIdRow.length === 0) {
      return res.status(500).json({ error: 'Google client configurations not found.' });
    }
    const googleClientId = clientIdRow[0].key_value;

    // 3. Verify Token
    const client = new OAuth2Client(googleClientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: googleClientId
      });
      payload = ticket.getPayload();
    } catch (tokenErr) {
      return res.status(401).json({ error: 'Failed to verify Google token credentials.' });
    }

    // Validation Guard: Ensure email verified
    if (!payload.email_verified) {
      return res.status(400).json({ error: 'Google email is not verified.' });
    }

    const { email, sub: googleId, picture: avatarUrl } = payload;

    // 4. Begin query / insertion transaction
    const authConn = await authPool.getConnection();
    try {
      await authConn.beginTransaction();

      let user;
      let isNewUser = false;

      // Check by google_id
      const [googleCheck] = await authConn.execute('SELECT * FROM users WHERE google_id = ?', [googleId]);
      
      if (googleCheck.length > 0) {
        user = googleCheck[0];
      } else {
        // Check by email
        const [emailCheck] = await authConn.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (emailCheck.length > 0) {
          // Link account
          await authConn.execute(
            'UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?',
            [googleId, avatarUrl, emailCheck[0].id]
          );
          user = { ...emailCheck[0], google_id: googleId, avatar_url: avatarUrl };
        } else {
          // Create new Google User
          isNewUser = true;
          const referralCode = generateReferralCode();
          const [userInsert] = await authConn.execute(
            `INSERT INTO users (email, google_id, avatar_url, role, referral_code, wallet_balance) 
             VALUES (?, ?, ?, 'user', ?, 0.00)`,
            [email, googleId, avatarUrl, referralCode]
          );
          user = {
            id: userInsert.insertId,
            email,
            google_id: googleId,
            avatar_url: avatarUrl,
            role: 'user',
            wallet_balance: 0.00,
            referral_code: referralCode
          };
        }
      }

      // Create Session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const [sessionInsert] = await authConn.execute(
        `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, is_active) 
         VALUES (?, ?, ?, ?, 1)`,
        [user.id, sessionToken, ip, req.headers['user-agent'] || null]
      );
      const sessionId = sessionInsert.insertId;

      // Log Activity
      await authConn.execute(
        `INSERT INTO user_activity_logs (user_id, session_id, action_type, ip_address, details) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id, 
          sessionId, 
          isNewUser ? 'signup' : 'login', 
          ip, 
          JSON.stringify({ email, method: 'google', googleId })
        ]
      );

      await authConn.commit();

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, sessionId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          wallet_balance: parseFloat(user.wallet_balance),
          referral_code: user.referral_code,
          avatar_url: user.avatar_url
        }
      });

    } catch (txErr) {
      await authConn.rollback();
      throw txErr;
    } finally {
      authConn.release();
    }

  } catch (err) {
    console.error('Google Auth Exception:', err.message);
    res.status(500).json({ error: 'Internal server error during Google authorization.' });
  }
});

/**
 * Fetch Authenticated User Identity
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await authPool.execute(
      'SELECT id, email, role, avatar_url, wallet_balance, referral_code FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      wallet_balance: parseFloat(user.wallet_balance),
      referral_code: user.referral_code
    });
  } catch (err) {
    console.error('Profile Retrieval Exception:', err.message);
    res.status(500).json({ error: 'Failed to retrieve profile identities.' });
  }
});

/**
 * Log out active session
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || null;
  const sessionId = req.user.sessionId;

  try {
    // 1. Invalidate session in database
    if (sessionId) {
      await authPool.execute(
        `UPDATE user_sessions SET is_active = 0, logout_time = NOW() WHERE id = ?`,
        [sessionId]
      );
      // Log logout
      await logActivity(req.user.id, sessionId, 'logout', ip, { email: req.user.email });
    }

    res.json({ message: 'Session logged out successfully.' });
  } catch (err) {
    console.error('Logout Exception:', err.message);
    res.status(500).json({ error: 'Failed to safely close the login session.' });
  }
});

module.exports = router;
