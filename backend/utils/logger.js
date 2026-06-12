const { authPool } = require('../config/db');

/**
 * Automates logging of user activities to the auth audit trails table
 * @param {number|null} userId - The acting user ID
 * @param {number|null} sessionId - The current active session database ID
 * @param {string} actionType - Category string (e.g. 'signup', 'login', 'checkout')
 * @param {string|null} ip - Client IP address
 * @param {object|null} details - Structured JSON data for audit metrics
 */
const logActivity = async (userId, sessionId, actionType, ip, details = null) => {
  try {
    const detailsStr = details ? JSON.stringify(details) : null;
    await authPool.execute(
      `INSERT INTO user_activity_logs (user_id, session_id, action_type, ip_address, details) VALUES (?, ?, ?, ?, ?)`,
      [userId, sessionId, actionType, ip, detailsStr]
    );
  } catch (err) {
    console.error('❌ Logger Exception: Failed to record user activity trail:', err.message);
  }
};

module.exports = { logActivity };
