<?php
/**
 * Migration: Widen profile_image column to support base64 image storage
 * Run this once on your production database (Railway/PostgreSQL or local MySQL).
 *
 * Usage: php backend/database/migrate_profile_image.php
 */

chdir(__DIR__ . '/..');
require_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->connect();

// Detect driver via PdoWrapper
$driver = $db->getDriver();

try {
    if ($driver === 'pgsql') {
        // PostgreSQL: TEXT type has no length limit
        $db->query("ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT");
        echo "✅ PostgreSQL: profile_image column changed to TEXT\n";
    } else {
        // MySQL: Use MEDIUMTEXT (up to 16MB)
        $db->query("ALTER TABLE users MODIFY COLUMN profile_image MEDIUMTEXT");
        echo "✅ MySQL: profile_image column changed to MEDIUMTEXT\n";
    }

    echo "Migration complete. Profile images can now be stored as base64 data URLs.\n";
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
