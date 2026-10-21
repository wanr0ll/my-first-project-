const userModel = require('../models/userModel');
const { success, error, paginated } = require('../utils/response');
const { validateEmail } = require('../utils/auth');

class UserController {
    /**
     * Get all users (Super Admin only)
     */
    async getAll(req, res) {
        const page = parseInt(req.query.page, 10) || 1;
        const perPage = parseInt(req.query.per_page, 10) || 10;

        const filters = {
            role: req.query.role || null,
            division: req.query.division || null,
            search: req.query.search || null
        };

        const result = await userModel.getAll(page, perPage, filters);
        return paginated(res, result.data, result.total, page, perPage, 'Users retrieved successfully');
    }

    /**
     * Get user by ID
     */
    async getById(req, res) {
        const id = req.params.id || req.query.id;
        if (!id) {
            return error(res, 'User ID is required', 400);
        }

        const user = await userModel.getById(id);
        if (!user) {
            return error(res, 'User not found', 404);
        }

        return success(res, user, 'User retrieved successfully');
    }

    /**
     * Create user (Super Admin only)
     */
    async create(req, res) {
        const data = req.body || {};

        if (!data.name || !data.email || !data.password || !data.role) {
            return error(res, 'Name, email, password, and role are required', 400);
        }

        if (!validateEmail(data.email)) {
            return error(res, 'Invalid email format', 400);
        }

        const existing = await userModel.getByEmail(data.email);
        if (existing) {
            return error(res, 'Email already exists', 409);
        }

        const result = await userModel.create(data);
        if (!result.success) {
            return error(res, result.message || 'User creation failed', 500);
        }

        return success(res, { id: result.id }, 'User created successfully', 201);
    }

    /**
     * Update user details
     */
    async update(req, res) {
        const id = req.params.id || req.body.id || req.query.id;
        if (!id) {
            return error(res, 'User ID is required', 400);
        }

        const isAdmin = req.user.role === 'Super Admin';
        const isSelf = String(req.user.id) === String(id);

        if (!isAdmin && !isSelf) {
            return error(res, 'Access denied. You can only update your own profile.', 403);
        }

        const existing = await userModel.getById(id);
        if (!existing) {
            return error(res, 'User not found', 404);
        }

        const result = await userModel.update(id, req.body || {});
        if (!result.success) {
            return error(res, result.message || 'Update failed', 500);
        }

        return success(res, null, 'User updated successfully');
    }

    /**
     * Delete user (Super Admin only)
     */
    async delete(req, res) {
        const id = req.params.id || req.query.id;
        if (!id) {
            return error(res, 'User ID is required', 400);
        }

        const existing = await userModel.getById(id);
        if (!existing) {
            return error(res, 'User not found', 404);
        }

        const result = await userModel.delete(id);
        if (!result.success) {
            return error(res, result.message || 'Delete failed', 500);
        }

        return success(res, null, 'User deleted successfully');
    }

    /**
     * Upload user profile image as base64
     */
    async uploadProfileImage(req, res) {
        const id = req.user.id;
        const { profile_image } = req.body || {};

        if (!profile_image || typeof profile_image !== 'string') {
            return error(res, 'No valid image data provided', 400);
        }

        if (!profile_image.startsWith('data:image/')) {
            return error(res, 'Invalid image format. Only JPEG, PNG, GIF, or WebP allowed.', 400);
        }

        if (profile_image.length > 7 * 1024 * 1024) {
            return error(res, 'Image exceeds 5MB limit', 400);
        }

        const result = await userModel.update(id, { profile_image });
        if (!result.success) {
            return error(res, 'Failed to update profile image: ' + result.message, 500);
        }

        return success(res, { profile_image }, 'Profile image uploaded successfully');
    }

    /**
     * Ping to update last active timestamp
     */
    async ping(req, res) {
        await userModel.updateLastActive(req.user.id);
        return success(res, { status: 'online' }, 'Ping successful');
    }
}

module.exports = new UserController();
