-- Migrate to Unified Asset Table
USE gha_asset_manager;

-- 1. Create the unified assets table
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    major_category ENUM('Fixed Asset', 'Non Fixed Asset') NOT NULL,
    asset_type ENUM('Moveable', 'Non Moveable', 'Other') DEFAULT 'Other',
    category VARCHAR(255) NOT NULL,
    sub_type VARCHAR(255),
    status VARCHAR(100) DEFAULT 'Active',
    division VARCHAR(100),
    owner_division VARCHAR(100),
    custodian_name VARCHAR(255),
    custodian_id VARCHAR(50),
    location VARCHAR(255),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    useful_life INT DEFAULT 5,
    residual_value DECIMAL(12, 2) DEFAULT 0,
    last_service_date DATE,
    last_inspection_date DATE,
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    notes TEXT,
    image TEXT,
    serial_number VARCHAR(100),
    plate_number VARCHAR(50),
    chassis_number VARCHAR(100),
    engine_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    INDEX idx_major (major_category),
    INDEX idx_type (asset_type),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_division (division)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Migrate Vehicles
INSERT IGNORE INTO assets (
    id, name, major_category, asset_type, category, sub_type, status, division, 
    plate_number, chassis_number, engine_number, purchase_date, purchase_cost, 
    last_service_date, last_inspection_date, approval_status, notes, 
    created_at, updated_at, created_by
)
SELECT 
    id, name, 'Fixed Asset', 'Moveable', 'Fleets', type, status, division,
    plate_number, chassis_number, engine_number, purchase_date, purchase_cost,
    last_service_date, last_inspection_date, approval_status, notes,
    created_at, updated_at, created_by
FROM vehicles;

-- 3. Migrate Furniture
INSERT IGNORE INTO assets (
    id, name, major_category, asset_type, category, division, status, location, 
    purchase_date, purchase_cost, approval_status, notes, 
    created_at, updated_at, created_by
)
SELECT 
    id, name, 'Fixed Asset', 'Moveable', 'Furniture and office Equipment', division, status, location,
    purchase_date, purchase_cost, approval_status, notes,
    created_at, updated_at, created_by
FROM furniture;

-- 4. Migrate Electronics
INSERT IGNORE INTO assets (
    id, name, major_category, asset_type, category, serial_number, custodian_name, 
    status, division, purchase_date, purchase_cost, approval_status, notes, 
    created_at, updated_at, created_by
)
SELECT 
    id, name, 'Fixed Asset', 'Moveable', 'ICT Assets', serial_number, assigned_to,
    status, division, purchase_date, purchase_cost, approval_status, notes,
    created_at, updated_at, created_by
FROM electronics;

-- 5. Migrate Indoor Devices
INSERT IGNORE INTO assets (
    id, name, major_category, asset_type, category, location, status, division, 
    purchase_date, purchase_cost, last_service_date, approval_status, notes, 
    created_at, updated_at, created_by
)
SELECT 
    id, name, 'Fixed Asset', 'Non Moveable', 'Infrastructure and utility Installation', location, status, division,
    purchase_date, purchase_cost, last_service_date, approval_status, notes,
    created_at, updated_at, created_by
FROM indoor_devices;

-- 6. Update History and Maintenance Task links if necessary
-- Since the IDs are preserved, they should still link, but we might need to update the asset_type enum in those tables.
ALTER TABLE maintenance_tasks MODIFY COLUMN asset_type VARCHAR(100);
ALTER TABLE asset_history MODIFY COLUMN asset_type VARCHAR(100);
