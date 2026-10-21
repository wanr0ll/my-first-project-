const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || null,
    pgHost: process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost',
    pgUser: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
    pgPassword: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || '',
    pgDatabase: process.env.PGDATABASE || process.env.POSTGRES_DB || 'gha_asset_manager',
    pgPort: parseInt(process.env.PGPORT || process.env.POSTGRES_PORT || '5432', 10),
    jwtSecret: process.env.JWT_SECRET || 'gha_asset_manager_secret_key_2026',
    jwtExpiration: 86400, // 24 hours in seconds
    brevoApiKey: process.env.BREVO_API_KEY || '',
    smtpFrom: process.env.SMTP_FROM || 'ghaassetmanagementsystem@gmail.com',
    smtpFromName: process.env.SMTP_FROM_NAME || 'Ghana Highway Authority',
    frontendUrl: process.env.FRONTEND_URL || 'https://ghaassetmanager.netlify.app',
    corsAllowAll: process.env.CORS_ALLOW_ALL === 'true',
    allowedOrigins: [
        process.env.FRONTEND_URL,
        process.env.ALLOWED_ORIGIN,
        'https://ghaassetmanager.netlify.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://localhost:80',
        'http://localhost',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:3000',
        'http://127.0.0.1',
    ].filter(Boolean),
    uploadDir: path.resolve(__dirname, '../uploads'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    isDevelopment: (process.env.APP_ENVIRONMENT || process.env.NODE_ENV) === 'development',
};

module.exports = config;
