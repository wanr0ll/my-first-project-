-- ============================================================
-- GHA Asset Manager PostgreSQL Database Schema
-- Run this script against your PostgreSQL database instance.
-- Compatible with PostgreSQL 12+
-- ============================================================

-- Optional: Create database manually if executing via psql CLI:
-- CREATE DATABASE gha_asset_manager;

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigger function to automatically update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- 1. Users Table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    position VARCHAR(100) DEFAULT NULL,
    division VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    profile_image TEXT,
    permissions JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP NULL DEFAULT NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expiry TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_division ON users(division);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================
-- 2. Vehicles Table
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    division VARCHAR(100),
    chassis_number VARCHAR(100),
    engine_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost NUMERIC(12, 2),
    last_service_date DATE,
    last_inspection_date DATE,
    approval_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_division ON vehicles(division);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================
-- 3. Furniture Table
-- ============================================================
CREATE TABLE IF NOT EXISTS furniture (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    division VARCHAR(100),
    quantity INT DEFAULT 1,
    asset_condition VARCHAR(50) DEFAULT 'Good',
    status VARCHAR(50) DEFAULT 'Good',
    location VARCHAR(255),
    purchase_date DATE,
    purchase_cost NUMERIC(12, 2),
    approval_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_furniture_status ON furniture(status);
CREATE INDEX IF NOT EXISTS idx_furniture_division ON furniture(division);
CREATE INDEX IF NOT EXISTS idx_furniture_condition ON furniture(asset_condition);

DROP TRIGGER IF EXISTS trg_furniture_updated_at ON furniture;
CREATE TRIGGER trg_furniture_updated_at BEFORE UPDATE ON furniture FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================
-- 4. Electronics Table
-- ============================================================
CREATE TABLE IF NOT EXISTS electronics (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    assigned_to VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Active',
    division VARCHAR(100),
    purchase_date DATE,
    purchase_cost NUMERIC(12, 2),
    warranty_expiry DATE,
    approval_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_electronics_status ON electronics(status);
CREATE INDEX IF NOT EXISTS idx_electronics_serial ON electronics(serial_number);
CREATE INDEX IF NOT EXISTS idx_electronics_assigned ON electronics(assigned_to);

DROP TRIGGER IF EXISTS trg_electronics_updated_at ON electronics;
CREATE TRIGGER trg_electronics_updated_at BEFORE UPDATE ON electronics FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================
-- 5. Indoor Devices Table
-- ============================================================
CREATE TABLE IF NOT EXISTS indoor_devices (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    division VARCHAR(100),
    purchase_date DATE,
    purchase_cost NUMERIC(12, 2),
    last_service_date DATE,
    approval_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_indoor_status ON indoor_devices(status);
CREATE INDEX IF NOT EXISTS idx_indoor_location ON indoor_devices(location);

DROP TRIGGER IF EXISTS trg_indoor_updated_at ON indoor_devices;
CREATE TRIGGER trg_indoor_updated_at BEFORE UPDATE ON indoor_devices FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================
-- 6. Unified Assets Table
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    major_category VARCHAR(100) NOT NULL,
    asset_type VARCHAR(100) DEFAULT 'Other',
    category VARCHAR(255) NOT NULL,
    sub_type VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Active',
    division VARCHAR(100),
    owner_division VARCHAR(100),
    custodian_name VARCHAR(255),
    custodian_id VARCHAR(50),
    location VARCHAR(255),
    purchase_date DATE,
    purchase_cost NUMERIC(12, 2),
    useful_life INT DEFAULT 5,
    residual_value NUMERIC(12, 2) DEFAULT 0,
    last_service_date DATE,
    last_inspection_date DATE,
    approval_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    image TEXT,
    serial_number VARCHAR(100),
    plate_number VARCHAR(50),
    chassis_number VARCHAR(100),
    engine_number VARCHAR(100),
    sizes VARCHAR(255),
    color VARCHAR(100),
    room_number VARCHAR(50),
    desk_number VARCHAR(50),
    room_name VARCHAR(100),
    staff_assigned_to VARCHAR(255),
    staff_id VARCHAR(50),
    type VARCHAR(100),
    custodian_address VARCHAR(255),
    custodian_mobile VARCHAR(50),
    brand_name VARCHAR(100),
    model VARCHAR(100),
    asset_tag VARCHAR(100),
    has_asset_tag VARCHAR(10) DEFAULT 'No',
    memory_size VARCHAR(50),
    processor VARCHAR(100),
    generation VARCHAR(50),
    storage_size VARCHAR(100),
    route_name VARCHAR(100),
    quantity INT,
    capacity VARCHAR(100),
    expiry_date DATE,
    warranty_expiry DATE,
    receipt_url TEXT,
    chair_material VARCHAR(100),
    workstation_material VARCHAR(100),
    partition_material VARCHAR(100),
    battery_type VARCHAR(100),
    runtime VARCHAR(100),
    number_of_floors VARCHAR(50),
    number_of_seats VARCHAR(50),
    bank_name VARCHAR(100),
    account_number VARCHAR(100),
    account_type VARCHAR(50),
    branch VARCHAR(100),
    currency VARCHAR(20),
    balance_amount NUMERIC(15,2),
    year_of_manufacture INT,
    fuel_type VARCHAR(50),
    transmission VARCHAR(50),
    engine_size VARCHAR(20),
    mileage VARCHAR(100),
    ip_address VARCHAR(50),
    port_count VARCHAR(50),
    printer_type VARCHAR(100),
    scanner_type VARCHAR(100),
    license_type VARCHAR(100),
    software_version VARCHAR(50),
    license_key VARCHAR(255),
    vendor VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_major ON assets(major_category);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_division ON assets(division);
CREATE INDEX IF NOT EXISTS idx_assets_approval ON assets(approval_status);
CREATE INDEX IF NOT EXISTS idx_assets_created ON assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_status_approval ON assets(status, approval_status);

DROP TRIGGER IF EXISTS trg_assets_updated_at ON assets;
CREATE TRIGGER trg_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================
-- 7. Maintenance Tasks Table
-- ============================================================
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    description TEXT,
    task_type VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Scheduled',
    assigned_to VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    estimated_cost NUMERIC(12, 2),
    actual_cost NUMERIC(12, 2),
    parts_maintained TEXT,
    receipt_url TEXT DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maint_asset ON maintenance_tasks(asset_id);
CREATE INDEX IF NOT EXISTS idx_maint_assigned ON maintenance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maint_priority ON maintenance_tasks(priority);

DROP TRIGGER IF EXISTS trg_maint_updated_at ON maintenance_tasks;
CREATE TRIGGER trg_maint_updated_at BEFORE UPDATE ON maintenance_tasks FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ============================================================
-- 8. Asset History Table
-- ============================================================
CREATE TABLE IF NOT EXISTS asset_history (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    asset_type VARCHAR(100),
    action VARCHAR(100),
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_asset ON asset_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_history_performed ON asset_history(performed_by);

-- ============================================================
-- 9. Notifications Table
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(20) DEFAULT 'info',
    related_asset_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);

-- ============================================================
-- Seed Default Administrator Accounts
-- ============================================================
INSERT INTO users (id, name, email, password, role, position, status, email_verified) VALUES
('USR_SUPER', 'Super Administrator', 'superadmin@gha.gov.gh', '$2y$10$21N28teuBW6CB97hv33Vp.94kghtCl/0E7v2jwEOcrzp2Fb5CxNI.', 'Super Admin', 'Super Administrator', 'active', TRUE),
('USR001', 'Admin User', 'admin@gha.gov.gh', '$2y$10$21N28teuBW6CB97hv33Vp.94kghtCl/0E7v2jwEOcrzp2Fb5CxNI.', 'Super Admin', 'Administrator', 'active', TRUE)
ON CONFLICT (id) DO NOTHING;
