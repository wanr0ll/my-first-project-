/**
 * Email Service - Frontend Simulation
 * Simulates email verification without actual email sending
 * Uses localStorage to track verification status
 */

/**
 * Generate a random verification token
 * @returns {string} - Random token
 */
const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Simulate sending verification email
 * @param {string} email - User's email address
 * @param {string} userName - User's name
 * @returns {object} - { success: boolean, token: string, message: string }
 */
export const sendVerificationEmail = (email, userName) => {
    const token = generateToken();
    const verificationData = {
        email,
        userName,
        token,
        sentAt: new Date().toISOString(),
        verified: false
    };

    // Store in localStorage
    const existingVerifications = JSON.parse(localStorage.getItem('gha_email_verifications') || '{}');
    existingVerifications[email] = verificationData;
    localStorage.setItem('gha_email_verifications', JSON.stringify(existingVerifications));

    // Simulate email content (would be sent in real implementation)
    console.log(`
    ========================================
    📧 SIMULATED EMAIL VERIFICATION
    ========================================
    To: ${email}
    Subject: Verify Your Asset Management System Account
    
    Hello ${userName},
    
    Welcome to Asset Management System!
    
    Please verify your email address by clicking the link below:
    ${window.location.origin}/verify-email?token=${token}
    
    Or use this verification code: ${token}
    
    This link will expire in 24 hours.
    
    If you didn't create this account, please ignore this email.
    
    Best regards,
    Asset Management System Team
    ========================================
    `);

    return {
        success: true,
        token,
        message: `Verification email sent to ${email} (simulated - check console for details)`
    };
};

/**
 * Verify email token
 * @param {string} token - Verification token
 * @returns {object} - { success: boolean, email: string, message: string }
 */
export const verifyEmailToken = (token) => {
    const verifications = JSON.parse(localStorage.getItem('gha_email_verifications') || '{}');

    // Find email by token
    const email = Object.keys(verifications).find(
        key => verifications[key].token === token
    );

    if (!email) {
        return {
            success: false,
            email: null,
            message: 'Invalid or expired verification token'
        };
    }

    // Check if already verified
    if (verifications[email].verified) {
        return {
            success: false,
            email,
            message: 'Email already verified'
        };
    }

    // Mark as verified
    verifications[email].verified = true;
    verifications[email].verifiedAt = new Date().toISOString();
    localStorage.setItem('gha_email_verifications', JSON.stringify(verifications));

    return {
        success: true,
        email,
        message: 'Email verified successfully!'
    };
};

/**
 * Check if email is verified
 * @param {string} email - Email to check
 * @returns {boolean} - true if verified
 */
export const isEmailVerified = (email) => {
    const verifications = JSON.parse(localStorage.getItem('gha_email_verifications') || '{}');
    return verifications[email]?.verified || false;
};

/**
 * Get verification status for an email
 * @param {string} email - Email to check
 * @returns {object} - Verification data or null
 */
export const getVerificationStatus = (email) => {
    const verifications = JSON.parse(localStorage.getItem('gha_email_verifications') || '{}');
    return verifications[email] || null;
};

/**
 * Simulate sending password reset email
 * @param {string} email - User's email
 * @returns {object} - { success: boolean, message: string }
 */
export const sendPasswordResetEmail = (email) => {
    const resetToken = generateToken();

    console.log(`
    ========================================
    📧 SIMULATED PASSWORD RESET EMAIL
    ========================================
    To: ${email}
    Subject: Reset Your Asset Management System Password
    
    Hello,
    
    We received a request to reset your password.
    
    Click the link below to reset your password:
    ${window.location.origin}/reset-password?token=${resetToken}
    
    Or use this reset code: ${resetToken}
    
    This link will expire in 1 hour.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    Asset Management System Team
    ========================================
    `);

    return {
        success: true,
        message: `Password reset email sent to ${email} (simulated - check console for details)`
    };
};

/**
 * Simulate sending password change notification
 * @param {string} email - User's email
 * @param {string} userName - User's name
 * @returns {object} - { success: boolean, message: string }
 */
export const sendPasswordChangeNotification = (email, userName) => {
    console.log(`
    ========================================
    📧 SIMULATED PASSWORD CHANGE NOTIFICATION
    ========================================
    To: ${email}
    Subject: Your Asset Management System Password Was Changed
    
    Hello ${userName},
    
    Your password was successfully changed on ${new Date().toLocaleString()}.
    
    If you didn't make this change, please contact your administrator immediately.
    
    Best regards,
    Asset Management System Team
    ========================================
    `);

    return {
        success: true,
        message: 'Password change notification sent (simulated)'
    };
};
