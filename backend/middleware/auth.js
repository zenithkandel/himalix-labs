const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Enforces JWT Authentication
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Binds payload details: { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Enforces Administrator Role Guards (Requires authMiddleware to execute first)
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Access denied. Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

/**
 * Optional Authentication Helper (Attempts JWT extraction but proceeds if empty)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
    } catch (err) {
      // Fail silently and continue as guest
    }
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuth
};
