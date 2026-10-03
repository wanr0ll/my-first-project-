<?php

/**
 * CORS and Security Headers
 */

class Middleware
{
    /**
     * Enable CORS
     */
    public static function enableCORS()
    {
        // Get the origin of the request
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

        // CORS_ALLOW_ALL=true env var: allow any origin (emergency override via Railway dashboard)
        if (defined('CORS_ALLOW_ALL') && CORS_ALLOW_ALL) {
            header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
        } else {
            $allowed_origins = ALLOWED_ORIGINS;
            if ($origin && in_array($origin, $allowed_origins)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            } else {
                header('Access-Control-Allow-Origin: ' . ($allowed_origins[0] ?? '*'));
            }
        }

        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Content-Type: application/json');

        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    /**
     * Set security headers
     */
    public static function setSecurityHeaders()
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }

    /**
     * Check authentication
     */
    public static function requireAuth()
    {
        $authHeader = Request::getAuthHeader();

        if (!$authHeader) {
            Response::error('Authorization header missing', 401);
        }

        if (strpos($authHeader, 'Bearer ') === false) {
            Response::error('Invalid authorization format', 401);
        }

        $token = str_replace('Bearer ', '', $authHeader);
        $user = Auth::verifyToken($token);

        if (!$user) {
            Response::error('Invalid or expired token', 401);
        }

        // Verify user status in database to ensure suspended/deleted users lose access immediately
        require_once __DIR__ . '/../config/Database.php';
        require_once __DIR__ . '/../models/User.php';
        
        $db = (new Database())->connect();
        $userModel = new User($db);
        $dbUser = $userModel->getById($user['id']);

        if (!$dbUser) {
            Response::error('User not found or has been deleted', 401);
        }

        if ($dbUser['status'] === 'suspended') {
            Response::error('Your account has been suspended. Please contact an administrator.', 403);
        }

        if ($dbUser['status'] === 'pending') {
            Response::error('Your account is pending approval.', 403);
        }

        // Update token info with latest database info
        $user['role'] = $dbUser['role'];
        $user['status'] = $dbUser['status'];
        if (isset($dbUser['permissions'])) {
            $user['permissions'] = $dbUser['permissions'];
        }

        return $user;
    }

    /**
     * Check admin role — only Super Admin has system-wide admin access.
     */
    public static function requireAdmin()
    {
        $user = self::requireAuth();

        if ($user['role'] !== 'Super Admin') {
            Response::error('Admin access required', 403);
        }

        return $user;
    }

    /**
     * Check specific role
     */
    public static function requireRole($roles)
    {
        $user = self::requireAuth();

        if (!is_array($roles)) {
            $roles = [$roles];
        }

        if ($user['role'] === 'Super Admin') {
            return $user;
        }

        if (!in_array($user['role'], $roles)) {
            Response::error('Insufficient permissions', 403);
        }

        return $user;
    }
}
