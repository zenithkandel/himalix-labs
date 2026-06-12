# 🚦 Phase 3: Universal Auth & API Gateway Blueprint

This phase configures the core authentication controllers, maps database queries to the split database pools (`portfolioPool` and `storePool`), and mounts the Express gateway server [server.js](file:///c:/xampp/htdocs/codes/himalix-labs/backend/server.js).

---

## 1. Authentication Routing and Logic (Utilizes `storePool`)

Create the authentication controller in [authController.js](file:///c:/xampp/htdocs/codes/himalix-labs/auth/authController.js) or `backend/routes/auth.js`. All queries run against the **`himalix_store`** database via `storePool`:

### A. Local Account Registration (`POST /api/auth/register`)
1. Checks if the requested email exists in the `users` table of `himalix_store`.
2. Hashes the raw password utilizing `bcryptjs` (salt rounds = 10).
3. Generates a new referral code: `HMX-REF-` + 6 random uppercase alphanumeric characters.
4. Executes the following actions inside a database transaction on `storePool`:
   * Inserts the new user record.
   * If `referredByCode` is passed, fetches the matching referrer ID from the same database.
   * If found, sets the new user's initial wallet balance to `referral_bonus_amount` (fetched from the settings table) and records a `deposit` entry in `wallet_transactions`.
   * Credits the referrer's wallet balance and logs a `referral` transaction entry.
5. Signs a JWT containing `{ id, email, role }`.
6. Dispatches an email notification to admin email receivers in `email_notification_receivers`.

### B. Local Account Login (`POST /api/auth/login`)
1. Queries the user by email from `himalix_store.users`.
2. Compares input password against `password_hash` using `bcryptjs.compare()`.
3. If valid, signs and returns the JWT.

### C. Google Sign-In (`POST /api/auth/google`)
1. Checks the settings table in `himalix_store` to verify `google_auth_enabled === '1'`.
2. Validates the Google ID credential token using Google's verification client (`google-auth-library`).
3. Queries users by `google_id` in `himalix_store.users`. If exists, issues a JWT.
4. If a user matches the `email` but has no `google_id`, links the account.
5. If no user matches the email, inserts a new user with a null `password_hash`, generates a referral code, and issues a JWT.

### D. Settings Config API (`GET /api/auth/config`)
Returns public store variables to configuration contexts (Google Client ID, VAT rates, delivery fee parameters) by querying the `himalix_store.settings` table.

---

## 2. Sub-module API Routing

Create route files under `backend/routes/`:

### A. Portfolio Pages CMS: `routes/content.js` (Utilizes `portfolioPool`)
* **`GET /api/content`:** Retrieves landing page elements from `himalix_portfolio.landing_content`, active listings from `services`, `team_members`, and `testimonials`.
* **`POST /api/content/contact`:** Captures and stores contact forms in `himalix_portfolio.contact_messages`.

### B. Storefront E-Commerce: `routes/store.js` (Utilizes `storePool`)
* **`GET /api/store/products`:** Retrieves catalog products from `himalix_store.products`.
* **`POST /api/store/cart/add`:** Manages user shopping items in `himalix_store.cart_items`.
* **`GET /api/store/wallet/history`:** Displays users transaction ledgers from `himalix_store.wallet_transactions`.

### C. Checkout API Desk (Utilizes `storePool` transaction block)
The checkout endpoint `POST /api/store/orders/checkout` executes the following sequence against `storePool`:
1. **Fetch Cart:** Checks user cart items in `himalix_store.cart_items`.
2. **Validate Stocks:** Ensures ordered quantity $\le$ product `stock_quantity` in `himalix_store.products` (unless `'outsourced'`).
3. **Calculate Distance & Shipping Fee:** Uses the Haversine formula based on user location coordinates compared to the HQ coordinates (`27.7029, 85.3072`).
4. **Deduct Wallet Credits:** If `paymentMethod === 'store_credit'`, verifies `wallet_balance >= total` and updates user table balance and transactions.
5. **Tracking & ETA:** Generates a random tracking code and calculates the ETA based on `max(outsource_days)`.
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

// Rate Limiting Protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
