# 🧪 Phase 7: Verification & Testing Blueprint

This phase outlines scripts, manual test suites, and database validation checks to verify structural changes.

---

## 1. Concurrently Runner Script

Create a root [package.json](file:///c:/xampp/htdocs/codes/himalix-labs/package.json) file in the top-level `/himalix-labs` directory to manage frontend and backend processes concurrently:

```json
{
  "name": "himalix-labs-unified",
  "version": "1.0.0",
  "description": "Unified platform for Himalix Labs & Store",
  "scripts": {
    "install:all": "npm install && npm install --prefix backend && npm install --prefix frontend",
    "dev": "concurrently \"npm run dev --prefix backend\" \"npm start --prefix frontend\""
  },
  "dependencies": {
    "concurrently": "^8.2.2"
  }
}
```

To initialize your development workspace, run:
```bash
npm install
npm run install:all
npm run dev
```

---

## 2. Authentication Verification Plan

### Test Suite A: Email/Password Registration & Login
1. **Validation Checks:** Try registering with an invalid email layout or a short password. Verify that server routing triggers a `400 Bad Request` containing validation error strings.
2. **Duplication Protection:** Attempt to register a user utilizing an existing email. Verify the server returns a `400` code warning the email is already in use.
3. **Database Checks:** Run registration successfully. Query the `users` table to verify:
   * `password_hash` is encrypted using a `bcryptjs` salt.
   * `referral_code` conforms to the prefix layout `HMX-REF-XXXXXX`.
4. **Referral Reward Checks:** Register a user by providing another user's referral code. Query the `users` table and `wallet_transactions` to verify both accounts received their credit bonuses (`referral_bonus_amount`).

### Test Suite B: Google OAuth Login
1. Ensure `google_auth_enabled` is set to `'1'` in the settings table.
2. Simulate Google credentials validation in the auth route using mock ID tokens.
3. Verify that new users are registered without standard passwords, while existing user profiles are updated with Google IDs.

---

## 3. Checkout & E-Commerce Logic Auditing

Run verification checkouts on the storefront page to validate calculation metrics:

### Test Case A: Shipping Calculations (Haversine Formula)
* **HQ Coordinates:** `Latitude: 27.7029, Longitude: 85.3072` (Kathmandu).
* **Test inputs:**
  * **Test Location:** `27.7172, 85.3240` (Kathmandu city center, ~2.2 km away).
  * **Expected Calculation:** Distance should calculate to ~2.2 kilometers. The shipping fee should equal `delivery_min_charge` (Rs. 50.00) because the distance-based rate (`2.2 * 15.00 = 33.00`) is below the minimum fee.
  * **Free Delivery Threshold:** Place an order with a subtotal $\ge$ `delivery_free_threshold` (Rs. 2000.00). Verify that the final checkout shipping fee equals `0.00`.

### Test Case B: Delivery ETA Updates
* **Order Item Stock Status:**
  * Item A: `'in_stock'` (`outsource_days = 0`).
  * Item B: `'outsourced'` (`outsource_days = 4`).
  * Item C: `'outsourced'` (`outsource_days = 2`).
* **Expected Result:** The order processing delay defaults to the maximum value among all items (`max(0, 4, 2) = 4` days).
  * Minimum Delivery ETA: `4 + 1 = 5` days.
  * Maximum Delivery ETA: `4 + 2 = 6` days.
  * Ensure the system config displays: `"Delivery expected in 5 to 6 business days"`.

### Test Case C: Transaction Security & Stock Rollbacks
* **Scenario:** Attempt checking out an order containing 5 items where 1 item's stock is below the requested quantity.
* **Expected Result:** The checkout API must block the order, return a `400` status code, rollback all inventory reductions, and keep the user's cart intact.

---

## 4. Administrative Dashboard Access Protection

1. **Role Security:** Log in with a standard account (`role = 'user'`). Attempt accessing administrative routes (`GET /api/admin/stats` or `/admin/*`). Verify the system redirects the user to the storefront or returns a `403 Forbidden` response.
2. **Access Control:** Log in as an administrator. Ensure all CMS routes and shop settings metrics display correctly in the dashboard interface.
