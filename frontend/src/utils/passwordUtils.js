/**
 * Password Strength Utilities
 * Frontend-only password validation and strength calculation
 */

/**
 * Calculate password strength score and level
 * @param {string} password - The password to evaluate
 * @returns {object} - { score: 0-100, level: 'weak'|'medium'|'strong', feedback: string }
 */
export const calculatePasswordStrength = (password) => {
    if (!password) {
        return { score: 0, level: 'weak', feedback: 'Enter a password' };
    }

    let score = 0;
    const feedback = [];

    // Length check (max 40 points)
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 15; // lowercase
    if (/[A-Z]/.test(password)) score += 15; // uppercase
    if (/[0-9]/.test(password)) score += 15; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score += 15; // special characters

    // Bonus for good combinations
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 5;
    if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 5;

    // Determine level
    let level = 'weak';
    if (score >= 70) level = 'strong';
    else if (score >= 50) level = 'medium';

    // Generate feedback
    if (password.length < 8) feedback.push('Use at least 8 characters');
    if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
    if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
    if (!/[0-9]/.test(password)) feedback.push('Add numbers');
    if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters (!@#$%^&*)');

    return {
        score: Math.min(score, 100),
        level,
        feedback: feedback.length > 0 ? feedback.join(', ') : 'Strong password!'
    };
};

/**
 * Get password requirements list
 * @returns {array} - List of requirement objects
 */
export const getPasswordRequirements = () => {
    return [
        { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
        { id: 'uppercase', label: 'One uppercase letter (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
        { id: 'lowercase', label: 'One lowercase letter (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
        { id: 'number', label: 'One number (0-9)', test: (pwd) => /[0-9]/.test(pwd) },
        { id: 'special', label: 'One special character (!@#$%^&*)', test: (pwd) => /[^a-zA-Z0-9]/.test(pwd) }
    ];
};

/**
 * Validate if password meets all requirements
 * @param {string} password - The password to validate
 * @returns {object} - { isValid: boolean, failedRequirements: array }
 */
export const validatePassword = (password) => {
    const requirements = getPasswordRequirements();
    const failedRequirements = requirements.filter(req => !req.test(password));

    return {
        isValid: failedRequirements.length === 0,
        failedRequirements: failedRequirements.map(req => req.label)
    };
};

/**
 * Check if password is common/weak
 * @param {string} password - The password to check
 * @returns {boolean} - true if password is common
 */
export const isCommonPassword = (password) => {
    const commonPasswords = [
        'password', '12345678', 'qwerty', 'abc123', 'monkey',
        '1234567890', 'letmein', 'trustno1', 'dragon', 'baseball',
        'iloveyou', 'master', 'sunshine', 'ashley', 'bailey',
        'passw0rd', 'shadow', '123123', '654321', 'superman'
    ];

    return commonPasswords.includes(password.toLowerCase());
};

/**
 * Generate password strength color
 * @param {string} level - 'weak', 'medium', or 'strong'
 * @returns {string} - Tailwind color class
 */
export const getStrengthColor = (level) => {
    switch (level) {
        case 'strong':
            return 'bg-success';
        case 'medium':
            return 'bg-warning';
        case 'weak':
        default:
            return 'bg-danger';
    }
};

/**
 * Generate password strength text color
 * @param {string} level - 'weak', 'medium', or 'strong'
 * @returns {string} - Tailwind text color class
 */
export const getStrengthTextColor = (level) => {
    switch (level) {
        case 'strong':
            return 'text-success';
        case 'medium':
            return 'text-warning';
        case 'weak':
        default:
            return 'text-danger';
    }
};
