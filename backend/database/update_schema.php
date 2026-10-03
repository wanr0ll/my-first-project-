<?php
$mysqli = new mysqli("localhost", "root", "", "gha_asset_manager");

if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

$queries = [
    "ALTER TABLE asset_history MODIFY asset_type VARCHAR(100)",
    "ALTER TABLE maintenance_tasks MODIFY asset_type VARCHAR(100)",
    "ALTER TABLE users ADD COLUMN permissions JSON DEFAULT NULL"
];

foreach ($queries as $query) {
    if (!$mysqli->query($query)) {
        echo "Error: " . $mysqli->error . "\n";
    } else {
        echo "Success: $query\n";
    }
}
$mysqli->close();
