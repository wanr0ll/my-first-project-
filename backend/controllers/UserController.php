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
     * Upload profile image (stored as base64 in DB — no filesystem required)
     */
    public function uploadProfileImage()
    {
        $user = Middleware::requireAuth();
        $id = $user['id'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['profile_image']) || !is_string($data['profile_image'])) {
            Response::error('No valid image data provided', 400);
            return;
        }

        $base64 = $data['profile_image'];

        // Validate it is a JPEG or PNG data URL
        if (!preg_match('/^data:image\/(jpeg|png|gif|webp);base64,/', $base64)) {
            Response::error('Invalid image format. Only JPEG, PNG, GIF, or WebP allowed.', 400);
            return;
        }

        // Rough size check: base64 adds ~33% overhead; 5MB raw ≈ ~6.8MB base64
        if (strlen($base64) > 7 * 1024 * 1024) {
            Response::error('Image exceeds 5MB limit', 400);
            return;
        }

        $result = $this->userModel->update($id, ['profile_image' => $base64]);

        if ($result['success']) {
            Response::success(['profile_image' => $base64], 'Profile image uploaded successfully');
        } else {
            Response::error('Failed to update database', 500);
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
