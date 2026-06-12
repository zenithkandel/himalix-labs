const express = require('express');
const router = express.Router();
const { portfolioPool } = require('../config/db');
const { logActivity } = require('../utils/logger');

/**
 * Fetch Unified Landing Page Portfolio Content
 * GET /api/content
 */
router.get('/', async (req, res) => {
  try {
    // 1. Query general section texts (landing_content)
    const [contentRows] = await portfolioPool.execute('SELECT section, content_key, content_value FROM landing_content');
    const sections = {};
    contentRows.forEach(row => {
      if (!sections[row.section]) {
        sections[row.section] = {};
      }
      sections[row.section][row.content_key] = row.content_value;
    });

    // 2. Query active services (services) sorted by display_order
    const [serviceRows] = await portfolioPool.execute(
      'SELECT id, title, subtitle, description, icon_class, features, link_url FROM services WHERE is_active = 1 ORDER BY display_order ASC'
    );
    // Parse JSON features array list
    const services = serviceRows.map(s => ({
      ...s,
      features: typeof s.features === 'string' ? JSON.parse(s.features) : s.features
    }));

    // 3. Query active team members (team_members)
    const [teamRows] = await portfolioPool.execute(
      'SELECT id, name, role, bio, image_url, social_links FROM team_members WHERE is_active = 1 ORDER BY display_order ASC'
    );
    const team = teamRows.map(t => ({
      ...t,
      social_links: typeof t.social_links === 'string' ? JSON.parse(t.social_links) : t.social_links
    }));

    // 4. Query active customer testimonials (testimonials)
    const [testimonialRows] = await portfolioPool.execute(
      'SELECT id, client_name, client_title, company, content, rating, image_url FROM testimonials WHERE is_active = 1 ORDER BY display_order ASC'
    );

    // 5. Query global site settings configurations (labs_site_settings)
    const [settingRows] = await portfolioPool.execute('SELECT setting_key, setting_value FROM labs_site_settings');
    const settings = {};
    settingRows.forEach(s => {
      settings[s.setting_key] = s.setting_value;
    });

    res.json({
      sections,
      services,
      team,
      testimonials: testimonialRows,
      settings
    });

  } catch (err) {
    console.error('Landing CMS Query Exception:', err.message);
    res.status(500).json({ error: 'Failed to retrieve portfolio page parameters.' });
  }
});

/**
 * Capture Contact Lead Inquiries
 * POST /api/content/contact
 */
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || null;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message inputs are required.' });
  }

  try {
    // Insert contact captures message
    await portfolioPool.execute(
      'INSERT INTO contact_messages (name, email, subject, message, is_read) VALUES (?, ?, ?, ?, 0)',
      [name, email, subject || null, message]
    );

    // Log Activity as guest context (userId = null, sessionId = null)
    await logActivity(null, null, 'contact_message_submitted', ip, { name, email, subject });

    res.status(201).json({ message: 'Support message logged successfully. Our coordinators will reach out shortly.' });
  } catch (err) {
    console.error('Contact lead capture exception:', err.message);
    res.status(500).json({ error: 'Failed to record lead message.' });
  }
});

module.exports = router;
