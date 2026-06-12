DROP DATABASE IF EXISTS himalix_auth;
CREATE DATABASE himalix_auth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE himalix_auth;

-- ============================================================
-- 1. USER ACCOUNT REGISTRY
-- ============================================================
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

-- ============================================================
-- 2. USER SESSIONS RECORD (Tracks login status and location context)
-- ============================================================
CREATE TABLE user_sessions (
    id              INT           NOT NULL AUTO_INCREMENT,
    user_id         INT           NOT NULL,
    session_token   VARCHAR(255)  NOT NULL,
    ip_address      VARCHAR(45)   DEFAULT NULL,
    user_agent      VARCHAR(500)  DEFAULT NULL,
    login_time      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time     TIMESTAMP     NULL DEFAULT NULL,
    is_active       TINYINT(1)    NOT NULL DEFAULT 1,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_session_token (session_token),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. WALLET LEDGER TRANSACTIONS (Linked to session for auditing)
-- ============================================================
CREATE TABLE wallet_transactions (
    id           INT            NOT NULL AUTO_INCREMENT,
    user_id      INT            NOT NULL,
    session_id   INT            DEFAULT NULL,
    amount       DECIMAL(10,2)  NOT NULL,
    type         ENUM('deposit', 'purchase', 'refund', 'referral', 'social') NOT NULL,
    reference_id VARCHAR(100)   DEFAULT NULL,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_wallet_transactions_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_wallet_transactions_session FOREIGN KEY (session_id) REFERENCES user_sessions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. SOCIAL MEDIA INCENTIVE CLAIMS
-- ============================================================
CREATE TABLE social_claims (
    user_id    INT         NOT NULL,
    platform   VARCHAR(50) NOT NULL,
    claimed_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, platform),
    CONSTRAINT fk_social_claims_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. TRANSPARENT ACTIVITY AUDIT LOGS
-- ============================================================
CREATE TABLE user_activity_logs (
    id              INT           NOT NULL AUTO_INCREMENT,
    user_id         INT           DEFAULT NULL,
    session_id      INT           DEFAULT NULL,
    action_type     VARCHAR(50)   NOT NULL, -- 'signup', 'login', 'logout', 'checkout', 'wallet_deposit', 'wallet_withdrawal', 'referral_claim', 'social_claim'
    ip_address      VARCHAR(45)   DEFAULT NULL,
    details         TEXT          DEFAULT NULL, -- Structured JSON details or custom messages
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_logs_user    FOREIGN KEY (user_id)    REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_logs_session FOREIGN KEY (session_id) REFERENCES user_sessions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DEFAULT SUPER ADMIN
-- ============================================================
INSERT INTO users (email, password_hash, role, referral_code, wallet_balance) VALUES
('admin@himalix.com', '$2a$10$5dKWNo1q8OHwznDnbgq98O8OzCptkKcnAcRuNk0ANvlA2PLL/cDuq', 'admin', 'HMX-REF-ADMIN1', 0.00);
