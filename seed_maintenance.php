<?php
require_once 'backend/config/config.php';
require_once 'backend/config/Database.php';
require_once 'backend/models/Maintenance.php';

function generateId($prefix) {
    return $prefix . '-' . bin2hex(random_bytes(4)) . '-' . time();
}

$database = new Database();
$db = $database->connect();
$maintenanceModel = new Maintenance($db);

// Get a valid admin user ID for created_by
$userRes = $db->query("SELECT id FROM users WHERE role = 'Administrator' OR role = 'Admin' LIMIT 1");
$adminUser = $userRes->fetch_assoc();
$adminId = $adminUser ? $adminUser['id'] : 'USR001';

// Get some asset IDs
$res = $db->query("SELECT id, asset_type, category FROM assets LIMIT 5");
$assets = $res->fetch_all(MYSQLI_ASSOC);

if (empty($assets)) {
    echo "No assets found.\n";
    exit;
}

$tasks = [
    [
        'description' => 'Annual brake inspection',
        'task_type' => 'Inspection',
        'priority' => 'High',
        'status' => 'Scheduled',
        'scheduled_date' => date('Y-m-d', strtotime('+7 days')),
        'estimated_cost' => 500
    ],
    [
        'description' => 'Oil change and filter replacement',
        'task_type' => 'Preventive',
        'priority' => 'Medium',
        'status' => 'In Progress',
        'scheduled_date' => date('Y-m-d'),
        'estimated_cost' => 200
    ],
    [
        'description' => 'Fix radiator',
        'task_type' => 'Repair',
        'priority' => 'Critical',
        'status' => 'Scheduled',
        'scheduled_date' => date('Y-m-d', strtotime('+1 day')),
        'estimated_cost' => 1200
    ]
];

$i = 0;
foreach ($tasks as $taskData) {
    $asset = $assets[$i % count($assets)];
    
    $data = array_merge($taskData, [
        'id' => generateId('MT'),
        'asset_id' => $asset['id'],
        'asset_type' => $asset['asset_type'],
        'created_by' => $adminId
    ]);
    
    $result = $maintenanceModel->createTask($data);
    if ($result['success']) {
        echo "Created task: " . $data['description'] . "\n";
    } else {
        echo "Failed to create task: " . $result['message'] . "\n";
    }
    $i++;
}

$db->close();
echo "Seeding completed.\n";
