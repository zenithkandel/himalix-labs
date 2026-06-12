const express = require('express');
const router = express.Router();
const { storePool, authPool } = require('../config/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { logActivity } = require('../utils/logger');
const { sendMail } = require('../config/mail');

// ============================================================
// 1. PRODUCTS DIRECTORY ENDPOINTS
// ============================================================

/**
 * List paginated, filtered catalog products
 * GET /api/store/products
 */
router.get('/products', async (req, res) => {
  const { search, category, sort, page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let query = 'SELECT * FROM products WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
  const params = [];
  const countParams = [];

  // Apply search filtering
  if (search) {
    const searchPattern = `%${search}%`;
    query += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)';
    countQuery += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)';
    params.push(searchPattern, searchPattern, searchPattern);
    countParams.push(searchPattern, searchPattern, searchPattern);
  }

  // Apply category filtering
  if (category) {
    query += ' AND category = ?';
    countQuery += ' AND category = ?';
    params.push(category);
    countParams.push(category);
  }

  // Apply sorting models
  if (sort === 'price_asc') {
    query += ' ORDER BY price ASC';
  } else if (sort === 'price_desc') {
    query += ' ORDER BY price DESC';
  } else {
    query += ' ORDER BY created_at DESC'; // default newest
  }

  // Apply pagination limits
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  try {
    const [rows] = await storePool.query(query, params);
    const [countRows] = await storePool.query(countQuery, countParams);
    
    // Parse technical_specs JSON field
    const products = rows.map(p => ({
      ...p,
      technical_specs: typeof p.technical_specs === 'string' ? JSON.parse(p.technical_specs) : p.technical_specs,
      image_urls: typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : p.image_urls
    }));

    const total = countRows[0].total;

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Products List Query Exception:', err.message);
    res.status(500).json({ error: 'Failed to retrieve catalog products.' });
  }
});

/**
 * Fetch product details
 * GET /api/store/products/:id
 */
router.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await storePool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product catalog item not found.' });
    }

    const product = rows[0];
    product.technical_specs = typeof product.technical_specs === 'string' ? JSON.parse(product.technical_specs) : product.technical_specs;
    product.image_urls = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls;

    res.json(product);
  } catch (err) {
    console.error('Product Details Exception:', err.message);
    res.status(500).json({ error: 'Failed to retrieve product specifications.' });
  }
});

// ============================================================
// 2. Persistent SHOPPING CARTS (Token Required)
// ============================================================

/**
 * Fetch User Shopping Cart
 * GET /api/store/cart
 */
router.get('/cart', authMiddleware, async (req, res) => {
  try {
    const [rows] = await storePool.execute(
      `SELECT c.id as cart_item_id, c.quantity, p.id as product_id, p.name, p.sku, p.price, p.image_url, p.stock_quantity, p.stock_type 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [req.user.id]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error('Cart Query Exception:', err.message);
    res.status(500).json({ error: 'Failed to pull shopping cart.' });
  }
});

/**
 * Add product to user cart
 * POST /api/store/cart/add
 */
router.post('/cart/add', authMiddleware, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) {
    return res.status(400).json({ error: 'Product ID parameter is required.' });
  }

  try {
    // Check product existence
    const [prodCheck] = await storePool.execute('SELECT id, stock_quantity, stock_type FROM products WHERE id = ?', [productId]);
    if (prodCheck.length === 0) {
      return res.status(404).json({ error: 'Target product catalog item not found.' });
    }

    // Insert or update cart item
    await storePool.execute(
      `INSERT INTO cart_items (user_id, product_id, quantity) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, productId, quantity]
    );

    res.status(201).json({ message: 'Cart items updated successfully.' });
  } catch (err) {
    console.error('Cart Add Exception:', err.message);
    res.status(500).json({ error: 'Failed to write items to shopping cart.' });
  }
});

/**
 * Update cart item quantities
 * PUT /api/store/cart/update
 */
router.put('/cart/update', authMiddleware, async (req, res) => {
  const { cartItemId, quantity } = req.body;
  if (!cartItemId || quantity === undefined) {
    return res.status(400).json({ error: 'Cart item ID and target quantity details are required.' });
  }

  try {
    if (quantity <= 0) {
      await storePool.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartItemId, req.user.id]);
    } else {
      await storePool.execute(
        'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
        [quantity, cartItemId, req.user.id]
      );
    }
    res.json({ message: 'Cart item quantity updated successfully.' });
  } catch (err) {
    console.error('Cart Update Exception:', err.message);
    res.status(500).json({ error: 'Failed to update shopping cart quantities.' });
  }
});

/**
 * Delete Item from Cart
 * DELETE /api/store/cart/remove/:id
 */
router.delete('/cart/remove/:id', authMiddleware, async (req, res) => {
  try {
    await storePool.execute('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Cart item deleted successfully.' });
  } catch (err) {
    console.error('Cart Delete Exception:', err.message);
    res.status(500).json({ error: 'Failed to remove product from shopping cart.' });
  }
});

// ============================================================
// 3. SECURE CHECKOUT MECHANICS (Token Required)
// ============================================================

/**
 * Checkout Order Flow
 * POST /api/store/orders/checkout
 */
router.post('/orders/checkout', authMiddleware, async (req, res) => {
  const { shippingDetails, paymentMethod } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || null;

  if (!shippingDetails || !paymentMethod) {
    return res.status(400).json({ error: 'Shipping details and payment method are required.' });
  }

  const { fullName, email, phone, province, district, city, receivingLocation } = shippingDetails;
  if (!fullName || !email || !phone || !receivingLocation) {
    return res.status(400).json({ error: 'Full name, email, phone, and geographic location coordinates are required.' });
  }

  // Connection Pools references
  const storeConn = await storePool.getConnection();
  const authConn = await authPool.getConnection();

  try {
    // 1. Fetch Cart Items
    const [cartRows] = await storeConn.execute(
      `SELECT c.quantity, p.id, p.name, p.price, p.stock_quantity, p.stock_type, p.outsource_days 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (cartRows.length === 0) {
      return res.status(400).json({ error: 'Your shopping cart is empty.' });
    }

    // Begin double transaction blocks (for split databases)
    await storeConn.beginTransaction();
    await authConn.beginTransaction();

    // 2. Concurrency Lock: Query stock levels using FOR UPDATE to prevent race checkout updates
    const productIds = cartRows.map(c => c.id);
    const [lockedProducts] = await storeConn.query(
      'SELECT id, stock_quantity, stock_type, price, outsource_days FROM products WHERE id IN (?) FOR UPDATE',
      [productIds]
    );

    const productMap = {};
    lockedProducts.forEach(p => { productMap[p.id] = p; });

    // Validate Stocks
    let subtotal = 0.00;
    let maxOutsourceDays = 0;

    for (const item of cartRows) {
      const dbProd = productMap[item.id];
      if (!dbProd) {
        throw new Error(`Product ${item.name} is no longer in catalog.`);
      }

      if (dbProd.stock_type === 'in_stock' && dbProd.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${item.name}` });
      }

      subtotal += parseFloat(dbProd.price) * item.quantity;
      if (dbProd.stock_type === 'outsourced' && dbProd.outsource_days > maxOutsourceDays) {
        maxOutsourceDays = dbProd.outsource_days;
      }
    }

    // 3. Query system parameters from settings
    const [settingsRows] = await storeConn.execute('SELECT key_name, key_value FROM settings');
    const settings = {};
    settingsRows.forEach(s => { settings[s.key_name] = s.key_value; });

    const vatRate = parseFloat(settings['sales_tax_rate'] || 13) / 100;
    const deliveryPerKm = parseFloat(settings['delivery_per_km_rate'] || 15.00);
    const deliveryMinCharge = parseFloat(settings['delivery_min_charge'] || 50.00);
    const deliveryFreeThreshold = parseFloat(settings['delivery_free_threshold'] || 2000.00);

    // 4. Calculate Distance using Haversine
    const toRad = (deg) => (deg * Math.PI) / 180;
    const lat1 = toRad(27.7029); // HQ Lat (Kathmandu)
    const lon1 = toRad(85.3072); // HQ Lon
    const [lat2Deg, lon2Deg] = receivingLocation.split(',').map(c => parseFloat(c.trim()));
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
    const distanceKm = 2 * 6371 * Math.asin(Math.sqrt(a));

    // Determine shipping fee
    let shippingFee = 0.00;
    if (subtotal < deliveryFreeThreshold) {
      shippingFee = Math.max(deliveryMinCharge, distanceKm * deliveryPerKm);
    }

    // Determine tax and total
    const salesTax = subtotal * vatRate;
    const totalAmount = subtotal + salesTax + shippingFee;

    let paymentStatus = 'unpaid';

    // 5. Deduct Wallet Balance (Atomic Check Query)
    if (paymentMethod === 'store_credit') {
      const [deductUpdate] = await authConn.execute(
        `UPDATE users 
         SET wallet_balance = wallet_balance - ? 
         WHERE id = ? AND wallet_balance >= ?`,
        [totalAmount, req.user.id, totalAmount]
      );

      if (deductUpdate.affectedRows === 0) {
        await storeConn.rollback();
        await authConn.rollback();
        return res.status(400).json({ error: 'Insufficient wallet balance to perform checkout.' });
      }

      // Record Wallet Ledger Transaction
      const [walletTx] = await authConn.execute(
        `INSERT INTO wallet_transactions (user_id, session_id, amount, type, reference_id) 
         VALUES (?, ?, ?, 'purchase', ?)`,
        [req.user.id, req.user.sessionId || null, -totalAmount, `order_deduction_pending`]
      );

      paymentStatus = 'paid';
    }

    // 6. Generate Tracking Code & ETAs
    const trackingCode = 'HMX-' + Date.now().toString().slice(-6) + crypto.randomBytes(2).toString('hex').toUpperCase();
    const etaMin = maxOutsourceDays + 1;
    const etaMax = maxOutsourceDays + 2;

    const shippingAddressJson = JSON.stringify({
      fullName, email, phone, province, district, city, receivingLocation,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      shippingFee: parseFloat(shippingFee.toFixed(2)),
      expectedDeliveryETA: `${etaMin}-${etaMax} business days`
    });

    // 7. Write Order
    const [orderInsert] = await storeConn.execute(
      `INSERT INTO orders (user_id, session_id, total_amount, status, tracking_code, shipping_address, payment_method, payment_status) 
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [req.user.id, req.user.sessionId || null, totalAmount, trackingCode, shippingAddressJson, paymentMethod, paymentStatus]
    );
    const orderId = orderInsert.insertId;

    // Write Order line items and reduce stocks
    for (const item of cartRows) {
      await storeConn.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );

      if (item.stock_type === 'in_stock') {
        await storeConn.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.id]
        );

        // Low stock warning check (non-blocking notification)
        const newStock = item.stock_quantity - item.quantity;
        const threshold = parseInt(settings['low_stock_threshold'] || 5);
        if (newStock < threshold) {
          const [receivers] = await storeConn.execute(
            'SELECT email_address FROM email_notification_receivers WHERE notify_on_low_stock = 1'
          );
          receivers.forEach(async (r) => {
            try {
              await sendMail(
                r.email_address,
                `LOW STOCK ALERT - ${item.name}`,
                `<p>Product <b>${item.name}</b> (SKU: ${item.sku}) is running low on stock. Current level: <b>${newStock}</b>.</p>`
              );
            } catch (err) {
              // Fail silently
            }
          });
        }
      }
    }

    // 8. Clear Carts
    await storeConn.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    // Commit both transactions
    await storeConn.commit();
    await authConn.commit();

    // Log Activity
    await logActivity(req.user.id, req.user.sessionId || null, 'checkout', ip, { orderId, totalAmount, trackingCode });

    // Send transactional invoice email
    try {
      await sendMail(
        email,
        'Your Himalix Labs Order Invoice',
        `<h3>Thank you for your purchase!</h3>
         <p>Order Tracking Code: <b>${trackingCode}</b></p>
         <p>Total amount paid: <b>Rs. ${totalAmount.toFixed(2)}</b></p>
         <p>ETA: Delivery expected in <b>${etaMin}-${etaMax} business days</b>.</p>`
      );
    } catch (err) {
      // Fail silently
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      trackingCode,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: 'pending'
    });

  } catch (err) {
    await storeConn.rollback();
    await authConn.rollback();
    console.error('Checkout Exception:', err.message);
    res.status(500).json({ error: 'Failed to process checkout transaction.' });
  } finally {
    storeConn.release();
    authConn.release();
  }
});

// ============================================================
// 4. WALLET & INCENTIVES LEDGERS (Token Required)
// ============================================================

/**
 * Fetch wallet balance and transaction logs
 * GET /api/store/wallet/history
 */
router.get('/wallet/history', authMiddleware, async (req, res) => {
  try {
    const [userRows] = await authPool.execute(
      'SELECT wallet_balance, referral_code, referred_by FROM users WHERE id = ?',
      [req.user.id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User profiles not found.' });
    }

    const [transactions] = await authPool.execute(
      'SELECT id, amount, type, reference_id, created_at FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      walletBalance: parseFloat(userRows[0].wallet_balance),
      referralCode: userRows[0].referral_code,
      referredBy: userRows[0].referred_by,
      transactions
    });
  } catch (err) {
    console.error('Wallet Query Exception:', err.message);
    res.status(500).json({ error: 'Failed to query wallet details.' });
  }
});

/**
 * Bind Referral Inviter Code
 * POST /api/store/wallet/referral
 */
router.post('/wallet/referral', authMiddleware, async (req, res) => {
  const { referralCode } = req.body;
  if (!referralCode) {
    return res.status(400).json({ error: 'Referral code is required.' });
  }

  const authConn = await authPool.getConnection();
  try {
    await authConn.beginTransaction();

    // 1. Fetch user referral status
    const [userRows] = await authConn.execute('SELECT referred_by, referral_code FROM users WHERE id = ?', [req.user.id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    if (userRows[0].referred_by) {
      return res.status(400).json({ error: 'A referral code has already been bound to this account.' });
    }

    if (userRows[0].referral_code === referralCode) {
      return res.status(400).json({ error: 'You cannot self-refer.' });
    }

    // 2. Fetch referrer
    const [referrerRows] = await authConn.execute('SELECT id FROM users WHERE referral_code = ?', [referralCode]);
    if (referrerRows.length === 0) {
      return res.status(400).json({ error: 'Invalid referral code.' });
    }
    const referrerId = referrerRows[0].id;

    // Get referral rewards setting
    const [bonusSetting] = await storePool.execute('SELECT key_value FROM settings WHERE key_name = "referral_bonus_amount"');
    const bonus = bonusSetting.length > 0 ? parseFloat(bonusSetting[0].key_value) : 5.00;

    // 3. Apply updates
    await authConn.execute('UPDATE users SET referred_by = ?, wallet_balance = wallet_balance + ? WHERE id = ?', [referrerId, bonus, req.user.id]);
    await authConn.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [bonus, referrerId]);

    // Record wallet ledger transactions
    await authConn.execute(
      `INSERT INTO wallet_transactions (user_id, session_id, amount, type, reference_id) VALUES (?, ?, ?, 'referral', ?)`,
      [req.user.id, req.user.sessionId || null, bonus, `referral_bind_bonus_for_inviter_${referrerId}`]
    );
    await authConn.execute(
      `INSERT INTO wallet_transactions (user_id, session_id, amount, type, reference_id) VALUES (?, NULL, ?, 'referral', ?)`,
      [referrerId, bonus, `referral_bind_bonus_from_invitee_${req.user.id}`]
    );

    await authConn.commit();

    // Log Activity
    await logActivity(req.user.id, req.user.sessionId || null, 'referral_claim', req.ip, { referrerId, bonus });

    res.json({ message: 'Referral code bound successfully.', bonusCredited: bonus });

  } catch (err) {
    await authConn.rollback();
    console.error('Referral Bind Exception:', err.message);
    res.status(500).json({ error: 'Failed to process referral code bindings.' });
  } finally {
    authConn.release();
  }
});

/**
 * Claim Social Media Follow Bonus (One claim per platform)
 * POST /api/store/wallet/claim-social
 */
router.post('/wallet/claim-social', authMiddleware, async (req, res) => {
  const { platform } = req.body; // 'instagram' or 'facebook'
  if (!platform || !['instagram', 'facebook'].includes(platform)) {
    return res.status(400).json({ error: 'Valid social platform is required.' });
  }

  const authConn = await authPool.getConnection();
  try {
    await authConn.beginTransaction();

    // 1. Check duplicate social claims
    const [claimsCheck] = await authConn.execute(
      'SELECT claimed_at FROM social_claims WHERE user_id = ? AND platform = ?',
      [req.user.id, platform]
    );
    if (claimsCheck.length > 0) {
      return res.status(400).json({ error: `You have already claimed your follow bonus for ${platform}.` });
    }

    // 2. Fetch platform bonus settings
    const [bonusSetting] = await storePool.execute('SELECT key_value FROM settings WHERE key_name = "social_bonus_amount"');
    const bonus = bonusSetting.length > 0 ? parseFloat(bonusSetting[0].key_value) : 5.00;

    // 3. Write social claim registry and update balance
    await authConn.execute('INSERT INTO social_claims (user_id, platform) VALUES (?, ?)', [req.user.id, platform]);
    await authConn.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [bonus, req.user.id]);
    
    // Write wallet transactions
    await authConn.execute(
      `INSERT INTO wallet_transactions (user_id, session_id, amount, type, reference_id) VALUES (?, ?, ?, 'social', ?)`,
      [req.user.id, req.user.sessionId || null, bonus, `social_claim_bonus_${platform}`]
    );

    await authConn.commit();

    // Log Activity
    await logActivity(req.user.id, req.user.sessionId || null, 'social_claim', req.ip, { platform, bonus });

    res.json({ message: `Social credits follow bonus for ${platform} credited successfully.`, bonusCredited: bonus });

  } catch (err) {
    await authConn.rollback();
    console.error('Social Claim Exception:', err.message);
    res.status(500).json({ error: 'Failed to record social platform claims.' });
  } finally {
    authConn.release();
  }
});

// ============================================================
// 5. PRODUCT REVIEWS
// ============================================================

/**
 * List reviews for product
 * GET /api/store/reviews/:product_id
 */
router.get('/reviews/:product_id', async (req, res) => {
  try {
    const [rows] = await storePool.execute(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.email 
       FROM reviews r 
       JOIN himalix_auth.users u ON r.user_id = u.id 
       WHERE r.product_id = ? 
       ORDER BY r.created_at DESC`,
      [req.params.product_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Reviews Fetch Exception:', err.message);
    res.status(500).json({ error: 'Failed to retrieve reviews catalog.' });
  }
});

/**
 * Post product review
 * POST /api/store/reviews/:product_id
 */
router.post('/reviews/:product_id', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Review rating (1-5) is required.' });
  }

  try {
    await storePool.execute(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, req.params.product_id, rating, comment || null]
    );
    res.status(201).json({ message: 'Review posted successfully.' });
  } catch (err) {
    console.error('Review Insert Exception:', err.message);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

/**
 * Fetch Order History
 * GET /api/store/orders/history
 */
router.get('/orders/history', authMiddleware, async (req, res) => {
  try {
    const [rows] = await storePool.execute(
      `SELECT id, total_amount, status, tracking_code, shipping_address, payment_method, payment_status, created_at 
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    const orders = rows.map(o => ({
      ...o,
      shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
    }));

    res.json(orders);
  } catch (err) {
    console.error('Orders Query Exception:', err.message);
    res.status(500).json({ error: 'Failed to query order records.' });
  }
});

module.exports = router;
