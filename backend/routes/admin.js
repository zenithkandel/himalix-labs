const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { portfolioPool, storePool, authPool } = require('../config/db');
const { logActivity } = require('../utils/logger');

// Ensure upload folder exists locally
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Engines
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage });

// Apply JWT and Admin guards globally to this router
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================================
// 1. IMAGE UPLOADS
// ============================================================
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// ============================================================
// 2. PORTFOLIO CMS CONTROLS (portfolioPool)
// ============================================================

/**
 * Fetch Portfolio CMS Contents
 */
router.get('/content', async (req, res) => {
  try {
    const [rows] = await portfolioPool.execute('SELECT * FROM landing_content');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve CMS landing content.' });
  }
});

/**
 * Update Landing CMS Content Key-Value
 */
router.put('/content/:id', async (req, res) => {
  const { content_value } = req.body;
  try {
    await portfolioPool.execute(
      'UPDATE landing_content SET content_value = ? WHERE id = ?',
      [content_value, req.params.id]
    );
    res.json({ message: 'CMS Content updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update CMS page section.' });
  }
});

// SERVICES CRUD
router.post('/services', async (req, res) => {
  const { title, subtitle, description, icon_class, features, link_url, display_order } = req.body;
  try {
    await portfolioPool.execute(
      `INSERT INTO services (title, subtitle, description, icon_class, features, link_url, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, subtitle, description, icon_class, JSON.stringify(features || []), link_url || '#', display_order || 0]
    );
    res.status(201).json({ message: 'Service created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert service.' });
  }
});

router.put('/services/:id', async (req, res) => {
  const { title, subtitle, description, icon_class, features, link_url, display_order, is_active } = req.body;
  try {
    await portfolioPool.execute(
      `UPDATE services SET title = ?, subtitle = ?, description = ?, icon_class = ?, features = ?, link_url = ?, display_order = ?, is_active = ? 
       WHERE id = ?`,
      [title, subtitle, description, icon_class, JSON.stringify(features || []), link_url, display_order, is_active, req.params.id]
    );
    res.json({ message: 'Service updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service.' });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    await portfolioPool.execute('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove service.' });
  }
});

// FOUNDERS TEAM CRUD
router.post('/team', async (req, res) => {
  const { name, role, bio, image_url, social_links, display_order } = req.body;
  try {
    await portfolioPool.execute(
      `INSERT INTO team_members (name, role, bio, image_url, social_links, display_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, role, bio, image_url, JSON.stringify(social_links || {}), display_order || 0]
    );
    res.status(201).json({ message: 'Team member added.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add team member.' });
  }
});

router.put('/team/:id', async (req, res) => {
  const { name, role, bio, image_url, social_links, display_order, is_active } = req.body;
  try {
    await portfolioPool.execute(
      `UPDATE team_members SET name = ?, role = ?, bio = ?, image_url = ?, social_links = ?, display_order = ?, is_active = ? 
       WHERE id = ?`,
      [name, role, bio, image_url, JSON.stringify(social_links || {}), display_order, is_active, req.params.id]
    );
    res.json({ message: 'Team member updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update team member details.' });
  }
});

router.delete('/team/:id', async (req, res) => {
  try {
    await portfolioPool.execute('DELETE FROM team_members WHERE id = ?', [req.params.id]);
    res.json({ message: 'Team member removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete team member.' });
  }
});

// TESTIMONIALS MODERATIONS
router.post('/testimonials', async (req, res) => {
  const { client_name, client_title, company, content, rating, display_order } = req.body;
  try {
    await portfolioPool.execute(
      `INSERT INTO testimonials (client_name, client_title, company, content, rating, display_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [client_name, client_title, company, content, rating || 5, display_order || 0]
    );
    res.status(201).json({ message: 'Testimonial added.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add testimonial.' });
  }
});

router.put('/testimonials/:id', async (req, res) => {
  const { client_name, client_title, company, content, rating, display_order, is_active } = req.body;
  try {
    await portfolioPool.execute(
      `UPDATE testimonials SET client_name = ?, client_title = ?, company = ?, content = ?, rating = ?, display_order = ?, is_active = ? 
       WHERE id = ?`,
      [client_name, client_title, company, content, rating, display_order, is_active, req.params.id]
    );
    res.json({ message: 'Testimonial updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update testimonial.' });
  }
});

router.delete('/testimonials/:id', async (req, res) => {
  try {
    await portfolioPool.execute('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ message: 'Testimonial removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete testimonial.' });
  }
});

// LEADS CAPTURES MESSAGES
router.get('/messages', async (req, res) => {
  try {
    const [rows] = await portfolioPool.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

router.put('/messages/:id/read', async (req, res) => {
  try {
    await portfolioPool.execute('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Message marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message.' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    await portfolioPool.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// ============================================================
// 3. STORE E-COMMERCE DASHBOARD (storePool & authPool)
// ============================================================

/**
 * Analytics summary reporting metrics
 */
router.get('/store/analytics', async (req, res) => {
  try {
    // 1. Total revenue (sum of non-cancelled orders)
    const [rev] = await storePool.execute(
      'SELECT SUM(total_amount) as total FROM orders WHERE status != "cancelled"'
    );
    // 2. Average Order Value
    const [aov] = await storePool.execute(
      'SELECT AVG(total_amount) as avg FROM orders WHERE status != "cancelled"'
    );
    // 3. Status Distributions
    const [status] = await storePool.execute(
      'SELECT status, COUNT(*) as count, SUM(total_amount) as sum FROM orders GROUP BY status'
    );
    // 4. Daily Sales Metrics last 7 days
    const [dailySales] = await storePool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total_amount) as sum 
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
       GROUP BY DATE(created_at) 
       ORDER BY date ASC`
    );
    // 5. Inventory Categories distribution
    const [categories] = await storePool.execute(
      'SELECT category, COUNT(*) as count, SUM(stock_quantity) as total_stock FROM products GROUP BY category'
    );
    // 6. Top Products
    const [topProducts] = await storePool.execute(
      `SELECT p.name, p.sku, SUM(oi.quantity) as units_sold 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       GROUP BY oi.product_id 
       ORDER BY units_sold DESC 
       LIMIT 5`
    );

    res.json({
      revenue: parseFloat(rev[0].total || 0.00),
      averageOrderValue: parseFloat(aov[0].avg || 0.00),
      statusSummary: status,
      dailySales,
      categories,
      topProducts
    });
  } catch (err) {
    console.error('Store Analytics Error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve analytics metrics.' });
  }
});

// PRODUCTS CATALOG CRUD
router.post('/store/products', async (req, res) => {
  const { name, sku, description, technical_specs, price, stock_quantity, image_url, category, stock_type, outsource_days, cost_price, image_urls } = req.body;
  try {
    await storePool.execute(
      `INSERT INTO products (name, sku, description, technical_specs, price, stock_quantity, image_url, category, stock_type, outsource_days, cost_price, image_urls) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, description, JSON.stringify(technical_specs || {}), price, stock_quantity || 0, image_url || null, category || null, stock_type || 'in_stock', outsource_days || 0, cost_price || 0.00, JSON.stringify(image_urls || [])]
    );
    res.status(201).json({ message: 'Catalog product added.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert catalog product.' });
  }
});

router.put('/store/products/:id', async (req, res) => {
  const { name, sku, description, technical_specs, price, stock_quantity, image_url, category, stock_type, outsource_days, cost_price, image_urls } = req.body;
  try {
    await storePool.execute(
      `UPDATE products SET name = ?, sku = ?, description = ?, technical_specs = ?, price = ?, stock_quantity = ?, image_url = ?, category = ?, stock_type = ?, outsource_days = ?, cost_price = ?, image_urls = ? 
       WHERE id = ?`,
      [name, sku, description, JSON.stringify(technical_specs || {}), price, stock_quantity, image_url, category, stock_type, outsource_days, cost_price, JSON.stringify(image_urls || []), req.params.id]
    );
    res.json({ message: 'Catalog product updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update catalog product.' });
  }
});

router.delete('/store/products/:id', async (req, res) => {
  try {
    await storePool.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Catalog product removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete catalog product.' });
  }
});

// USERS MANAGEMENT
router.get('/store/users', async (req, res) => {
  try {
    const [rows] = await authPool.execute('SELECT id, email, role, avatar_url, wallet_balance, referral_code, created_at FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profiles.' });
  }
});

router.put('/store/users/:id/role', async (req, res) => {
  const { role } = req.body;
  try {
    await authPool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'User role elevation completed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role.' });
  }
});

router.put('/store/users/:id/password', async (req, res) => {
  const { password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 12);
    await authPool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    res.json({ message: 'User password reset completed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

router.delete('/store/users/:id', async (req, res) => {
  try {
    await authPool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User account removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// MANUAL DEPOSIT OF CREDIT (e.g. transfers via eSewa)
router.post('/store/users/:id/credit', async (req, res) => {
  const { amount } = req.body;
  const ip = req.ip || null;
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Valid positive deposit amount is required.' });
  }

  const authConn = await authPool.getConnection();
  try {
    await authConn.beginTransaction();
    
    // 1. Credit wallet balance
    await authConn.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, req.params.id]);
    
    // 2. Log Wallet Transaction
    await authConn.execute(
      `INSERT INTO wallet_transactions (user_id, session_id, amount, type, reference_id) 
       VALUES (?, ?, ?, 'deposit', ?)`,
      [req.params.id, req.user.sessionId || null, amount, `admin_deposit_by_user_${req.user.id}`]
    );

    await authConn.commit();

    // Log Activity
    await logActivity(req.params.id, req.user.sessionId || null, 'wallet_deposit', ip, { amount, adminId: req.user.id });

    res.json({ message: 'Wallet balance manually credited.' });
  } catch (err) {
    await authConn.rollback();
    res.status(500).json({ error: 'Failed to apply wallet deposit.' });
  } finally {
    authConn.release();
  }
});

// ORDERS CONTROL DESK
router.get('/store/orders', async (req, res) => {
  try {
    const [rows] = await storePool.execute('SELECT * FROM orders ORDER BY created_at DESC');
    const orders = rows.map(o => ({
      ...o,
      shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address
    }));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
});

router.put('/store/orders/:id/status', async (req, res) => {
  const { status, payment_status } = req.body;
  try {
    await storePool.execute(
      'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
      [status, payment_status, req.params.id]
    );
    res.json({ message: 'Order status updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

router.delete('/store/orders/:id', async (req, res) => {
  try {
    await storePool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order.' });
  }
});

// SETTINGS CONTROL
router.get('/store/settings', async (req, res) => {
  try {
    const [rows] = await storePool.execute('SELECT * FROM settings');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to query settings.' });
  }
});

router.put('/store/settings', async (req, res) => {
  const { settings } = req.body; // Expects array of { key_name, key_value }
  const conn = await storePool.getConnection();
  try {
    await conn.beginTransaction();
    for (const s of settings) {
      await conn.execute(
        'INSERT INTO settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)',
        [s.key_name, s.key_value]
      );
    }
    await conn.commit();
    res.json({ message: 'Settings parameters updated successfully.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Failed to update settings parameters.' });
  } finally {
    conn.release();
  }
});

// NOTIFICATION RECEIVERS CRUD
router.get('/store/notification-receivers', async (req, res) => {
  try {
    const [rows] = await storePool.execute('SELECT * FROM email_notification_receivers');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to query notification alert receivers.' });
  }
});

router.post('/store/notification-receivers', async (req, res) => {
  const { email_address, notify_on_order_placed, notify_on_low_stock, notify_on_user_registered } = req.body;
  try {
    await storePool.execute(
      `INSERT INTO email_notification_receivers (email_address, notify_on_order_placed, notify_on_low_stock, notify_on_user_registered) 
       VALUES (?, ?, ?, ?)`,
      [email_address, notify_on_order_placed || 1, notify_on_low_stock || 1, notify_on_user_registered || 1]
    );
    res.status(201).json({ message: 'Notification alert receiver added successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to insert alert receiver.' });
  }
});

router.delete('/store/notification-receivers/:id', async (req, res) => {
  try {
    await storePool.execute('DELETE FROM email_notification_receivers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Alert receiver removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove alert receiver.' });
  }
});

// REVIEWS MODERATIONS
router.get('/store/reviews', async (req, res) => {
  try {
    const [rows] = await storePool.execute(
      `SELECT r.id, r.rating, r.comment, r.created_at, p.name as product_name, u.email 
       FROM reviews r 
       JOIN products p ON r.product_id = p.id 
       JOIN himalix_auth.users u ON r.user_id = u.id 
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to query reviews catalog.' });
  }
});

router.delete('/store/reviews/:id', async (req, res) => {
  try {
    await storePool.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// CARTS AUDITS
router.get('/store/carts', async (req, res) => {
  try {
    const [rows] = await storePool.execute(
      `SELECT c.id, c.quantity, c.updated_at, p.name as product_name, p.sku, u.email 
       FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       JOIN himalix_auth.users u ON c.user_id = u.id 
       ORDER BY c.updated_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to audit shopping carts.' });
  }
});

// TRANSACTION LEDGER
router.get('/store/wallet/transactions', async (req, res) => {
  try {
    const [rows] = await authPool.execute(
      `SELECT t.id, t.amount, t.type, t.reference_id, t.created_at, u.email 
       FROM wallet_transactions t 
       JOIN users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transactions ledger.' });
  }
});

// SOCIAL CLAIMS AUDITS
router.get('/store/social-claims', async (req, res) => {
  try {
    const [rows] = await authPool.execute(
      `SELECT c.platform, c.claimed_at, u.email 
       FROM social_claims c 
       JOIN users u ON c.user_id = u.id 
       ORDER BY c.claimed_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve social claims logs.' });
  }
});

module.exports = router;
