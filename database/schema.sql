-- ====================================================================
-- MULTI-TENANT LOYALTY SAAS PLATFORM - MYSQL DATABASE SCHEMA
-- Target Database: MySQL 8.0+ / MariaDB 10.5+
-- ====================================================================


-- --------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores system users across all roles (PLATFORM_ADMIN, BUSINESS_OWNER, CASHIER, CUSTOMER)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `email` VARCHAR(191) NULL UNIQUE,
  `mobile_number` VARCHAR(20) NULL UNIQUE,
  `full_name` VARCHAR(191) NOT NULL,
  `role` ENUM('PLATFORM_ADMIN', 'BUSINESS_OWNER', 'BRANCH_MANAGER', 'CASHIER', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_mobile` (`mobile_number`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. BUSINESSES (TENANTS) TABLE
-- Holds multi-tenant business configurations (e.g. Indian Oil, Bharat Petroleum)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `businesses` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(64) NOT NULL UNIQUE,
  `logo_url` TEXT NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `reward_percentage` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  `min_redeem_points` INT NOT NULL DEFAULT 100,
  `point_value_in_currency` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_businesses_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. BRANCHES TABLE
-- Retail station / branch locations associated with a business tenant
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `branches` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `business_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_branches_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_business_branch_code` (`business_id`, `code`),
  INDEX `idx_branches_business` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. EMPLOYEES TABLE
-- Staff accounts (Owners, Managers, Cashiers) tied to businesses & branches
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `business_id` VARCHAR(64) NOT NULL,
  `branch_id` VARCHAR(64) NULL,
  `role` ENUM('BUSINESS_OWNER', 'BRANCH_MANAGER', 'CASHIER') NOT NULL,
  `employee_code` VARCHAR(64) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employees_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employees_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  INDEX `idx_employees_business` (`business_id`),
  INDEX `idx_employees_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. CUSTOMERS TABLE
-- Customer profiles mapped to user identities
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `mobile_number` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `universal_qr_code` VARCHAR(128) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_customers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_customers_mobile` (`mobile_number`),
  INDEX `idx_customers_qr` (`universal_qr_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. BUSINESS MEMBERSHIPS TABLE
-- Connects Customers to specific Business Tenants (QR Membership code)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_memberships` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `customer_id` VARCHAR(64) NOT NULL,
  `business_id` VARCHAR(64) NOT NULL,
  `membership_code` VARCHAR(128) NOT NULL UNIQUE,
  `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_memberships_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_memberships_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_customer_business` (`customer_id`, `business_id`),
  INDEX `idx_memberships_code` (`membership_code`),
  INDEX `idx_memberships_tenant` (`business_id`, `customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. REWARD ACCOUNTS TABLE
-- Customer reward point account balances per business tenant
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reward_accounts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `membership_id` VARCHAR(64) NOT NULL UNIQUE,
  `customer_id` VARCHAR(64) NULL,
  `business_id` VARCHAR(64) NOT NULL,
  `balance` INT NOT NULL DEFAULT 0,
  `currency` VARCHAR(32) NOT NULL DEFAULT 'Points',
  `currency_name` VARCHAR(32) NOT NULL DEFAULT 'Points',
  `status` ENUM('ACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_reward_accounts_membership` FOREIGN KEY (`membership_id`) REFERENCES `business_memberships` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reward_accounts_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  INDEX `idx_reward_accounts_tenant` (`business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. REWARD TRANSACTIONS (IMMUTABLE DOUBLE-ENTRY LEDGER)
-- Ledger table recording all point credits, redemptions & adjustments
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reward_transactions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `reward_account_id` VARCHAR(64) NOT NULL,
  `wallet_id` VARCHAR(64) NULL,
  `membership_id` VARCHAR(64) NOT NULL,
  `business_id` VARCHAR(64) NOT NULL,
  `branch_id` VARCHAR(64) NULL,
  `cashier_user_id` VARCHAR(64) NULL,
  `type` ENUM('CREDIT', 'EARN', 'REDEEM', 'REVERSAL', 'ADJUSTMENT') NOT NULL,
  `points` INT NOT NULL,
  `bill_amount` DECIMAL(12,2) NULL,
  `bill_number` VARCHAR(100) NULL,
  `reference` VARCHAR(128) NOT NULL,
  `narration` TEXT NOT NULL,
  `balance_after` INT NOT NULL,
  `business_name` VARCHAR(255) NULL,
  `branch_name` VARCHAR(255) NULL,
  `cashier_name` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_tx_reward_account` FOREIGN KEY (`reward_account_id`) REFERENCES `reward_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tx_membership` FOREIGN KEY (`membership_id`) REFERENCES `business_memberships` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tx_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tx_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  UNIQUE KEY `uk_business_bill` (`business_id`, `bill_number`),
  INDEX `idx_tx_reward_account_created` (`reward_account_id`, `created_at`),
  INDEX `idx_tx_tenant` (`business_id`),
  INDEX `idx_tx_reference` (`reference`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 9. OTP REQUESTS TABLE
-- Out-of-band verification OTP storage for Customer Logins & Redemptions
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otp_requests` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `mobile_number` VARCHAR(20) NOT NULL,
  `otp` VARCHAR(10) NOT NULL,
  `type` ENUM('LOGIN', 'REDEMPTION') NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `attempts` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_otp_mobile_verified` (`mobile_number`, `is_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 10. AUDIT LOGS TABLE
-- System security & administrative event audit trail
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `business_id` VARCHAR(64) NULL,
  `actor_user_id` VARCHAR(64) NULL,
  `actor_role` VARCHAR(64) NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `details` TEXT NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `business_name` VARCHAR(255) NULL,
  `actor_name` VARCHAR(255) NULL,
  INDEX `idx_audit_business` (`business_id`),
  INDEX `idx_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 11. SMS LOGS TABLE
-- Outbound SMS notification dispatch history
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sms_logs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `recipient_mobile` VARCHAR(20) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('SENT', 'DELIVERED') NOT NULL DEFAULT 'SENT',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_sms_mobile` (`recipient_mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 12. NOTIFICATIONS QUEUE TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications_queue` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `recipient_mobile` VARCHAR(20) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `provider` VARCHAR(50) NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `max_attempts` INT NOT NULL DEFAULT 3,
  `error` TEXT NULL,
  `message_id` VARCHAR(100) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sent_at` DATETIME(3) NULL,
  `failed_at` DATETIME(3) NULL,
  INDEX `idx_notif_mobile` (`recipient_mobile`),
  INDEX `idx_notif_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 13. REWARDS CATALOG TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rewards` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `merchant_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `points_required` INT NOT NULL,
  `cash_value` DECIMAL(10,2) NULL,
  `type` VARCHAR(50) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_rewards_merchant` (`merchant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 14. REDEMPTIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `redemptions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `merchant_id` VARCHAR(64) NOT NULL,
  `customerId` VARCHAR(64) NOT NULL,
  `customer_merchant_loyalty_account_id` VARCHAR(64) NOT NULL,
  `reward_id` VARCHAR(64) NOT NULL,
  `reward_name` VARCHAR(255) NOT NULL,
  `reward_type` VARCHAR(50) NOT NULL,
  `points_redeemed` INT NOT NULL,
  `cash_value` DECIMAL(10,2) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  `processed_by_employee_id` VARCHAR(64) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_redemptions_merchant` (`merchant_id`),
  INDEX `idx_redemptions_customer` (`customerId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 15. MERCHANT SMS CONFIGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `merchant_sms_configs` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `merchant_id` VARCHAR(64) NOT NULL UNIQUE,
  `provider` VARCHAR(50) NOT NULL,
  `sender_id` VARCHAR(50) NOT NULL,
  `dlt_entity_id` VARCHAR(100) NULL,
  `transaction_template_id` VARCHAR(100) NULL,
  `otp_template_id` VARCHAR(100) NULL,
  `welcome_template_id` VARCHAR(100) NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- SEED INITIAL SEED DATA
-- ====================================================================

-- 1. Platform Admin User
INSERT INTO `users` (`id`, `email`, `mobile_number`, `full_name`, `role`, `is_active`)
VALUES ('usr-admin-01', 'admin@platform.com', '9999999999', 'Super Admin', 'PLATFORM_ADMIN', 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 2. Businesses
INSERT INTO `businesses` (`id`, `name`, `code`, `logo_url`, `category`, `reward_percentage`, `min_redeem_points`, `point_value_in_currency`, `is_active`)
VALUES 
('biz-ioc-01', 'Indian Oil', 'IOCL', 'https://images.unsplash.com/photo-1545261380-0b6121c42ea9?w=150&auto=format&fit=crop&q=80', 'Fuel & Energy', 5.00, 100, 1.00, 1),
('biz-par-02', 'Paradise Biryani', 'PARADISE', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&auto=format&fit=crop&q=80', 'Dining & Food', 10.00, 200, 1.00, 1),
('biz-rel-03', 'Reliance Smart', 'RELIANCE', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80', 'Supermarket & Retail', 3.00, 50, 1.00, 1),
('biz-bpcl-04', 'Bharat Petroleum', 'BPCL', 'https://images.unsplash.com/photo-1527018606416-a658a77b121d?w=150&auto=format&fit=crop&q=80', 'Fuel & Energy', 6.00, 100, 1.00, 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Branches
INSERT INTO `branches` (`id`, `business_id`, `name`, `code`, `address`, `city`, `phone`, `is_active`)
VALUES
('br-io-01', 'biz-ioc-01', 'Koramangala Energy Station', 'IO-KM-01', '100 Feet Road, Koramangala', 'Bengaluru', '+91 9800000001', 1),
('br-io-02', 'biz-ioc-01', 'Indiranagar Service Point', 'IO-IN-02', '12th Main Road, Indiranagar', 'Bengaluru', '+91 9800000002', 1),
('br-par-01', 'biz-par-02', 'Secunderabad Flagship', 'PAR-SEC-01', 'MG Road, Secunderabad', 'Hyderabad', '+91 9800000003', 1),
('br-bp-01', 'biz-bpcl-04', 'MG Road Energy Station', 'BP-MG-01', '220 MG Road', 'Bengaluru', '+91 9800000005', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Owners & Cashiers Users
INSERT INTO `users` (`id`, `email`, `mobile_number`, `full_name`, `role`, `is_active`)
VALUES
('usr-io-owner', 'owner@indianoil.in', '9800000010', 'Rajesh Sharma (Owner)', 'BUSINESS_OWNER', 1),
('usr-io-cashier', 'cashier.indianoil@platform.com', '9800000011', 'Suresh Kumar (Cashier)', 'CASHIER', 1),
('usr-bp-owner', 'owner@bharatpetroleum.in', '9800000040', 'Sunil Verma (Owner)', 'BUSINESS_OWNER', 1),
('usr-bp-cashier', 'cashier.bharatpetroleum@platform.com', '9800000041', 'Amit Kumar (Cashier)', 'CASHIER', 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Employees
INSERT INTO `employees` (`id`, `user_id`, `business_id`, `branch_id`, `role`, `employee_code`)
VALUES
('emp-io-owner', 'usr-io-owner', 'biz-ioc-01', NULL, 'BUSINESS_OWNER', 'EMP-IO-001'),
('emp-io-cashier', 'usr-io-cashier', 'biz-ioc-01', 'br-io-01', 'CASHIER', 'EMP-IO-002'),
('emp-bp-owner', 'usr-bp-owner', 'biz-bpcl-04', NULL, 'BUSINESS_OWNER', 'EMP-BP-001'),
('emp-bp-cashier', 'usr-bp-cashier', 'biz-bpcl-04', 'br-bp-01', 'CASHIER', 'EMP-BP-002')
ON DUPLICATE KEY UPDATE `employee_code` = VALUES(`employee_code`);

-- 5. Customer 1 (Rahul Verma)
INSERT INTO `users` (`id`, `email`, `mobile_number`, `full_name`, `role`, `is_active`)
VALUES ('usr-cust-01', 'rahul.verma@example.com', '9876543210', 'Rahul Verma', 'CUSTOMER', 1)
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

INSERT INTO `customers` (`id`, `user_id`, `mobile_number`, `name`, `email`)
VALUES ('cust-01', 'usr-cust-01', '9876543210', 'Rahul Verma', 'rahul.verma@example.com')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Memberships for Customer 1
INSERT INTO `business_memberships` (`id`, `customer_id`, `business_id`, `membership_code`, `status`)
VALUES
('mem-cust1-io', 'cust-01', 'biz-ioc-01', 'MEM-IO-9876543210', 'ACTIVE'),
('mem-cust1-par', 'cust-01', 'biz-par-02', 'MEM-PAR-9876543210', 'ACTIVE'),
('mem-cust1-rel', 'cust-01', 'biz-rel-03', 'MEM-REL-9876543210', 'ACTIVE'),
('mem-cust1-bp', 'cust-01', 'biz-bpcl-04', 'MEM-BPCL-9876543210', 'ACTIVE')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`);

-- Reward Accounts for Customer 1
INSERT INTO `reward_accounts` (`id`, `membership_id`, `business_id`, `balance`, `currency_name`, `status`)
VALUES
('wal-cust1-io', 'mem-cust1-io', 'biz-ioc-01', 850, 'Points', 'ACTIVE'),
('wal-cust1-par', 'mem-cust1-par', 'biz-par-02', 1200, 'Points', 'ACTIVE'),
('wal-cust1-rel', 'mem-cust1-rel', 'biz-rel-03', 430, 'Points', 'ACTIVE'),
('wal-cust1-bp', 'mem-cust1-bp', 'biz-bpcl-04', 620, 'Points', 'ACTIVE')
ON DUPLICATE KEY UPDATE `balance` = VALUES(`balance`);

-- Reward Transactions for Customer 1
INSERT INTO `reward_transactions` (`id`, `reward_account_id`, `membership_id`, `business_id`, `branch_id`, `cashier_user_id`, `type`, `points`, `bill_amount`, `reference`, `narration`, `balance_after`)
VALUES
('tx-001', 'wal-cust1-io', 'mem-cust1-io', 'biz-ioc-01', 'br-io-01', 'usr-io-cashier', 'CREDIT', 250, 5000.00, 'BILL-IOCL-1029', 'Points earned for fuel refill of ₹5,000', 850),
('tx-002', 'wal-cust1-par', 'mem-cust1-par', 'biz-par-02', 'br-par-01', NULL, 'CREDIT', 400, 4000.00, 'BILL-PAR-8831', 'Points earned for dining order of ₹4,000', 1200),
('tx-003', 'wal-cust1-rel', 'mem-cust1-rel', 'biz-rel-03', NULL, NULL, 'CREDIT', 430, 14333.00, 'BILL-REL-9921', 'Points earned for grocery shopping of ₹14,333', 430),
('tx-004', 'wal-cust1-bp', 'mem-cust1-bp', 'biz-bpcl-04', 'br-bp-01', 'usr-bp-cashier', 'CREDIT', 620, 10333.00, 'BILL-BPCL-4091', 'Points earned for ₹10,333 fuel purchase at Bharat Petroleum', 620)
ON DUPLICATE KEY UPDATE `points` = VALUES(`points`);
