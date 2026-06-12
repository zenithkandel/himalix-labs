# 🚦 Phase 3: Universal Auth & API Gateway Blueprint

This phase configures the core authentication controllers (local and Google OAuth), maps e-commerce checkout routing (with mathematical calculation models), and builds the Express gateway server [server.js](file:///c:/xampp/htdocs/codes/himalix-labs/backend/server.js).

---

## 1. Authentication Routing and Logic

Create the authentication controller in [authController.js](file:///c:/xampp/htdocs/codes/himalix-labs/auth/authController.js) or `backend/routes/auth.js`:

### A. Local Account Registration (`POST /api/auth/register`)
1. Checks if the requested email already exists in `users`.
2. Hashes the raw password utilizing `bcryptjs` (salt rounds = 10).
3. Generates a new referral code: `HMX-REF-` + 6 random uppercase alphanumeric characters.
4. Executes the following actions inside a database transaction:
   * Inserts the new user.
   * If a valid `referredByCode` is passed, fetches the matching referrer ID.
   * If found, sets the new user's initial wallet balance to the setting `referral_bonus_amount` (default `5.00`) and records a `deposit` entry in `wallet_transactions`.
   * Credits the referrer's wallet balance by the same amount and logs a `referral` transaction entry.
5. Signs a JWT containing `{ id, email, role }`.
6. Dispatches an email notification to admins subscribed to user registrations.

### B. Local Account Login (`POST /api/auth/login`)
1. Queries the user by email.
2. Compares input password against `password_hash` using `bcryptjs.compare()`.
3. If valid, signs and returns the JWT.

### C. Google Sign-In (`POST /api/auth/google`)
1. Checks settings table to verify `google_auth_enabled === '1'`.
2. Validates the Google ID credential token using Google's verification client (`google-auth-library`):
   ```javascript
   const { OAuth2Client } = require('google-auth-library');
   const client = new OAuth2Client(googleClientIdFromSettings);
   const ticket = await client.verifyIdToken({
       idToken: req.body.token,
       audience: googleClientIdFromSettings
   });
   const payload = ticket.getPayload(); // { email, sub (google_id), picture (avatar_url) }
   ```
3. Checks if a user matches the `google_id`. If found, issues a JWT.
4. If a user matches the `email` but has no `google_id`, links the account by saving `google_id` and updates the profile image path (`avatar_url`).
5. If no user matches the email, inserts a new user with a null `password_hash`, generates a referral code, and issues a JWT.

### D. Settings Config API (`GET /api/auth/config`)
Returns public store variables to configuration contexts (Google Client ID, VAT rates, delivery fee parameters, banner strings) by querying the `settings` table.

---

## 2. Store E-Commerce Endpoints (`/api/store`)

Create route modules under `backend/routes/store/`:
* **`products.js`:** List products with paginated category filters (`limit`, `page`), search queries, and sorting.
* **`cart.js`:** Add items to cart (`uq_cart_items_user_product` constraints trigger update increments if duplicate), change quantities, and delete items.
* **`wallet.js`:** Fetch transaction logs, bind referral codes post-registration, and claim platform-specific social credits.
* **`reviews.js`:** Fetch ratings per product ID and submit customer reviews.

### Detailed Checkout Calculations (`POST /api/store/orders/checkout`)
The checkout endpoint must execute the following operations in a transaction block:
1. **Fetch Cart:** Checks user cart items. Fails with `400` if empty.
2. **Validate Stocks:** Ensures ordered quantity $\le$ current product `stock_quantity` (ignores stock checks if `stock_type === 'outsourced'`).
3. **Calculate Distance:** Converts input lat/lon and HQ coordinates to radians and executes the Haversine equation:
   ```javascript
   const toRad = (deg) => (deg * Math.PI) / 180;
   const lat1 = toRad(27.7029); // HQ Lat
   const lon1 = toRad(85.3072); // HQ Lon
   const [lat2, lon2] = receivingLocation.split(',').map(c => toRad(parseFloat(c)));
   const dLat = lat2 - lat1;
   const dLon = lon2 - lon1;
   const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
   const distanceKm = 2 * 6371 * Math.asin(Math.sqrt(a));
   ```
4. **Determine Shipping Fee:**
   * If order subtotal $\ge$ `delivery_free_threshold`, `shippingFee = 0.00`.
   * Else: `shippingFee = Math.max(delivery_min_charge, distanceKm * delivery_per_km_rate)`.
5. **Determine Sales Tax:** `tax = subtotal * (sales_tax_rate / 100)`.
6. **Total Amount:** `total = subtotal + tax + shippingFee`.
7. **Deduct Wallet Credits:** If `paymentMethod === 'store_credit'`:
   * Verifies `wallet_balance >= total`.
   * Subtracts `total` from `wallet_balance` in `users`.
   * Creates a transaction record: `type = 'purchase'`, `amount = -total`.
   * Sets `payment_status = 'paid'`.
8. **Tracking ID & ETA Generation:**
   * Tracking ID: `HMX-` + last 6 digits of current timestamp + 4 random uppercase characters.
   * Maximum processing delay `outsource_days` among all checked items determines Delivery ETA:
     $$\text{ETA Min} = \max(\text{outsource\_days}) + 1$$
     $$\text{ETA Max} = \max(\text{outsource\_days}) + 2$$
9. **Update Database & Send Alerts:**
   * Creates `orders` and `order_items` entries.
   * Decrements stock counts for `'in_stock'` items.
   * Empties user cart items.
   * Sends transactional email invoices.
   * If stock falls below `low_stock_threshold`, dispatches low stock alerts to subscribed admins.

---

## 3. Assembling the API Gateway

Create the main entry point [server.js](file:///c:/xampp/htdocs/codes/himalix-labs/backend/server.js):

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Media Routing
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting Protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', apiLimiter);

// Routing Layer Definitions
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const storeRoutes = require('./routes/store');
const adminRoutes = require('./routes/admin');

// Mount Modules
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/admin', adminRoutes);

// Catch-All Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Exception:', err.stack);
  res.status(500).json({ error: 'Internal server exception. Please check connection configurations.' });
});

// Run Gateway Server
app.listen(PORT, () => {
  console.log(`🚀 Himalix Labs API Gateway executing on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});
```
