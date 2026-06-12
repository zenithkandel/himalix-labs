USE himalix_db;

-- ============================================================
-- 1. SYSTEM CONFIGURATION SETTINGS
-- ============================================================
INSERT INTO settings (key_name, key_value) VALUES
('low_stock_threshold', '5'),
('sales_tax_rate', '13'),
('maintenance_mode', '0'),
('store_banner_text', 'Welcome to Himalix Electronics Store — Component Procurement Redefined.'),
('google_client_id', 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'),
('google_client_secret', 'YOUR_GOOGLE_CLIENT_SECRET'),
('google_auth_enabled', '1'),
('referral_bonus_amount', '5.00'),
('social_bonus_amount', '5.00'),
('whatsapp_express_number', '9779800000000'),
('delivery_per_km_rate', '15.00'),
('delivery_min_charge', '50.00'),
('delivery_free_threshold', '2000.00');

-- ============================================================
-- 2. INITIAL SUPER ADMINISTRATOR
-- ============================================================
-- Hashed password is 'admin123' generated with bcryptjs (salt rounds = 10)
INSERT INTO users (email, password_hash, role, referral_code, wallet_balance) VALUES
('admin@himalix.com', '$2a$10$nF4N.20dM8/bLz60kQ8wUeD7b6/2R3/WJgGvK5KCePz5aG5DqK2yK', 'admin', 'HMX-REF-ADMIN1', 0.00);

-- ============================================================
-- 3. PORTFOLIO CMS LANDING CONTENT
-- ============================================================
INSERT INTO landing_content (section, content_key, content_value, content_type) VALUES
('hero', 'headline', 'Hardware Solutions & Custom 3D Prototyping.', 'text'),
('hero', 'subheadline', 'Solving market scarcity gaps for developers, engineers, and makers across Nepal.', 'text'),
('about', 'story', 'Himalix Labs was founded to solve critical technology shortages in Nepal. We provide local access to standard electronic modules and professional-grade 3D print resources.', 'text'),
('about', 'vision', 'Paving the way for digital prototyping, automated production runs, and custom engineering projects.', 'text'),
('footer', 'copyright', '© 2026 Himalix Labs. All rights reserved.', 'text');

-- ============================================================
-- 4. SERVICES DIRECTORY
-- ============================================================
INSERT INTO services (title, subtitle, description, icon_class, features, link_url, display_order, is_active) VALUES
('Himalix Store', 'Electronic Components Marketplace', 'Buy microcontrollers, modules, sensors, and development boards with instant delivery.', 'fa-light fa-sharp fa-microchip', '["Genuine Parts", "Fast Local Shipping", "Wallet System Integration"]', '/store', 1, 1),
('Himalix 3D', 'Rapid Prototyping Client Service', 'Order physical 3D models. Upload STL files and retrieve calculated quotes instantly.', 'fa-light fa-sharp fa-cube', '["PLA / ABS Filaments", "Precise Tolerances", "Batch Discounts Available"]', '/3d', 2, 1),
('Himalix Web', 'Development Agency', 'Receive professional-grade website design, systems development, and API builds.', 'fa-light fa-sharp fa-code', '["Custom Integrations", "Optimized Core Web Vitals", "SEO Engineering"]', '/web', 3, 1),
('Himalix Projects', 'Premade & Custom Projects', 'Buy predefined functional solutions or request bespoke hardware setups.', 'fa-light fa-sharp fa-gears', '["Source Code Included", "Detailed Circuit Guides", "Nepal-wide Support"]', '/project', 4, 1);

-- ============================================================
-- 5. FOUNDING TEAM MEMBERS
-- ============================================================
INSERT INTO team_members (name, role, bio, image_url, social_links, display_order, is_active) VALUES
('Sakshyam Upadhyaya', 'Founder & CEO', 'Leading technical architecture, product specifications, and general business relations.', '/uploads/team/sakshyam_u.jpg', '{"linkedin": "https://linkedin.com", "github": "https://github.com"}', 1, 1),
('Zenith Kandel', 'Co-Founder', 'Overseeing system development, database scaling, and payment processor logic.', '/uploads/team/zenith_k.jpg', '{"linkedin": "https://linkedin.com", "github": "https://github.com"}', 2, 1),
('Sakshyam Bastakoti', 'Co-Founder', 'Managing hardware prototyping, component supply chains, and 3D print calibrations.', '/uploads/team/sakshyam_b.jpg', '{"linkedin": "https://linkedin.com", "github": "https://github.com"}', 3, 1);

-- ============================================================
-- 6. CUSTOMER TESTIMONIALS
-- ============================================================
INSERT INTO testimonials (client_name, client_title, company, content, rating, display_order, is_active) VALUES
('Ramesh Adhikari', 'Robotics Coordinator', 'IOE Pulchowk', 'Himalix Labs saved our team weeks of customs delays by providing high-quality sensors locally.', 5, 1, 1),
('Sita Thapa', 'Product Designer', 'TechPro Nepal', 'The STL printing service is stellar. The crisp surfaces and tolerances matched our designs exactly.', 5, 2, 1);

-- ============================================================
-- 7. EMAIL NOTIFICATION RECEIVERS
-- ============================================================
INSERT INTO email_notification_receivers (email_address, notify_on_order_placed, notify_on_low_stock, notify_on_user_registered) VALUES
('admin@himalix.com', 1, 1, 1);
