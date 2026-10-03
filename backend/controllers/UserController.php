<?php

/**
 * User Controller - Handle user management
 */

class UserController
{
    private $userModel;

    public function __construct($userModel)
    {
        $this->userModel = $userModel;
    }

    /**
     * Get all users
     */
    public function getAll()
    {
        Middleware::requireRole(['Super Admin']);

        $page = Request::getParam('page', 1);
        $per_page = Request::getParam('per_page', 10);

        $filters = [
            'role' => Request::getParam('role'),
            'division' => Request::getParam('division'),
            'search' => Request::getParam('search')
        ];

        $result = $this->userModel->getAll($page, $per_page, $filters);

        Response::paginated($result['data'], $result['total'], $page, $per_page);
    }

    /**
     * Get user by ID
     */
    public function getById()
    {
        Middleware::requireAuth();

        $id = Request::getParam('id');

        if (empty($id)) {
            Response::error('User ID is required', 400);
        }

        $user = $this->userModel->getById($id);

        if (!$user) {
            Response::error('User not found', 404);
        }

        Response::success($user, 'User retrieved successfully');
    }

    /**
     * Create user
     */
    public function create()
    {
        Middleware::requireRole(['Super Admin']);

        // Validate
        if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            Response::error('Name, email, password, and role are required', 400);
        }

        if (!validateEmail($data['email'])) {
            Response::error('Invalid email format', 400);
        }

        if ($this->userModel->getByEmail($data['email'])) {
            Response::error('Email already exists', 409);
        }

        $result = $this->userModel->create($data);

        if (!$result['success']) {
            Response::error($result['message'], 500);
        }

        Response::success(['id' => $result['id']], 'User created successfully', 201);
    }

    /**
     * Update user
     */
    public function update()
    {
        $currentUser = Middleware::requireAuth();

        $data = Request::getJSON();
        $id = Request::getParam('id') ?? ($data['id'] ?? null);

        if (empty($id)) {
            Response::error('User ID is required', 400);
        }

        // Allow update if it's the user themselves OR if they are the Super Admin
        $isAdmin = $currentUser['role'] === 'Super Admin';
        $isSelf = (string)$currentUser['id'] === (string)$id;

        if (!$isAdmin && !$isSelf) {
            Response::error('Access denied. You can only update your own profile.', 403);
        }

        if (!$this->userModel->getById($id)) {
            Response::error('User not found', 404);
        }

        $result = $this->userModel->update($id, $data ?? []);

        if (!$result['success']) {
            Response::error($result['message'], 500);
        }

        Response::success(null, 'User updated successfully');
    }

    /**
     * Delete user
     */
    public function delete()
    {
        Middleware::requireRole(['Super Admin']);

        $id = Request::getParam('id');

        if (empty($id)) {
            Response::error('User ID is required', 400);
        }

        if (!$this->userModel->getById($id)) {
            Response::error('User not found', 404);
        }

        $result = $this->userModel->delete($id);

        if (!$result['success']) {
            Response::error($result['message'], 500);
        }

        Response::success(null, 'User deleted successfully');
    }

    /**
     * Upload profile image
     */
    public function uploadProfileImage()
    {
        $user = Middleware::requireAuth();
        $id = $user['id'];

        if (!isset($_FILES['profile_image']) || $_FILES['profile_image']['error'] !== UPLOAD_ERR_OK) {
            Response::error('No valid file uploaded', 400);
        }

        $file = $_FILES['profile_image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!in_array($file['type'], $allowedTypes)) {
            Response::error('Only JPG, PNG and GIF files are allowed', 400);
        }

        if ($file['size'] > 5 * 1024 * 1024) { // 5MB limit
            Response::error('File size exceeds 5MB limit', 400);
        }

        $uploadDir = __DIR__ . '/../uploads/profiles/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'profile_' . $id . '_' . time() . '.' . $ext;
        $destination = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $destination)) {
            $imageUrl = '/uploads/profiles/' . $filename;

            $oldProfile = $this->userModel->getById($id);
            if (!empty($oldProfile['profile_image'])) {
                $oldPath = __DIR__ . '/..' . $oldProfile['profile_image'];
                if (file_exists($oldPath) && !is_dir($oldPath)) {
                    unlink($oldPath);
                }
            }

            $result = $this->userModel->update($id, ['profile_image' => $imageUrl]);

            if ($result['success']) {
                Response::success(['profile_image' => $imageUrl], 'Profile image uploaded successfully');
            } else {
                Response::error('Failed to update database', 500);
            }
        } else {
            Response::error('Failed to move uploaded file', 500);
        }
    }

    /**
     * Ping endpoint to update last active timestamp
     */
    public function ping()
    {
        $user = Middleware::requireAuth();
        $this->userModel->updateLastActive($user['id']);
        Response::success(['status' => 'online'], 'Ping successful');
    }
}
