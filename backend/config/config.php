<?php

/**
 * Global Configuration File
 */

// Helper to load .env variables locally
if (!function_exists('loadEnvFile')) {
    function loadEnvFile($path) {
        if (!file_exists($path)) return;
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value, " \t\n\r\0\x0B\"'");
                if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                    $_SERVER[$name] = $value;
                    $_ENV[$name] = $value;
                    putenv("$name=$value");
                }
            }
        }
    }
}
loadEnvFile(__DIR__ . '/../.env');
loadEnvFile(__DIR__ . '/../../.env');

// Database credentials defaults
define('DB_HOST', ($_SERVER['DB_HOST'] ?? $_ENV['DB_HOST'] ?? getenv('DB_HOST')) ?: 'localhost');
define('DB_USER', ($_SERVER['DB_USER'] ?? $_ENV['DB_USER'] ?? getenv('DB_USER')) ?: 'root');
define('DB_PASS', ($_SERVER['DB_PASS'] ?? $_ENV['DB_PASS'] ?? getenv('DB_PASS')) ?: '');
define('DB_NAME', ($_SERVER['DB_NAME'] ?? $_ENV['DB_NAME'] ?? getenv('DB_NAME')) ?: 'gha_asset_manager');
define('DB_CHARSET', 'utf8mb4');

// API Configuration
define('API_URL', ($_SERVER['API_URL'] ?? $_ENV['API_URL'] ?? getenv('API_URL')) ?: 'http://localhost/gha-asset-manager/backend/api');
define('FRONTEND_URL', ($_SERVER['FRONTEND_URL'] ?? $_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL')) ?: 'https://ghaassetmanager.netlify.app'); 

// JWT Configuration (if implementing token-based auth)
define('JWT_SECRET', ($_SERVER['JWT_SECRET'] ?? $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET')) ?: 'gha_asset_manager_secret_key_2026');
define('JWT_ALGO', 'HS256');
define('JWT_EXPIRATION', 86400); // 24 hours

// Application Settings
define('APP_NAME', 'GHA Asset Manager API');
define('APP_VERSION', '1.0.0');
define('APP_ENVIRONMENT', ($_SERVER['APP_ENVIRONMENT'] ?? $_ENV['APP_ENVIRONMENT'] ?? getenv('APP_ENVIRONMENT')) ?: 'production');

// File Upload Configuration
define('MAX_FILE_SIZE', 5242880); // 5MB in bytes
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'pdf']);

// Enable CORS - reads from environment so Railway dashboard can be used to fix without a push
define('ENABLE_CORS', true);

// Build allowed origins list - checks Railway env var first
$_allowed_origins = [
    'https://ghaassetmanager.netlify.app',
    // --- Development ---
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:3000',
];
// Allow extra origin via Railway env var (no code push needed)
$allowed_origin_env = $_SERVER['ALLOWED_ORIGIN'] ?? $_ENV['ALLOWED_ORIGIN'] ?? getenv('ALLOWED_ORIGIN');
if ($allowed_origin_env) {
    array_unshift($_allowed_origins, $allowed_origin_env);
}
define('ALLOWED_ORIGINS', $_allowed_origins);
define('CORS_ALLOW_ALL', ($_SERVER['CORS_ALLOW_ALL'] ?? $_ENV['CORS_ALLOW_ALL'] ?? getenv('CORS_ALLOW_ALL')) === 'true');

// Error Logging
define('ERROR_LOG_FILE', __DIR__ . '/../logs/error.log');
define('DEBUG_MODE', (($_SERVER['APP_ENVIRONMENT'] ?? $_ENV['APP_ENVIRONMENT'] ?? getenv('APP_ENVIRONMENT')) ?: 'production') === 'development');

// Email Configuration (Brevo HTTP API - replaces blocked SMTP on Railway)
define('BREVO_API_KEY', ($_SERVER['BREVO_API_KEY'] ?? $_ENV['BREVO_API_KEY'] ?? getenv('BREVO_API_KEY')) ?: '');
define('SMTP_FROM', 'ghaassetmanagementsystem@gmail.com');
define('SMTP_FROM_NAME', 'GHA Asset Manager');

// Ensure logs and uploads directories exist
if (!is_dir(__DIR__ . '/../logs/')) {
    mkdir(__DIR__ . '/../logs/', 0755, true);
}
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
