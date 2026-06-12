const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify SMTP Connection
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ SMTP mail service verification failed. Operations emails will not send:', error.message);
  } else {
    console.log('✅ SMTP Mail Service Transporter verified successfully.');
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
    console.error(`❌ SMTP mail delivery failed to ${to}:`, error.message);
    throw error;
  }
};

module.exports = { transporter, sendMail };
