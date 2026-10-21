const { Pool } = require('pg');
const config = require('./config');

let poolConfig;

if (config.databaseUrl) {
    const isLocal = config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1');
    poolConfig = {
        connectionString: config.databaseUrl,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    };
} else {
    const isLocal = config.pgHost === 'localhost' || config.pgHost === '127.0.0.1';
    poolConfig = {
        host: config.pgHost,
        user: config.pgUser,
        password: config.pgPassword,
        database: config.pgDatabase,
        port: config.pgPort,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

/**
 * Execute a query with parameters
 */
async function query(text, params = []) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (config.isDevelopment) {
            console.log('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        const errDetail = error.message || error.code || String(error);
        console.error('Database query error:', {
            text: text.slice(0, 200).replace(/\s+/g, ' '),
            error: errDetail,
        });
        throw error;
    }
}

/**
 * Run idempotent migrations to ensure necessary columns exist
 */
async function runIdempotentMigrations() {
    try {
        // Ensure assets table columns
        await query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets') THEN
                    ALTER TABLE assets ADD COLUMN IF NOT EXISTS receipt_url TEXT;
                END IF;
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'maintenance_tasks') THEN
                    ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS receipt_url TEXT;
                    ALTER TABLE maintenance_tasks ADD COLUMN IF NOT EXISTS parts_maintained TEXT;
                END IF;
                IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
                END IF;
            END $$;
        `);
        console.log('✓ Database verification & schema checks completed.');
    } catch (err) {
        console.warn('Database schema migration notice:', err.message);
    }
}

module.exports = {
    pool,
    query,
    runIdempotentMigrations,
};
