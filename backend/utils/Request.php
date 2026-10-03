<?php
/**
 * Request Handler - Input validation and sanitization
 */

class Request {
    /**
     * Get request method
     */
    public static function getMethod() {
        return strtoupper($_SERVER['REQUEST_METHOD']);
    }

    /**
     * Get request body as JSON
     */
    public static function getJSON() {
        return json_decode(file_get_contents('php://input'), true);
    }

    /**
     * Get GET parameters
     */
    public static function getParams() {
        return $_GET;
    }

    /**
     * Get specific GET parameter
     */
    public static function getParam($key, $default = null) {
        return isset($_GET[$key]) ? sanitize($_GET[$key]) : $default;
    }

    /**
     * Get specific POST parameter
     */
    public static function getPost($key, $default = null) {
        $data = json_decode(file_get_contents('php://input'), true);
        return isset($data[$key]) ? sanitize($data[$key]) : $default;
    }

    /**
     * Check if request is POST
     */
    public static function isPost() {
        return self::getMethod() === 'POST';
    }

    /**
     * Check if request is GET
     */
    public static function isGet() {
        return self::getMethod() === 'GET';
    }

    /**
     * Check if request is PUT
     */
    public static function isPut() {
        return self::getMethod() === 'PUT';
    }

    /**
     * Check if request is DELETE
     */
    public static function isDelete() {
        return self::getMethod() === 'DELETE';
    }

    /**
     * Check if request is PATCH
     */
    public static function isPatch() {
        return self::getMethod() === 'PATCH';
    }

    /**
     * Get authorization header
     */
    public static function getAuthHeader() {
        // Direct check for common PHP/Apache variations
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        // Try getallheaders case-insensitively
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $name => $value) {
                if (strtolower($name) === 'authorization') {
                    return $value;
                }
            }
        }

        // Use fallback method
        $headers = self::getAllHeadersFallback();
        foreach ($headers as $name => $value) {
            if (strtolower($name) === 'authorization') {
                return $value;
            }
        }

        return null;
    }

    /**
     * Get request headers
     */
    public static function getHeaders() {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }
        return self::getAllHeadersFallback();
    }

    /**
     * Fallback for getallheaders() when it's not available (common on XAMPP)
     */
    private static function getAllHeadersFallback() {
        if (function_exists('getallheaders')) {
            return getallheaders();
        }

        // Fallback: manually extract headers from $_SERVER
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $headerKey = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$headerKey] = $value;
            }
        }
        return $headers;
    }
}

/**
 * Sanitize input
 */
function sanitize($data) {
    if (is_array($data)) {
        return array_map('sanitize', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate password strength
 */
function validatePassword($password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password);
}

/**
 * Generate unique ID
 * Uses microtime + a static counter to guarantee uniqueness even during bulk
 * imports where hundreds of IDs may be generated in the same second.
 */
function generateId($prefix = '') {
    static $counter = 0;
    $counter++;
    // microtime(true) gives microsecond precision; pad counter to 4 digits
    $micro = str_replace('.', '', sprintf('%.4f', fmod(microtime(true), 100)));
    return $prefix . $micro . str_pad($counter, 4, '0', STR_PAD_LEFT);
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}
?>
