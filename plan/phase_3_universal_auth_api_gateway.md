# 🚦 Phase 3: Universal Auth & API Gateway Blueprint

This phase configures the core authentication controllers, maps database queries to the split database pools (`portfolioPool`, `storePool`, and `authPool`), and mounts the Express gateway server [server.js](file:///c:/xampp/htdocs/codes/himalix-labs/backend/server.js).

---

## 1. Authentication Routing and Logic (Utilizes `authPool` & `storePool`)

Create the authentication controller in [authController.js](file:///c:/xampp/htdocs/codes/himalix-labs/auth/authController.js) or `backend/routes/auth.js`. All queries related to user data, wallet transactions, and social claims run against the **`himalix_auth`** database via `authPool`:

### A. Local Account Registration (`POST /api/auth/register`)
* **Security Rate-Limiter:** Protected by `authRateLimiter` (maximum 5 attempts per 15 minutes per IP).
* **Processing Flow:**
  1. Validates inputs using parameterized check to verify if the requested email already exists in `himalix_auth.users`.
  2. Hashes the raw password utilizing `bcryptjs` with a robust salt round factor of **12** (increased for peak security).
  3. Generates a new referral code: `HMX-REF-` + 6 random uppercase alphanumeric characters.
  4. Executes the following actions inside a database transaction block on `authPool`:
     * Inserts the new user record.
     * If a `referredByCode` is passed:
       * **Validation Guard:** Checks that `referredByCode` does not equal the newly generated referral code (prevents self-referral).
       * Queries the referrer ID from `himalix_auth.users` using the code.
       * If found, sets the new user's initial wallet balance to `referral_bonus_amount` (fetched from `himalix_store.settings` table) and records a `deposit` entry in `himalix_auth.wallet_transactions`.
       * Credits the referrer's wallet balance atomically and logs a `referral` transaction entry.
  5. Signs a JWT containing `{ id, email, role }` with a cryptographically secure key and set expiration to `24h` (to minimize session lifetime).
  6. Dispatches an email notification to admin email receivers in `himalix_store.email_notification_receivers`.

### B. Local Account Login (`POST /api/auth/login`)
* **Security Rate-Limiter:** Max 5 attempts per 15 minutes.
* **Processing Flow:**
  1. Queries the user by email from `himalix_auth.users`.
  2. Compares input password against `password_hash` using `bcryptjs.compare()`.
  3. If valid, signs and returns the JWT (`24h` expiration).

### C. Google Sign-In (`POST /api/auth/google`)
* **Processing Flow:**
  1. Checks the settings table in `himalix_store` to verify `google_auth_enabled === '1'`.
  2. Validates the Google ID credential token using Google's verification client (`google-auth-library`):
     ```javascript
     const { OAuth2Client } = require('google-auth-library');
     const client = new OAuth2Client(googleClientIdFromSettings);
     const ticket = await client.verifyIdToken({
         idToken: req.body.token,
         audience: googleClientIdFromSettings
     });
     const payload = ticket.getPayload(); // { email, sub (google_id), picture (avatar_url), email_verified }
     ```
  3. **Verification Guard:** Checks `payload.email_verified === true`. If false, blocks request (prevents login via unverified emails).
  4. Queries users by `google_id` in `himalix_auth.users`. If exists, issues a JWT.
  5. If user matches the `email` but has no `google_id`, links the account.
  6. If no user matches the email, inserts a new user with a null `password_hash`, generates a referral code, and issues a JWT.

### D. Settings Config API (`GET /api/auth/config`)
Returns public store variables to configuration contexts (Google Client ID, VAT rates, delivery fee parameters) by querying the `himalix_store.settings` table via `storePool`.

---

## 2. Sub-module API Routing

Create route files under `backend/routes/`:

### A. Portfolio Pages CMS: `routes/content.js` (Utilizes `portfolioPool`)
* **`GET /api/content`:** Retrieves landing page elements from `himalix_portfolio.landing_content`, active listings from `services`, `team_members`, and `testimonials`.
* **`POST /api/content/contact`:** Captures and stores contact forms in `himalix_portfolio.contact_messages` using parameterized insertions.

### B. Storefront E-Commerce: `routes/store.js` (Utilizes `storePool` & `authPool`)
* **`GET /api/store/products`:** Retrieves catalog products from `himalix_store.products`.
* **`POST /api/store/cart/add`:** Manages user shopping items in `himalix_store.cart_items`.
* **`GET /api/store/wallet/history`:** Displays users transaction ledgers from `himalix_auth.wallet_transactions` via `authPool`.

### C. Checkout API Desk (Utilizes transaction block on `storePool` & `authPool`)
* **Security Rate-Limiter:** Max 5 checkouts per minute.
* **Processing Flow:**
  The checkout endpoint `POST /api/store/orders/checkout` executes the following sequence inside a strict database transaction block (using `storePool` and `authPool`):
  1. **Fetch Cart:** Checks user cart items in `himalix_store.cart_items`. If empty, returns `400`.
  2. **Concurrency Lock:** Queries catalog stock levels using a blocking read query to prevent checkout race conditions:
     ```sql
     SELECT id, stock_quantity, stock_type, price, outsource_days FROM products WHERE id IN (?) FOR UPDATE;
     ```
  3. **Validate Stocks:** Ensures ordered quantity $\le$ product `stock_quantity` in `himalix_store.products` (unless `'outsourced'`).
  4. **Calculate Distance & Shipping Fee:** Uses the Haversine formula based on user location coordinates compared to the HQ coordinates (`27.7029, 85.3072`).
  5. **Atomic Wallet Deduction (CRITICAL Security Guard against Double Spending):**
     If `paymentMethod === 'store_credit'`, the balance update must occur atomically inside the transaction using a guard condition:
     ```sql
     UPDATE himalix_auth.users 
     SET wallet_balance = wallet_balance - ? 
     WHERE id = ? AND wallet_balance >= ?;
     ```
     * After execution, the backend checks `affectedRows === 1`.
     * If 0, it means the balance was insufficient or user did not exist. The transaction immediately rolls back and returns `400 Insufficient wallet balance` (prevents double-spending).
     * Creates a transaction record in `himalix_auth.wallet_transactions`: `type = 'purchase'`, `amount = -total`.
  6. **Apply Transaction:** Inserts records in `himalix_store.orders` and `order_items`, updates stock counts, and empties user cart.

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

// General API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', apiLimiter);

// Strict Rate Limiting for Auth Actions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: { error: 'Too many sign-in or sign-up attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);

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
