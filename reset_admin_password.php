<?php
require_once 'backend/config/config.php';
require_once 'backend/utils/Request.php';
require_once 'backend/config/Database.php';

$database = new Database();
$db = $database->connect();

$email = 'admin@gha.gov.gh';
$password = 'admin123';
$correct_hash = hashPassword($password);

$query = "UPDATE users SET password = ? WHERE email = ?";
$stmt = $db->prepare($query);

if ($stmt->execute([$correct_hash, $email])) {
    echo "Password reset successfully for $email with fresh hash: $correct_hash\n";
} else {
    echo "Failed to reset password: " . $stmt->error . "\n";
}
?>
