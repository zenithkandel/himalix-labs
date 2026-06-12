const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1); // Trust proxy header (e.g., Webpack dev proxy)
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
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', apiLimiter);

// Strict Rate Limiting for Auth Actions
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
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
