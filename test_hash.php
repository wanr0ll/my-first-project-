<?php
require_once 'backend/config/config.php';
require_once 'backend/utils/Request.php';

require_once 'backend/config/Database.php';
require_once 'backend/models/User.php';

$password = 'GHA@Superadmin2026';
$db = (new Database())->connect();
$userModel = new User($db);

$emails = ['superadmin@gha.gov.gh', 'admin@gha.gov.gh'];
foreach ($emails as $email) {
    $valid = $userModel->verifyPassword($email, $password);
    echo "User: $email | Password valid: " . ($valid ? "YES" : "NO") . "\n";
}
?>
