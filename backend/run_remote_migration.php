<?php

$host = 'tokaido.proxy.rlwy.net';
$user = 'root';
$pass = 'NYmEHFfKOuulTaypywiweZjxvslxNDHy';
$db_name = 'railway';
$port = 21275;

echo "Connecting to remote database...\n";
$conn = new mysqli($host, $user, $pass, $db_name, $port);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error . "\n");
}
echo "Connected successfully to remote database!\n";

$sqlFile = __DIR__ . '/backend/database/migrations/add_extended_asset_columns.sql';
if (!file_exists($sqlFile)) {
    die("Migration file not found at: $sqlFile\n");
}

echo "Reading migration file...\n";
$sql = file_get_contents($sqlFile);

// Replace the database name in the script
$sql = str_replace('USE gha_asset_manager;', 'USE railway;', $sql);

echo "Executing migration...\n";

if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            while ($row = $result->fetch_row()) {
                if (isset($row[0])) {
                    echo "- " . $row[0] . "\n";
                }
            }
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    
    echo "Migration completed successfully!\n";
} else {
    echo "Error executing migration: " . $conn->error . "\n";
}

$conn->close();
echo "Database connection closed.\n";
