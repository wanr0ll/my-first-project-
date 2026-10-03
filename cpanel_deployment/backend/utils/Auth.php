<?php

/**
 * Authentication Helper
 * Handles JWT token creation and verification
 */

class Auth
{
    /**
     * Generate JWT Token
     */
    public static function generateToken($user)
    {
        $header = [
            'alg' => JWT_ALGO,
            'typ' => 'JWT'
        ];

        $payload = [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role'],
            'division' => $user['division'] ?? null,
            'permissions' => isset($user['permissions']) ? $user['permissions'] : null,
            'iat' => time(),
            'exp' => time() + JWT_EXPIRATION
        ];

        $header_encoded = base64_encode(json_encode($header));
        $payload_encoded = base64_encode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            $header_encoded . '.' . $payload_encoded,
            JWT_SECRET,
            true
        );
        $signature_encoded = base64_encode($signature);

        return $header_encoded . '.' . $payload_encoded . '.' . $signature_encoded;
    }

    /**
     * Verify JWT Token
     */
    public static function verifyToken($token)
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return false;
        }

        list($header_encoded, $payload_encoded, $signature_encoded) = $parts;

        $signature = hash_hmac(
            'sha256',
            $header_encoded . '.' . $payload_encoded,
            JWT_SECRET,
            true
        );
        $signature_expected = base64_encode($signature);

        if ($signature_encoded !== $signature_expected) {
            return false;
        }

        $payload = json_decode(base64_decode($payload_encoded), true);

        if (!$payload || !isset($payload['exp'])) {
            return false;
        }

        if ($payload['exp'] < time()) {
            return false; // Token expired
        }

        return $payload;
    }

    /**
     * Extract user ID from token
     */
    public static function getUserIdFromToken($token)
    {
        $payload = self::verifyToken($token);
        return $payload ? $payload['id'] : null;
    }

    /**
     * Extract user from token
     */
    public static function getUserFromToken($token)
    {
        return self::verifyToken($token);
    }
}
