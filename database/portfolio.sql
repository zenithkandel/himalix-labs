DROP DATABASE IF EXISTS himalix_portfolio;
CREATE DATABASE himalix_portfolio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE himalix_portfolio;

-- ============================================================
-- 1. CMS CONTENT
-- ============================================================
CREATE TABLE landing_content (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    section       VARCHAR(50)  NOT NULL,
    content_key   VARCHAR(100) NOT NULL,
    content_value LONGTEXT,
    content_type  ENUM('text', 'html', 'json') DEFAULT 'text',
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_section_key (section, content_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. SERVICES DIRECTORY
-- ============================================================
CREATE TABLE services (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    subtitle      VARCHAR(255),
    description   TEXT,
    icon_class    VARCHAR(100),
    features      JSON,
    link_url      VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TEAM MEMBERS
-- ============================================================
CREATE TABLE team_members (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    role          VARCHAR(100) NOT NULL,
    bio           TEXT,
    image_url     VARCHAR(500),
    social_links  JSON,
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TESTIMONIALS
-- ============================================================
CREATE TABLE testimonials (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    client_name   VARCHAR(255) NOT NULL,
    client_title  VARCHAR(255),
    company       VARCHAR(255),
    content       TEXT NOT NULL,
    rating        INT DEFAULT 5,
    image_url     VARCHAR(500),
    is_active     BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. PORTFOLIO GLOBAL SETTINGS
-- ============================================================
CREATE TABLE labs_site_settings (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    setting_key    VARCHAR(100) UNIQUE NOT NULL,
    setting_value  LONGTEXT,
    setting_type   ENUM('text', 'image', 'json', 'boolean') DEFAULT 'text',
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. CONTACT CAPTURES
-- ============================================================
CREATE TABLE contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    subject    VARCHAR(255),
    message    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED VALUES FOR PORTFOLIO
-- ============================================================
INSERT INTO landing_content (section, content_key, content_value, content_type) VALUES
('hero', 'headline', 'Hardware Solutions & Custom 3D Prototyping.', 'text'),
('hero', 'subheadline', 'Solving market scarcity gaps for developers, engineers, and makers across Nepal.', 'text'),
('about', 'story', 'Himalix Labs was founded to solve critical technology shortages in Nepal. We provide local access to standard electronic modules and professional-grade 3D print resources.', 'text'),
('about', 'vision', 'Paving the way for digital prototyping, automated production runs, and custom engineering projects.', 'text'),
('footer', 'copyright', '© 2026 Himalix Labs. All rights reserved.', 'text');

INSERT INTO services (title, subtitle, description, icon_class, features, link_url, display_order, is_active) VALUES
('Himalix Store', 'Electronic Components Marketplace', 'Buy microcontrollers, modules, sensors, and development boards with instant delivery.', 'fa-light fa-sharp fa-microchip', '["Genuine Parts", "Fast Local Shipping", "Wallet System Integration"]', '/store', 1, 1),
('Himalix 3D', 'Rapid Prototyping Client Service', 'Order physical 3D models. Upload STL files and retrieve calculated quotes instantly.', 'fa-light fa-sharp fa-cube', '["PLA / ABS Filaments", "Precise Tolerances", "Batch Discounts Available"]', '/3d', 2, 1),
('Himalix Web', 'Development Agency', 'Receive professional-grade website design, systems development, and API builds.', 'fa-light fa-sharp fa-code', '["Custom Integrations", "Optimized Core Web Vitals", "SEO Engineering"]', '/web', 3, 1),
('Himalix Projects', 'Premade & Custom Projects', 'Buy predefined functional solutions or request bespoke hardware setups.', 'fa-light fa-sharp fa-gears', '["Source Code Included", "Detailed Circuit Guides", "Nepal-wide Support"]', '/project', 4, 1);

INSERT INTO team_members (name, role, bio, image_url, social_links, display_order, is_active) VALUES
('Sakshyam Upadhyaya', 'Founder & CEO', 'Leading technical architecture, product specifications, and general business relations.', '/uploads/team/sakshyam_u.jpg', '{"linkedin": "https://linkedin.com", "github": "https://github.com"}', 1, 1),
('Zenith Kandel', 'Co-Founder', 'Overseeing system development, database scaling, and payment processor logic.', '/uploads/team/zenith_k.jpg', '{"linkedin": "https://linkedin.com", "github": "https://github.com"}', 2, 1),
('Sakshyam Bastakoti', 'Co-Founder', 'Managing hardware prototyping, component supply chains, and 3D print calibrations.', '/uploads/team/sakshyam_b.jpg', '{"linkedin": "https://linkedin.com", "github": "https://github.com"}', 3, 1);

INSERT INTO testimonials (client_name, client_title, company, content, rating, display_order, is_active) VALUES
('Ramesh Adhikari', 'Robotics Coordinator', 'IOE Pulchowk', 'Himalix Labs saved our team weeks of customs delays by providing high-quality sensors locally.', 5, 1, 1),
('Sita Thapa', 'Product Designer', 'TechPro Nepal', 'The STL printing service is stellar. The crisp surfaces and tolerances matched our designs exactly.', 5, 2, 1);
