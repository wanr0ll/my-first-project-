<?php
require_once __DIR__ . '/backend/config/config.php';
require_once __DIR__ . '/backend/config/Database.php';

$database = new Database();
$db = $database->connect();

echo "--- User IDs ---\n";
$res = $db->query("SELECT id, name, role FROM users LIMIT 10");
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['name'] . " | Role: " . $row['role'] . "\n";
}

echo "\n--- Maintenance Tasks Columns ---\n";
$res = $db->query("DESCRIBE maintenance_tasks");
while ($row = $res->fetch_assoc()) {
    print_r($row);
}

$db->close();
