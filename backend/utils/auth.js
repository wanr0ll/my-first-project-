const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/config');

/**
 * Generate a JWT token
 */
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        division: user.division || null,
        permissions: user.permissions || null
    };

    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: config.jwtExpiration,
        algorithm: 'HS256'
    });
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch {
        // Fallback for custom PHP HMAC tokens if necessary
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const [headerB64, payloadB64, signatureB64] = parts;
            const expectedSig = crypto
                .createHmac('sha256', config.jwtSecret)
                .update(`${headerB64}.${payloadB64}`)
                .digest('base64');
            if (signatureB64 !== expectedSig) return null;
            const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
            if (!payload || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
                return null;
            }
            return payload;
        } catch {
            return null;
        }
    }
}

/**
 * Hash password using bcrypt (compatible with PHP password_hash)
 */
function hashPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

/**
 * Verify password against bcrypt hash (supports PHP $2y$, $2b$, and $2a$ prefixes)
 */
function verifyPassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    // PHP bcrypt hashes begin with $2y$. Replace with $2a$ for bcryptjs compatibility
    const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$');
    try {
        return bcrypt.compareSync(plainPassword, normalizedHash);
    } catch (err) {
        console.error('Password comparison error:', err.message);
        return false;
    }
}

/**
 * Generate unique entity ID
 */
function generateId(prefix = 'AST') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return Boolean(email && re.test(email));
}

/**
 * Validate password strength (at least 8 characters with upper, lower, and number)
 */
function validatePassword(password) {
    if (!password || typeof password !== 'string') return false;
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpper && hasLower && hasNumber;
}

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    verifyPassword,
    generateId,
    validateEmail,
    validatePassword
};
