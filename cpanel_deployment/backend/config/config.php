<?php

/**
 * Global Configuration File
 */

// Database credentials for XAMPP
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'gha_asset_manager');
define('DB_CHARSET', 'utf8mb4');

// API Configuration
define('API_URL', 'http://localhost/gha-asset-manager/backend/api');
define('FRONTEND_URL', 'http://localhost:5175'); // Vite dev server

// JWT Configuration (if implementing token-based auth)
define('JWT_SECRET', 'gha_asset_manager_secret_key_2026');
define('JWT_ALGO', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 hours

// Application Settings
define('APP_NAME', 'GHA Asset Manager API');
define('APP_VERSION', '1.0.0');
define('APP_ENVIRONMENT', 'development'); // development or production

// File Upload Configuration
define('MAX_FILE_SIZE', 5242880); // 5MB in bytes
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'pdf']);

// Enable CORS
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:3000',
]);

// Error Logging
define('ERROR_LOG_FILE', __DIR__ . '/../logs/error.log');
define('DEBUG_MODE', true);

// SMTP Configuration (Gmail)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587); // TLS
define('SMTP_USER', 'ghaassetmanagementsystem@gmail.com');
define('SMTP_PASS', 'fcud doge fifn xifo');
define('SMTP_FROM', 'ghaassetmanagementsystem@gmail.com');
define('SMTP_FROM_NAME', 'GHA Asset Manager');

// Ensure logs and uploads directories exist
if (!is_dir(__DIR__ . '/../logs/')) {
    mkdir(__DIR__ . '/../logs/', 0755, true);
}
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
