const mysql = require('mysql2/promise');
const fs = require('fs');

async function importDb() {
    console.log('Connecting to Railway MySQL...');
    const conn = await mysql.createConnection({
        host: 'acela.proxy.rlwy.net',
        port: 32173,
        user: 'root',
        password: 'IOOVNokesZFoPrhSFMAhQnjzGgPOoxGX',
        database: 'railway',
        multipleStatements: true,
        ssl: { rejectUnauthorized: false }
    });

    console.log('Connected! Reading SQL dump...');
    const sql = fs.readFileSync('gha_asset_manager_db_dump.sql', 'utf8');

    // Split on statement boundaries, strip MariaDB-specific comments
    const cleaned = sql
        .replace(/\/\*![0-9]+ [^*]*\*\/;?\s*/g, '') // strip /*!xxxxx ... */ conditionals
        .replace(/^--.*$/gm, '')                       // strip comments
        .replace(/^\s*$/gm, '');                       // strip blank lines

    console.log('Importing database...');
    await conn.query('SET SESSION sql_mode="";');
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');
    await conn.query(cleaned);
    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    console.log('Database imported successfully!');
    await conn.end();
}

importDb().catch(e => { console.error('Import failed:', e.message); process.exit(1); });
