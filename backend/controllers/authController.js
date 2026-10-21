const crypto = require('crypto');
const userModel = require('../models/userModel');
const notificationModel = require('../models/notificationModel');
const { generateToken, validateEmail, validatePassword } = require('../utils/auth');
const { success, error } = require('../utils/response');
const mail = require('../utils/mail');
const config = require('../config/config');

class AuthController {
    /**
     * User login
     */
    async login(req, res) {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return error(res, 'Email and password are required', 400);
        }

        const user = await userModel.getByEmail(email);
        const isValid = user ? await userModel.verifyPassword(email, password) : false;

        if (!user || !isValid) {
            return error(res, 'Invalid credentials', 401);
        }

        if (user.email_verified === false || user.email_verified === 0 || user.email_verified === 'false') {
            return error(res, 'Please verify your email address to activate your account.', 403);
        }

        if (user.status === 'pending') {
            return error(res, 'Your account is pending approval. Please contact an administrator.', 403);
        }

        if (user.status === 'suspended') {
            return error(res, 'Your account has been suspended. Please contact an administrator.', 403);
        }

        // Update last active
        userModel.updateLastActive(user.id).catch(() => {});

        const token = generateToken(user);

        return success(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                division: user.division,
                status: user.status,
                permissions: user.permissions || null
            },
            token,
            expires_in: config.jwtExpiration
        }, 'Login successful');
    }

    /**
     * User registration
     */
    async register(req, res) {
        const data = req.body || {};

        if (!data.name || !data.email || !data.password || !data.role) {
            return error(res, 'Name, email, password, and role are required', 400);
        }

        if (!validateEmail(data.email)) {
            return error(res, 'Invalid email format', 400);
        }

        if (!validatePassword(data.password)) {
            return error(res, 'Password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        const existing = await userModel.getByEmail(data.email);
        if (existing) {
            return error(res, 'Email already exists', 409);
        }

        const result = await userModel.create(data);
        if (!result.success) {
            return error(res, result.message || 'Registration failed', 500);
        }

        // 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await userModel.setVerificationToken(data.email, otp);

        const subject = "Verify Your Account - Ghana Highway Authority";
        const emailMessage = `
            <div style='font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
                <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #1e293b !important; background: #1e293b !important;'>
                    <tr>
                        <td bgcolor='#1e293b' align='center' style='background-color: #1e293b !important; padding: 26px 12px; border-bottom: 4px solid #f59e0b; text-align: center;'>
                            <h1 style='color: #ffffff !important; margin: 0; font-size: 18px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;'>
                                Ghana Highway Authority
                            </h1>
                            <p style='color: #94a3b8 !important; margin: 6px 0 0; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;'>
                                Asset Management System
                            </p>
                        </td>
                    </tr>
                </table>
                <div style='padding: 40px 30px;'>
                    <h2 style='color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 700;'>Account Verification</h2>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px;'>Hello <strong>${data.name}</strong>,</p>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 30px; font-size: 15px;'>Thank you for registering with the Ghana Highway Authority Asset Management System. Please use the verification code below to activate your account:</p>
                    <div style='background-color: #f1f5f9; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1;'>
                        <span style='font-family: "Courier New", Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb;'>${otp}</span>
                    </div>
                    <p style='color: #64748b; font-size: 14px; margin: 0 0 10px;'>This code will expire in <strong>24 hours</strong>.</p>
                    <p style='color: #64748b; font-size: 14px; margin: 0;'>If you did not create an account, please ignore this email.</p>
                </div>
                <div style='background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center;'>
                    <p style='color: #94a3b8; font-size: 12px; margin: 0 0 10px;'>&copy; ${new Date().getFullYear()} Ghana Highway Authority. All rights reserved.</p>
                    <p style='color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.4;'>
                        Head Office, P.O. Box GP 1641, Accra - Ghana<br>
                        Digital Address: GA-107-2101<br>
                        This is an automated message, please do not reply.
                    </p>
                </div>
            </div>
        `;

        mail.send(data.email, subject, emailMessage).catch(() => {});

        if (data.role === 'Super Admin') {
            notificationModel.notifyAdmins(
                'New Super Admin Registered',
                `${data.name} has registered as Super Admin and is awaiting email verification.`,
                'info'
            ).catch(() => {});
        }

        const resData = { id: result.id };
        if (config.isDevelopment) {
            resData.debug_otp = otp;
        }

        return success(res, resData, 'Registration successful. Please check your email for the verification code.', 201);
    }

    /**
     * Get current authenticated user
     */
    async me(req, res) {
        const fullUser = await userModel.getById(req.user.id);
        if (!fullUser) {
            return error(res, 'User not found', 404);
        }
        return success(res, fullUser, 'User retrieved successfully');
    }

    /**
     * Change current user password
     */
    async changePassword(req, res) {
        const { current_password, new_password } = req.body || {};

        if (!current_password || !new_password) {
            return error(res, 'Current and new password are required', 400);
        }

        const user = await userModel.getById(req.user.id);
        const isValid = await userModel.verifyPassword(user.email, current_password);

        if (!isValid) {
            return error(res, 'Current password is incorrect', 401);
        }

        if (!validatePassword(new_password)) {
            return error(res, 'New password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        const result = await userModel.updatePassword(req.user.id, new_password);
        if (!result.success) {
            return error(res, 'Password change failed', 500);
        }

        return success(res, null, 'Password changed successfully');
    }

    /**
     * Forgot password - Send OTP to email
     */
    async forgotPassword(req, res) {
        const { email } = req.body || {};

        if (!email) {
            return error(res, 'Email is required', 400);
        }

        let user = await userModel.getByEmail(email);
        if (!user) {
            user = await userModel.getByPhone(email);
        }

        if (!user) {
            // For security, don't reveal user absence
            return success(res, null, 'If your account is registered, you will receive reset instructions.');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await userModel.setResetToken(user.email, otp);

        const resetLink = `${config.frontendUrl}/reset-password/${otp}`;
        const subject = "Password Reset Request - Ghana Highway Authority";
        const emailMessage = `
            <div style='font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
                <table role='presentation' width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #1e293b !important; background: #1e293b !important;'>
                    <tr>
                        <td bgcolor='#1e293b' align='center' style='background-color: #1e293b !important; padding: 26px 12px; border-bottom: 4px solid #f59e0b; text-align: center;'>
                            <h1 style='color: #ffffff !important; margin: 0; font-size: 18px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 800; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;'>
                                Ghana Highway Authority
                            </h1>
                            <p style='color: #94a3b8 !important; margin: 6px 0 0; font-size: 12px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;'>
                                Asset Management System
                            </p>
                        </td>
                    </tr>
                </table>
                <div style='padding: 40px 30px;'>
                    <h2 style='color: #1e293b; margin: 0 0 20px; font-size: 20px;'>Password Reset Request</h2>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 20px;'>Hello <strong>${user.name}</strong>,</p>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 30px;'>We received a request to reset the password for your Ghana Highway Authority Asset Management System account. Please use the verification code below to proceed:</p>
                    <div style='background-color: #f1f5f9; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1;'>
                        <span style='font-family: "Courier New", Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb;'>${otp}</span>
                    </div>
                    <p style='color: #64748b; font-size: 14px; margin: 0 0 10px;'>This code will expire in <strong>1 hour</strong>.</p>
                    <p style='color: #64748b; font-size: 14px; margin: 0;'>If you did not request this reset, you can safely ignore this email.</p>
                </div>
                <div style='background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center;'>
                    <p style='color: #94a3b8; font-size: 12px; margin: 0 0 10px;'>&copy; ${new Date().getFullYear()} Ghana Highway Authority. All rights reserved.</p>
                </div>
            </div>
        `;

        const mailSent = await mail.send(user.email, subject, emailMessage);

        const resData = { email_sent: mailSent };
        if (config.isDevelopment) {
            resData.debug_otp = otp;
            resData.debug_reset_link = resetLink;
        }

        return success(res, resData, 'A password reset email has been sent to your registered address.');
    }

    /**
     * Verify OTP token
     */
    async verifyResetOtp(req, res) {
        const { token } = req.body || {};
        if (!token) {
            return error(res, 'OTP token is required', 400);
        }

        const user = await userModel.verifyResetToken(token);
        if (!user) {
            return error(res, 'Invalid or expired OTP', 400);
        }

        return success(res, null, 'OTP verified successfully');
    }

    /**
     * Reset password with OTP token
     */
    async resetPassword(req, res) {
        const { token, password } = req.body || {};

        if (!token || !password) {
            return error(res, 'Token and new password are required', 400);
        }

        if (!validatePassword(password)) {
            return error(res, 'Password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        const result = await userModel.updatePasswordWithToken(token, password);
        if (!result.success) {
            return error(res, result.message || 'Password reset failed', 400);
        }

        return success(res, null, 'Password has been reset successfully. You can now login.');
    }

    /**
     * Verify email with OTP
     */
    async verifyEmail(req, res) {
        const { email, otp } = req.body || {};

        if (!email || !otp) {
            return error(res, 'Email and OTP are required', 400);
        }

        const result = await userModel.verifyVerificationToken(otp);
        if (!result.success) {
            return error(res, result.message || 'Verification failed', 400);
        }

        return success(res, {
            set_password_token: result.set_password_token,
            email: result.email
        }, 'Email verified. Please set your personal password to activate your account.');
    }

    /**
     * Set initial password
     */
    async setInitialPassword(req, res) {
        const { token, password } = req.body || {};

        if (!token || !password) {
            return error(res, 'Token and password are required', 400);
        }

        if (!validatePassword(password)) {
            return error(res, 'Password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        const result = await userModel.setInitialPassword(token, password);
        if (!result.success) {
            return error(res, result.message || 'Failed to set password', 400);
        }

        const user = await userModel.getByEmail(result.email);
        if (user) {
            const jwtToken = generateToken(user);
            return success(res, {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    division: user.division,
                    status: user.status,
                    permissions: user.permissions || null
                },
                token: jwtToken
            }, 'Password set successfully. Welcome to Ghana Highway Authority Asset Management System!');
        }

        return success(res, null, 'Password set successfully. You may now log in.');
    }

    /**
     * Resend verification code
     */
    async resendVerification(req, res) {
        const { email } = req.body || {};

        if (!email) {
            return error(res, 'Email is required', 400);
        }

        const user = await userModel.getByEmail(email);
        if (!user) {
            return success(res, null, 'If your account exists, a verification code has been sent.');
        }

        if (user.email_verified) {
            return error(res, 'Account is already verified.', 400);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await userModel.setVerificationToken(user.email, otp);

        const subject = "Verify Your Account - Ghana Highway Authority";
        const emailMessage = `
            <div style='font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
                <div style='padding: 40px 30px;'>
                    <h2 style='color: #1e293b; margin: 0 0 20px; font-size: 20px; font-weight: 700;'>Account Verification</h2>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 15px;'>Hello <strong>${user.name}</strong>,</p>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 30px; font-size: 15px;'>You requested a new verification code for your Ghana Highway Authority Asset Management System account. Please use the code below to proceed:</p>
                    <div style='background-color: #f1f5f9; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1;'>
                        <span style='font-family: "Courier New", Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb;'>${otp}</span>
                    </div>
                    <p style='color: #64748b; font-size: 14px; margin: 0 0 10px;'>This code will expire in <strong>24 hours</strong>.</p>
                </div>
            </div>
        `;

        mail.send(user.email, subject, emailMessage).catch(() => {});

        const resData = config.isDevelopment ? { debug_otp: otp } : null;
        return success(res, resData, 'A new verification code has been sent to your email.');
    }

    /**
     * Logout
     */
    async logout(req, res) {
        return success(res, null, 'Logout successful');
    }
}

module.exports = new AuthController();
