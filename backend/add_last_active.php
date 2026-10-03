<?php
require_once __DIR__ . '/config/Database.php';

$db = new Database();
$conn = $db->connect();

$sql = "ALTER TABLE users ADD COLUMN last_active DATETIME NULL DEFAULT NULL AFTER updated_at";
if ($conn->query($sql) === TRUE) {
    echo "Column last_active added successfully.\n";
} else {
    echo "Error adding column: " . $conn->error . "\n";
}

$db->close();
