const { verifyToken } = require('../utils/auth');
const { error } = require('../utils/response');
const { query } = require('../config/db');

/**
 * Require valid JWT authentication
 */
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return error(res, 'Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
        return error(res, 'Invalid or expired authentication token', 401);
    }

    try {
        const result = await query(
            'SELECT id, name, email, role, division, status, email_verified, permissions FROM users WHERE id = $1 LIMIT 1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return error(res, 'User no longer exists', 401);
        }

        const user = result.rows[0];

        if (user.status === 'suspended') {
            return error(res, 'Your account has been suspended. Please contact an administrator.', 403);
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            division: user.division,
            status: user.status,
            permissions: user.permissions
        };

        next();
    } catch (err) {
        console.error('requireAuth database error:', err.message);
        return error(res, 'Internal server error during authentication', 500);
    }
}

/**
 * Require specific user role(s)
 */
function requireRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, 'Authentication required', 401);
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return error(res, 'Access denied. You do not have permission to perform this action.', 403);
        }

        next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};
