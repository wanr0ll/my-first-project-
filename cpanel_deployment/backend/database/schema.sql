-- GHA Asset Manager Database Schema
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS gha_asset_manager;
USE gha_asset_manager;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('Administrator', 'CEO', 'Chief Executive', 'Director', 'Worker', 'Maintenance') NOT NULL,
    division VARCHAR(100),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    profile_image VARCHAR(255),
    permissions JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_division (division)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('Active', 'Inactive', 'Maintenance', 'Disposed') DEFAULT 'Active',
    division VARCHAR(100),
    chassis_number VARCHAR(100),
    engine_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    last_service_date DATE,
    last_inspection_date DATE,
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    INDEX idx_status (status),
    INDEX idx_division (division),
    INDEX idx_plate (plate_number),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Furniture Table
CREATE TABLE IF NOT EXISTS furniture (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    division VARCHAR(100),
    quantity INT DEFAULT 1,
    asset_condition ENUM('Good', 'Fair', 'Poor') DEFAULT 'Good',
    status ENUM('Good', 'Fair', 'Poor', 'Disposed') DEFAULT 'Good',
    location VARCHAR(255),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    INDEX idx_status (status),
    INDEX idx_division (division),
    INDEX idx_asset_condition (asset_condition),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Electronics Table
CREATE TABLE IF NOT EXISTS electronics (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    assigned_to VARCHAR(50),
    status ENUM('Active', 'Inactive', 'Maintenance', 'Disposed') DEFAULT 'Active',
    division VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    warranty_expiry DATE,
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    INDEX idx_status (status),
    INDEX idx_serial (serial_number),
    INDEX idx_assigned_to (assigned_to),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indoor Devices Table
CREATE TABLE IF NOT EXISTS indoor_devices (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    location VARCHAR(255),
    status ENUM('Active', 'Inactive', 'Maintenance', 'Disposed') DEFAULT 'Active',
    division VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    last_service_date DATE,
    approval_status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    INDEX idx_status (status),
    INDEX idx_location (location),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Tasks Table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id VARCHAR(50) PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    description TEXT,
    task_type VARCHAR(100),
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Overdue', 'Cancelled') DEFAULT 'Scheduled',
    assigned_to VARCHAR(50),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    parts_maintained TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    INDEX idx_status (status),
    INDEX idx_asset_id (asset_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_priority (priority),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asset History Table (for audit trail)
CREATE TABLE IF NOT EXISTS asset_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id VARCHAR(50) NOT NULL,
    asset_type VARCHAR(100),
    action VARCHAR(100),
    description TEXT,
    old_values JSON,
    new_values JSON,
    performed_by VARCHAR(50),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asset_id (asset_id),
    INDEX idx_performed_by (performed_by),
    FOREIGN KEY (performed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    related_asset_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123 - hashed)
INSERT INTO users (id, name, email, password, role, status, email_verified) VALUES
('USR001', 'Admin User', 'admin@gha.gov.gh', '$2y$10$vvHBZEy.0BJ3SKGY3L7/pOVFB3a0rK4fF4/IZ5ZX3DpT9K4XrV1uK', 'Administrator', 'active', TRUE);
