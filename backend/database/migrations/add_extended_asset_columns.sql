-- ============================================================
-- Migration: Add extended asset columns
-- Run this once against your gha_asset_manager database.
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
-- ============================================================
USE gha_asset_manager;

-- ── General asset additions ──────────────────────────────────
ALTER TABLE `assets`
    ADD COLUMN IF NOT EXISTS `sizes`               VARCHAR(255)   DEFAULT NULL AFTER `notes`,
    ADD COLUMN IF NOT EXISTS `color`               VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `room_number`         VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `desk_number`         VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `room_name`           VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `staff_assigned_to`   VARCHAR(255)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `staff_id`            VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `type`                VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `custodian_address`   VARCHAR(255)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `custodian_mobile`    VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `brand_name`          VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `model`               VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `asset_tag`           VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `has_asset_tag`       ENUM('Yes','No') DEFAULT 'No',
    ADD COLUMN IF NOT EXISTS `memory_size`         VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `processor`           VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `generation`          VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `storage_size`        VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `route_name`          VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `quantity`            INT            DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `capacity`            VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `expiry_date`         DATE           DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `warranty_expiry`     DATE           DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `receipt_url`         TEXT           DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `owner_division`      VARCHAR(100)   DEFAULT NULL,

    -- Financial / bank fields
    ADD COLUMN IF NOT EXISTS `bank_name`           VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `account_number`      VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `account_type`        VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `branch`              VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `currency`            VARCHAR(20)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `balance_amount`      DECIMAL(15,2)  DEFAULT NULL,

    -- Fleet / vehicle specific
    ADD COLUMN IF NOT EXISTS `year_of_manufacture` YEAR           DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `fuel_type`           VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `transmission`        VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `engine_size`         VARCHAR(20)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `mileage`             VARCHAR(100)   DEFAULT NULL,

    -- ICT / Network specific
    ADD COLUMN IF NOT EXISTS `ip_address`          VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `port_count`          VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `printer_type`        VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `scanner_type`        VARCHAR(100)   DEFAULT NULL,

    -- Intangible / Software specific
    ADD COLUMN IF NOT EXISTS `license_type`        VARCHAR(100)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `software_version`    VARCHAR(50)    DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `license_key`         VARCHAR(255)   DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `vendor`              VARCHAR(100)   DEFAULT NULL;

-- Verify the migration ran
SELECT 'Migration complete: extended asset columns added.' AS status;
