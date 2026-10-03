<?php
require_once 'backend/config/config.php';
require_once 'backend/config/Database.php';
require_once 'backend/models/Asset.php';

$database = new Database();
$db = $database->connect();

$asset = new Asset($db);
$testData = [
    'id' => 'TEST-' . time(),
    'name' => 'Duplicate Field Test',
    'majorCategory' => 'Fixed Asset',
    'category' => 'Fleets'
];

echo "Attempting to create asset with ID already in data...\n";
$result = $asset->create($testData);

if ($result['success']) {
    echo "SUCCESS\n";
} else {
    echo "FAILED: " . $result['message'] . "\n";
}

$db->close();
