<?php
require_once 'backend/config/config.php';
require_once 'backend/config/Database.php';
require_once 'backend/models/Asset.php';

$database = new Database();
$db = $database->connect();

$assetModel = new Asset($db);
$result = $assetModel->getAll(1, 10);

echo "Total assets: " . $result['total'] . "\n\n";
foreach ($result['data'] as $asset) {
    echo "ID: " . $asset['id'] . "\n";
    echo "Name: " . $asset['name'] . "\n";
    echo "Major Category: " . ($asset['major_category'] ?? 'MISSING') . "\n";
    echo "Asset Type: " . ($asset['asset_type'] ?? 'MISSING') . "\n";
    echo "Category: " . ($asset['category'] ?? 'MISSING') . "\n";
    echo "Status: " . ($asset['status'] ?? 'MISSING') . "\n";
    echo "----------\n";
}

$db->close();
