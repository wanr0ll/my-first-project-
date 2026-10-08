<?php
require_once __DIR__ . '/../config/Database.php';

echo "Connecting to Supabase PostgreSQL database...\n";
$db = new Database();
$conn = $db->connect();

if (!$conn) {
    die("Failed to connect to database.\n");
}
echo "Connected successfully to " . getenv('PGDATABASE') . " on " . getenv('PGHOST') . "!\n";

$sqlFile = __DIR__ . '/migrations/add_extended_asset_columns.sql';
if (!file_exists($sqlFile)) {
    die("Migration file not found: $sqlFile\n");
}

echo "Reading migration file...\n";
$sql = file_get_contents($sqlFile);

echo "Executing migration...\n";

// Split on semicolons and execute each statement individually (PdoWrapper compatible)
$statements = array_filter(array_map('trim', explode(';', $sql)));
$success = true;

foreach ($statements as $statement) {
    if (empty($statement)) continue;
    try {
        $conn->query($statement);
        echo "- OK: " . substr($statement, 0, 60) . "...\n";
    } catch (Exception $e) {
        echo "- Error: " . $e->getMessage() . "\n";
        $success = false;
    }
}

if ($success) {
    echo "Migration completed successfully!\n";
} else {
    echo "Migration completed with some errors. Check output above.\n";
}
