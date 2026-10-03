<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/Database.php';

$database = new Database();
$db = $database->connect();

$check = $db->query("SHOW COLUMNS FROM users LIKE 'position'");
if ($check->num_rows === 0) {
    if ($db->query("ALTER TABLE users ADD COLUMN position VARCHAR(255) AFTER role")) {
        echo "Position column successfully added.\n";
    } else {
        echo "Error: " . $db->error . "\n";
    }
} else {
    echo "Position column already exists.\n";
}
?>
