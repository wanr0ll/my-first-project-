<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode([
    'success' => true,
    'message' => 'API reachable',
    'data' => [
        'status' => 'ok',
        'timestamp' => date('Y-m-d H:i:s'),
        'use_this_base_url' => '//' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . dirname($_SERVER['SCRIPT_NAME']) . '/index.php'
    ]
]);
