<?php

/**
 * User Model - Database operations for users
 */

class User
{
    private $db;

    public function __construct($database)
    {
        $this->db = $database;
    }

    /**
     * Create new user
     */
    public function create($data)
    {
        $id = isset($data['id']) ? $data['id'] : generateId('USR');
        $password = hashPassword($data['password']);

        $phone = $data['phone'] ?? null;
        $division = $data['division'] ?? null;
        $status = $data['status'] ?? 'pending';
        $email_verified_sql = (!empty($data['email_verified']) && ($data['email_verified'] === true || $data['email_verified'] == 1 || $data['email_verified'] === 'true' || $data['email_verified'] === 't')) ? 'TRUE' : 'FALSE';

        $position = $data['position'] ?? null;

        $query = "INSERT INTO users 
                  (id, name, email, password, phone, role, position, division, status, email_verified) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, $email_verified_sql)";

        $stmt = $this->db->prepare($query);

        if (!$stmt) {
            return ['success' => false, 'message' => 'Prepare failed: ' . $this->db->error];
        }

        $params = [
            $id,
            $data['name'],
            $data['email'],
            $password,
            $phone,
            $data['role'],
            $position,
            $division,
            $status
        ];

        if ($stmt->execute($params)) {
            return ['success' => true, 'id' => $id];
        }

        return ['success' => false, 'message' => 'Create failed: ' . $stmt->error];
    }

    /**
     * Get user by email
     */
    public function getByEmail($email)
    {
        $fallback = strpos($email, '@') === false ? ($email . '@gha.gov.gh') : $email;
        $query = "SELECT * FROM users WHERE email = ? OR email = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$email, $fallback]);

        return $stmt->get_result()->fetch_assoc();
    }

    /**
     * Get user by phone number
     */
    public function getByPhone($phone)
    {
        $query = "SELECT * FROM users WHERE phone = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$phone]);

        return $stmt->get_result()->fetch_assoc();
    }

    /**
     * Get user by id
     */
    public function getById($id)
    {
        $query = "SELECT id, name, email, phone, role, position, division, status, profile_image, permissions, created_at, updated_at, last_active, CASE WHEN last_active > (NOW() - INTERVAL '2 minute') THEN 1 ELSE 0 END as is_online 
                  FROM users WHERE id = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);

        return $stmt->get_result()->fetch_assoc();
    }

    /**
     * Get all users with pagination
     */
    public function getAll($page = 1, $per_page = 10, $filters = [])
    {
        $offset = ($page - 1) * $per_page;
        $query = "SELECT id, name, email, phone, role, position, division, status, email_verified, permissions, created_at, last_active, CASE WHEN last_active > (NOW() - INTERVAL '2 minute') THEN 1 ELSE 0 END as is_online 
                  FROM users WHERE 1=1";

        if (!empty($filters['role'])) {
            $query .= " AND role = '" . $this->db->real_escape_string($filters['role']) . "'";
        }

        if (!empty($filters['division'])) {
            $query .= " AND division = '" . $this->db->real_escape_string($filters['division']) . "'";
        }

        if (!empty($filters['search'])) {
            $search = '%' . $this->db->real_escape_string($filters['search']) . '%';
            $query .= " AND (name LIKE '" . $search . "' OR email LIKE '" . $search . "')";
        }

        // Get total count
        $count_result = $this->db->query(
            "SELECT COUNT(*) as total FROM users WHERE 1=1" .
                (!empty($filters['role']) ? " AND role = '" . $this->db->real_escape_string($filters['role']) . "'" : "") .
                (!empty($filters['division']) ? " AND division = '" . $this->db->real_escape_string($filters['division']) . "'" : "") .
                (!empty($filters['search']) ? " AND (name LIKE '%" . $this->db->real_escape_string($filters['search']) . "%' OR email LIKE '%" . $this->db->real_escape_string($filters['search']) . "%')" : "")
        );

        $total = $count_result->fetch_assoc()['total'];

        // Get paginated results
        $query .= " ORDER BY created_at DESC LIMIT " . intval($per_page) . " OFFSET " . intval($offset);
        $result = $this->db->query($query);

        return [
            'total' => $total,
            'data' => $result ? $result->fetch_all(MYSQLI_ASSOC) : []
        ];
    }

    /**
     * Update user
     */
    public function update($id, $data)
    {
        $updates = [];
        $params = [];
        $types = '';

        foreach ($data as $key => $value) {
            if (in_array($key, ['name', 'phone', 'role', 'position', 'division', 'status', 'profile_image', 'permissions'])) {
                $updates[] = "$key = ?";
                $params[] = $value;
                $types .= 's';
            } elseif ($key === 'password' && !empty($value)) {
                $updates[] = "password = ?";
                $params[] = password_hash($value, PASSWORD_DEFAULT);
                $types .= 's';
            }
        }

        if (empty($updates)) {
            return ['success' => false, 'message' => 'No valid fields to update'];
        }

        $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $params[] = $id;
        $types .= 's'; // For the WHERE id = ?

        $stmt = $this->db->prepare($query);
        if (!$stmt) {
            return ['success' => false, 'message' => 'Prepare failed: ' . $this->db->error];
        }

        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Update failed: ' . $stmt->error];
    }

    /**
     * Delete user
     */
    public function delete($id)
    {
        $safeId = $this->db->real_escape_string($id);

        // Remove foreign key references or delete dependent records
        $this->db->query("DELETE FROM notifications WHERE user_id = '$safeId'");

        $tablesWithCreatedBy = ['vehicles', 'furniture', 'electronics', 'indoor_devices', 'maintenance_tasks'];
        foreach ($tablesWithCreatedBy as $table) {
            $this->db->query("UPDATE $table SET created_by = NULL WHERE created_by = '$safeId'");
        }

        $this->db->query("UPDATE electronics SET assigned_to = NULL WHERE assigned_to = '$safeId'");
        $this->db->query("UPDATE maintenance_tasks SET assigned_to = NULL WHERE assigned_to = '$safeId'");
        $this->db->query("UPDATE asset_history SET performed_by = NULL WHERE performed_by = '$safeId'");

        // If there's an overarching assets table (depending on schema versions)
        $this->db->query("UPDATE assets SET created_by = NULL WHERE created_by = '$safeId'");
        $this->db->query("UPDATE assets SET custodian_id = NULL, custodian_name = NULL WHERE custodian_id = '$safeId'");

        $query = "DELETE FROM users WHERE id = ?";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param('s', $id);

        if ($stmt->execute()) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Delete failed: ' . $stmt->error];
    }

    /**
     * Update last active timestamp
     */
    public function updateLastActive($id)
    {
        $query = "UPDATE users SET last_active = NOW() WHERE id = ?";
        $stmt = $this->db->prepare($query);
        if ($stmt->execute([$id])) {
            return ['success' => true];
        }
        return ['success' => false, 'message' => 'Failed to update last active timestamp'];
    }

    /**
     * Update user password by user ID
     */
    public function updatePassword($id, $newPassword)
    {
        $hashedPassword = hashPassword($newPassword);
        $query = "UPDATE users SET password = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);
        if (!$stmt) {
            return ['success' => false, 'message' => 'Prepare failed: ' . $this->db->error];
        }
        if ($stmt->execute([$hashedPassword, $id])) {
            return ['success' => true];
        }
        return ['success' => false, 'message' => 'Password update failed: ' . $stmt->error];
    }

    /**
     * Verify password
     */
    public function verifyPassword($email, $password)
    {
        $user = $this->getByEmail($email);

        if (!$user) {
            return false;
        }

        return verifyPassword($password, $user['password']);
    }

    /**
     * Set reset token for password recovery
     */
    public function setResetToken($email, $token)
    {
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $query = "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?";
        $stmt = $this->db->prepare($query);

        if ($stmt->execute([$token, $expiry, $email])) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Failed to set reset token'];
    }

    /**
     * Verify if a reset token is valid and not expired
     */
    public function verifyResetToken($token)
    {
        $query = "SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$token]);

        return $stmt->get_result()->fetch_assoc();
    }

    /**
     * Update password using a valid reset token
     */
    public function updatePasswordWithToken($token, $newPassword)
    {
        $user = $this->verifyResetToken($token);
        if (!$user) {
            return ['success' => false, 'message' => 'Invalid or expired token'];
        }

        $hashedPassword = hashPassword($newPassword);
        // Update password and clear the token
        $query = "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?";
        $stmt = $this->db->prepare($query);

        if ($stmt->execute([$hashedPassword, $user['id']])) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Password update failed'];
    }
    /**
     * Set verification token for new accounts
     */
    public function setVerificationToken($email, $token)
    {
        $expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $query = "UPDATE users SET verification_token = ?, verification_token_expiry = ? WHERE email = ?";
        $stmt = $this->db->prepare($query);

        if ($stmt->execute([$token, $expiry, $email])) {
            return ['success' => true];
        }

        return ['success' => false, 'message' => 'Failed to set verification token'];
    }

    /**
     * Verify verification token and mark email as verified.
     * Returns a short-lived set_password_token so the user can set their own private password.
     * Account is fully activated only after setInitialPassword() is called.
     */
    public function verifyVerificationToken($token)
    {
        $query = "SELECT id, email FROM users WHERE verification_token = ? AND verification_token_expiry > NOW() LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$token]);
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user) {
            return ['success' => false, 'message' => 'Invalid or expired verification token'];
        }

        // Generate a short-lived set-password token (valid 30 minutes)
        $setPasswordToken = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+30 minutes'));

        // Mark email as verified (but keep status as pending until password is set)
        $query = "UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expiry = NULL, reset_token = ?, reset_token_expiry = ? WHERE id = ?";
        $stmt = $this->db->prepare($query);

        if ($stmt->execute([$setPasswordToken, $expiry, $user['id']])) {
            return ['success' => true, 'set_password_token' => $setPasswordToken, 'email' => $user['email']];
        }

        return ['success' => false, 'message' => 'Account activation failed'];
    }

    /**
     * Set initial password using the set_password_token issued after email verification.
     * This fully activates the account.
     */
    public function setInitialPassword($token, $newPassword)
    {
        // The set_password_token is stored in the reset_token column temporarily
        $query = "SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$token]);
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user) {
            return ['success' => false, 'message' => 'Invalid or expired setup token. Please request a new verification code.'];
        }

        $hashedPassword = hashPassword($newPassword);

        // Set password, activate account, clear the temp token
        $query = "UPDATE users SET password = ?, status = 'active', reset_token = NULL, reset_token_expiry = NULL WHERE id = ?";
        $stmt = $this->db->prepare($query);

        if ($stmt->execute([$hashedPassword, $user['id']])) {
            return ['success' => true, 'email' => $user['email']];
        }

        return ['success' => false, 'message' => 'Failed to set password'];
    }
}
