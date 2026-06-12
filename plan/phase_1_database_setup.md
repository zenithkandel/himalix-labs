# 🗄️ Phase 1: Database Setup & Seeding Blueprint

This phase outlines the configuration, creation, and seeding of the five segregated databases for the Himalix Labs platform:
1. `himalix_portfolio` (CMS content, services, team, testimonials, message captures, and site settings)
2. `himalix_store` (user accounts, products catalog, carts, orders, reviews, wallet logs, config settings, and notification receivers)
3. `himalix_3d` (3D printing contracts data - skeleton)
4. `himalix_web` (web agency details - skeleton)
5. `himalix_project` (robotics projects - skeleton)

---

## 1. Schema Specifications by File

The SQL files must be created under the `/database` directory of the workspace.

### A. General Portfolio CMS: [portfolio.sql](file:///c:/xampp/htdocs/codes/himalix-labs/database/portfolio.sql)
Creates `himalix_portfolio` database, defining landing content, services, testimonials, team members, contact messaging structures, and seeds them.

```sql
DROP DATABASE IF EXISTS himalix_portfolio;
CREATE DATABASE himalix_portfolio
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE himalix_portfolio;

-- 1. CMS CONTENT
CREATE TABLE landing_content (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    section       VARCHAR(50)  NOT NULL,
    content_key   VARCHAR(100) NOT NULL,
    content_value LONGTEXT,
    content_type  ENUM('text', 'html', 'json') DEFAULT 'text',
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_section_key (section, content_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PORTFOLIO SERVICES
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

-- 3. TEAM MEMBERS
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

-- 4. TESTIMONIALS
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

-- 5. PORTFOLIO GLOBAL SETTINGS
CREATE TABLE labs_site_settings (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    setting_key    VARCHAR(100) UNIQUE NOT NULL,
    setting_value  LONGTEXT,
    setting_type   ENUM('text', 'image', 'json', 'boolean') DEFAULT 'text',
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CONTACT CAPTURES
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
-- SEEDS FOR PORTFOLIO
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
```

### B. Store E-Commerce: [store.sql](file:///c:/xampp/htdocs/codes/himalix-labs/database/store.sql)
Creates `himalix_store` database, defining catalog tables, carts, orders, reviews, transaction logs, and seeds settings and default admin user credentials.

```sql
DROP DATABASE IF EXISTS himalix_store;
CREATE DATABASE himalix_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE himalix_store;

-- 1. USERS REGISTRY
CREATE TABLE users (
    id              INT           NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)  NOT NULL,
    password_hash   VARCHAR(255)  DEFAULT NULL,
    google_id       VARCHAR(255)  DEFAULT NULL,
    avatar_url      VARCHAR(500)  DEFAULT NULL,
    role            ENUM('user','admin') NOT NULL DEFAULT 'user',
    wallet_balance  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    referral_code   VARCHAR(50)   DEFAULT NULL,
    referred_by     INT           DEFAULT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_google_id (google_id),
    UNIQUE KEY uq_users_referral_code (referral_code),
    CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PRODUCTS CATALOG
CREATE TABLE products (
    id               INT           NOT NULL AUTO_INCREMENT,
    name             VARCHAR(255)  NOT NULL,
    sku              VARCHAR(100)  NOT NULL,
    description      TEXT          DEFAULT NULL,
    technical_specs  JSON          DEFAULT NULL,
    price            DECIMAL(10,2) NOT NULL,
    stock_quantity   INT           NOT NULL DEFAULT 0,
    image_url        VARCHAR(500)  DEFAULT NULL,
    category         VARCHAR(100)  DEFAULT NULL,
    stock_type       VARCHAR(20)   NOT NULL DEFAULT 'in_stock',
    outsource_days   INT           NOT NULL DEFAULT 0,
    cost_price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_urls       JSON          DEFAULT NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. SHOPPING CART ITEMS
CREATE TABLE cart_items (
    id         INT       NOT NULL AUTO_INCREMENT,
    user_id    INT       NOT NULL,
    product_id INT       NOT NULL,
    quantity   INT       NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cart_items_user_product (user_id, product_id),
    CONSTRAINT fk_cart_items_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ORDERS
CREATE TABLE orders (
    id               INT           NOT NULL AUTO_INCREMENT,
    user_id          INT           DEFAULT NULL,
    total_amount     DECIMAL(10,2) NOT NULL,
    status           VARCHAR(50)   NOT NULL DEFAULT 'pending',
    tracking_code    VARCHAR(100)  NOT NULL,
    shipping_address TEXT          DEFAULT NULL,
    payment_method   VARCHAR(50)   NOT NULL DEFAULT 'cash',
    payment_status   VARCHAR(50)   NOT NULL DEFAULT 'unpaid',
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ORDER LINE ITEMS
CREATE TABLE order_items (
    id         INT            NOT NULL AUTO_INCREMENT,
    order_id   INT            NOT NULL,
    product_id INT            NOT NULL,
    quantity   INT            NOT NULL DEFAULT 1,
    price      DECIMAL(10,2)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PRODUCT REVIEWS
CREATE TABLE reviews (
    id         INT       NOT NULL AUTO_INCREMENT,
    user_id    INT       NOT NULL,
    product_id INT       NOT NULL,
    rating     INT       NOT NULL,
    comment    TEXT      DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_reviews_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. WALLET LEDGER TRANSACTIONS
CREATE TABLE wallet_transactions (
    id           INT            NOT NULL AUTO_INCREMENT,
    user_id      INT            NOT NULL,
    amount       DECIMAL(10,2)  NOT NULL,
    type         ENUM('deposit', 'purchase', 'refund', 'referral', 'social') NOT NULL,
    reference_id VARCHAR(100)   DEFAULT NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_wallet_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SOCIAL MEDIA FOLLOW CLAIMS
CREATE TABLE social_claims (
    user_id    INT         NOT NULL,
    platform   VARCHAR(50) NOT NULL,
    claimed_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, platform),
    CONSTRAINT fk_social_claims_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CONFIGURATION SETTINGS
CREATE TABLE settings (
    key_name  VARCHAR(255) NOT NULL,
    key_value TEXT         DEFAULT NULL,
    PRIMARY KEY (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. NOTIFICATION RECEIVERS
CREATE TABLE email_notification_receivers (
    id                        INT          NOT NULL AUTO_INCREMENT,
    email_address             VARCHAR(255) NOT NULL,
    notify_on_order_placed    TINYINT(1)   NOT NULL DEFAULT 1,
    notify_on_low_stock       TINYINT(1)   NOT NULL DEFAULT 1,
    notify_on_user_registered TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_receivers_email (email_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEEDS FOR STORE
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

-- Default Super Admin (bcrypt hash of admin123)
INSERT INTO users (email, password_hash, role, referral_code, wallet_balance) VALUES
('admin@himalix.com', '$2a$10$nF4N.20dM8/bLz60kQ8wUeD7b6/2R3/WJgGvK5KCePz5aG5DqK2yK', 'admin', 'HMX-REF-ADMIN1', 0.00);

-- Default notification alerts
INSERT INTO email_notification_receivers (email_address, notify_on_order_placed, notify_on_low_stock, notify_on_user_registered) VALUES
('admin@himalix.com', 1, 1, 1);
```

### C. 3D Printing Database: [3d.sql](file:///c:/xampp/htdocs/codes/himalix-labs/database/3d.sql)
Initializes the database `himalix_3d`.
```sql
DROP DATABASE IF EXISTS himalix_3d;
CREATE DATABASE himalix_3d
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### D. Web Agency Database: [web.sql](file:///c:/xampp/htdocs/codes/himalix-labs/database/web.sql)
Initializes the database `himalix_web`.
```sql
DROP DATABASE IF EXISTS himalix_web;
CREATE DATABASE himalix_web
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### E. Robotics Projects Database: [project.sql](file:///c:/xampp/htdocs/codes/himalix-labs/database/project.sql)
Initializes the database `himalix_project`.
```sql
DROP DATABASE IF EXISTS himalix_project;
CREATE DATABASE himalix_project
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

---

## 2. Verification Plan

### Automated Database Provisioning Check
We will build the databases using XAMPP's command line interface:
```bash
c:\xampp\mysql\bin\mysql.exe -u root -e "source c:/xampp/htdocs/codes/himalix-labs/database/portfolio.sql;"
c:\xampp\mysql\bin\mysql.exe -u root -e "source c:/xampp/htdocs/codes/himalix-labs/database/store.sql;"
c:\xampp\mysql\bin\mysql.exe -u root -e "source c:/xampp/htdocs/codes/himalix-labs/database/3d.sql;"
c:\xampp\mysql\bin\mysql.exe -u root -e "source c:/xampp/htdocs/codes/himalix-labs/database/web.sql;"
c:\xampp\mysql\bin\mysql.exe -u root -e "source c:/xampp/htdocs/codes/himalix-labs/database/project.sql;"
```

### Verification Verification Steps
- List databases to ensure all 5 are present:
  `mysql -u root -e "SHOW DATABASES;"`
- Inspect tables inside `himalix_portfolio` and `himalix_store` databases.
- Confirm seed administrative account and configurations are present.
