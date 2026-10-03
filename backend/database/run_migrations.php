<?php
require_once __DIR__ . '/../config/Database.php';

echo "Connecting to database...\n";
$db = new Database();
$conn = $db->connect();

if (!$conn) {
    die("Failed to connect to database.\n");
}
echo "Connected successfully to " . getenv('MYSQLDATABASE') . " on " . getenv('MYSQLHOST') . "!\n";

$sqlFile = __DIR__ . '/migrations/add_extended_asset_columns.sql';
if (!file_exists($sqlFile)) {
    die("Migration file not found: $sqlFile\n");
}

echo "Reading migration file...\n";
$sql = file_get_contents($sqlFile);

echo "Executing migration...\n";

// Execute multi-query since the SQL file might contain multiple statements
if ($conn->multi_query($sql)) {
    do {
        // Store first result set
        if ($result = $conn->store_result()) {
            while ($row = $result->fetch_row()) {
                if (isset($row[0])) {
                    echo "- " . $row[0] . "\n";
                }
            }
            $result->free();
        }
        
        // Prepare next result set
    } while ($conn->more_results() && $conn->next_result());
    
    echo "Migration completed successfully!\n";
} else {
    echo "Error executing migration: " . $conn->error . "\n";
}

$conn->close();
echo "Database connection closed.\n";
