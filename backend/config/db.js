const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Helper to build database pool connections
 * @param {string} dbName - Target Database Name
 */
const createPool = (dbName) => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    port: parseInt(process.env.DB_PORT) || 3306,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    waitForConnections: true,
    queueLimit: 0
  });
};

const authPool = createPool(process.env.DB_AUTH_NAME || 'himalix_auth');
const portfolioPool = createPool(process.env.DB_PORTFOLIO_NAME || 'himalix_portfolio');
const storePool = createPool(process.env.DB_STORE_NAME || 'himalix_store');
const pool3d = createPool(process.env.DB_3D_NAME || 'himalix_3d');
const webPool = createPool(process.env.DB_WEB_NAME || 'himalix_web');
const projectPool = createPool(process.env.DB_PROJECT_NAME || 'himalix_project');

// Verify connection pools connectivity
(async () => {
  try {
    const connAuth = await authPool.getConnection();
    console.log('✅ Auth DB Connection verified successfully.');
    connAuth.release();

    const connPortfolio = await portfolioPool.getConnection();
    console.log('✅ Portfolio DB Connection verified successfully.');
    connPortfolio.release();

    const connStore = await storePool.getConnection();
    console.log('✅ Store DB Connection verified successfully.');
    connStore.release();
  } catch (err) {
    console.error('❌ Failed to establish connection with split MySQL pools:', err.message);
  }
})();

module.exports = {
  authPool,
  portfolioPool,
  storePool,
  pool3d,
  webPool,
  projectPool
};
