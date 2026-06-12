# ⚙️ Phase 2: Shared Backend Core & Configuration Blueprint

This phase configures the core runtime variables, database pools, Nodemailer services, and secure middleware routines for the Express server backend.

---

## 1. Backend Runtime Dependencies

Create a [package.json](file:///c:/xampp/htdocs/codes/himalix-labs/backend/package.json) file under the `/backend` directory containing the following JSON descriptor:

```json
{
  "name": "himalix-backend",
  "version": "1.0.0",
  "description": "API Gateway and Backend Engine for Himalix Labs",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "google-auth-library": "^9.9.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.9.7",
    "nodemailer": "^6.9.13"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

## 2. Server Configuration Variables

Create an environment configuration template named [.env](file:///c:/xampp/htdocs/codes/himalix-labs/backend/.env):

```ini
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Credentials
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=himalix_db
DB_PORT=3306
DB_CONNECTION_LIMIT=20

# JWT Cryptographic Credentials
JWT_SECRET=super_cryptographic_and_secure_himalix_labs_jwt_secret_key_2026
JWT_EXPIRE=7d

# Nodemailer SMTP Variables
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@himalixlab.com
SMTP_PASS=your_app_password
EMAIL_FROM=alerts@himalixlab.com
```

---

## 3. Database Pool Connector

Create the database connection pool in [db.js](file:///c:/xampp/htdocs/codes/himalix-labs/backend/config/db.js). It enables dynamic query execution with asynchronous `mysql2/promise` capabilities:

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'himalix_db',
  port: process.env.DB_PORT || 3306,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0
});

// Verify Connection Flow
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Pool established successfully with ' + process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ Failed to establish connection with MySQL Database pool:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;
```

---

## 4. Mail Service Transporter

Create the Nodemailer configuration in [mail.js](file:///c:/xampp/htdocs/codes/himalix-labs/backend/config/mail.js):

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify Transport Configuration
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ Mail service verification failed. Emails will not send:', error.message);
  } else {
    console.log('✅ Mail Service Transporter verified successfully.');
  }
});

/**
 * Global Email Delivery Helper
 * @param {string} to - Destination Address
 * @param {string} subject - Email Subject Line
 * @param {string} html - HTML Content
 */
const sendMail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Himalix Labs'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    return info;
  } catch (error) {
    console.error(`❌ Mail delivery failed to ${to}:`, error.message);
    throw error;
  }
};

module.exports = { transporter, sendMail };
```

---

## 5. Security & Authentication Middlewares

Create the authentication verification functions in [auth.js](file:///c:/xampp/htdocs/codes/himalix-labs/auth/authMiddleware.js) or `backend/middleware/auth.js`:

```javascript
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Enforces JWT Authentication
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Binds fields: { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Access token expired or invalid.' });
  }
};

/**
 * Enforces Administrator Privileges (Requires authMiddleware to run first)
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required before check.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

/**
 * Optional Authentication Extractor (Does not block requests)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
    } catch (err) {
      // Fail silently and proceed
    }
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuth };
```
