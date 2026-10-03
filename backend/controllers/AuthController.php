<?php

/**
 * Auth Controller - Handle authentication
 */

class AuthController
{
    private $userModel;
    private $notificationModel;

    public function __construct($userModel, $notificationModel = null)
    {
        $this->userModel = $userModel;
        $this->notificationModel = $notificationModel;
    }

    /**
     * Login
     */
    public function login()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        if (!isset($data['email']) || !isset($data['password'])) {
            Response::error('Email and password are required', 400);
        }

        $user = $this->userModel->getByEmail($data['email']);

        if (!$user || !$this->userModel->verifyPassword($data['email'], $data['password'])) {
            Response::error('Invalid credentials', 401);
        }

        // Check if email is verified
        if (isset($user['email_verified']) && $user['email_verified'] == 0) {
            Response::error('Please verify your email address to activate your account.', 403);
        }

        // Check account status
        if ($user['status'] === 'pending') {
            Response::error('Your account is pending approval. Please contact an administrator.', 403);
        }

        if ($user['status'] === 'suspended') {
            Response::error('Your account has been suspended. Please contact an administrator.', 403);
        }

        $token = Auth::generateToken($user);

        Response::success([
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'division' => $user['division'],
                'status' => $user['status'],
                'permissions' => $user['permissions'] ?? null
            ],
            'token' => $token,
            'expires_in' => JWT_EXPIRATION
        ], 'Login successful');
    }

    /**
     * Register
     */
    public function register()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        // Validate input
        if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            Response::error('Name, email, password, and role are required', 400);
        }

        if (!validateEmail($data['email'])) {
            Response::error('Invalid email format', 400);
        }

        if (!validatePassword($data['password'])) {
            Response::error('Password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        // Check if email exists
        if ($this->userModel->getByEmail($data['email'])) {
            Response::error('Email already exists', 409);
        }

        $result = $this->userModel->create($data);

        if (!$result['success']) {
            Response::error('Registration failed', 500);
        }

        // Generate 6-digit verification OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->userModel->setVerificationToken($data['email'], $otp);

        // Send Verification Email
        $subject = "Verify Your Account - GHA Asset Manager";
        $emailMessage = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                <h2 style='color: #2c3e50;'>Welcome to GHA Asset Manager</h2>
                <p>Hello {$data['name']},</p>
                <p>Thank you for registering. Please use the verification code below to activate your account:</p>
                <div style='background: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3498db; border-radius: 5px; margin: 20px 0;'>
                    {$otp}
                </div>
                <p style='color: #7f8c8d; font-size: 12px;'>If you did not create an account, please ignore this email.</p>
                <hr style='border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;'>
                <p style='color: #bdc3c7; font-size: 10px;'>This is an automated message from Ghana Highway Authority Asset Management System.</p>
            </div>
        ";

        Mail::send($data['email'], $subject, $emailMessage);

        if ($this->notificationModel && $data['role'] === 'Super Admin') {
            $this->notificationModel->notifyAdmins(
                'New Super Admin Registered',
                "{$data['name']} has registered as Super Admin and is awaiting email verification.",
                'info'
            );
        }

        $responseData = ['id' => $result['id']];
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            $responseData['debug_otp'] = $otp;
        }

        Response::success($responseData, 'Registration successful. Please check your email for the verification code.', 201);
    }

    /**
     * Verify email using OTP
     */
    public function verifyEmail()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        if (empty($data['email']) || empty($data['otp'])) {
            Response::error('Email and OTP are required', 400);
        }

        $result = $this->userModel->verifyVerificationToken($data['otp']);

        if (!$result['success']) {
            $msg = isset($result['message']) ? $result['message'] : 'Verification failed';
            Response::error($msg, 400);
        }

        // Return a short-lived token the frontend uses to set the user's own private password
        Response::success([
            'set_password_token' => $result['set_password_token'],
            'email' => $result['email']
        ], 'Email verified. Please set your personal password to activate your account.');
    }

    /**
     * Set initial private password after email verification
     */
    public function setInitialPassword()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        if (empty($data['token']) || empty($data['password'])) {
            Response::error('Token and password are required', 400);
        }

        if (!validatePassword($data['password'])) {
            Response::error('Password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        $result = $this->userModel->setInitialPassword($data['token'], $data['password']);

        if (!$result['success']) {
            $msg = isset($result['message']) ? $result['message'] : 'Failed to set password';
            Response::error($msg, 400);
        }

        // Auto-login: generate JWT for the now-active user
        $user = $this->userModel->getByEmail($result['email']);
        if ($user) {
            $token = Auth::generateToken($user);
            Response::success([
                'user' => [
                    'id'          => $user['id'],
                    'name'        => $user['name'],
                    'email'       => $user['email'],
                    'role'        => $user['role'],
                    'division'    => $user['division'],
                    'status'      => $user['status'],
                    'permissions' => $user['permissions'] ?? null
                ],
                'token' => $token
            ], 'Password set successfully. Welcome to GHA Asset Manager!');
        }

        Response::success(null, 'Password set successfully. You may now log in.');
    }

    /**
     * Resend verification OTP
     */
    public function resendVerification()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        if (empty($data['email'])) {
            Response::error('Email is required', 400);
        }

        $user = $this->userModel->getByEmail($data['email']);

        if (!$user) {
            // Act as success to prevent user enum
            Response::success(null, 'If your account exists, a verification code has been sent.');
        }

        if (isset($user['email_verified']) && $user['email_verified'] == 1) {
            Response::error('Account is already verified.', 400);
        }

        // Generate 6-digit verification OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->userModel->setVerificationToken($user['email'], $otp);

        $subject = "Verify Your Account - GHA Asset Manager";
        $emailMessage = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                <h2 style='color: #2c3e50;'>Welcome to GHA Asset Manager</h2>
                <p>Hello {$user['name']},</p>
                <p>You requested a new verification code. Please use the code below to activate your account:</p>
                <div style='background: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #3498db; border-radius: 5px; margin: 20px 0;'>
                    {$otp}
                </div>
                <p style='color: #7f8c8d; font-size: 12px;'>If you did not request this, please ignore this email.</p>
                <hr style='border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;'>
                <p style='color: #bdc3c7; font-size: 10px;'>This is an automated message from Ghana Highway Authority Asset Management System.</p>
            </div>
        ";

        Mail::send($user['email'], $subject, $emailMessage);

        $responseData = null;
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            $responseData = ['debug_otp' => $otp];
        }

        Response::success($responseData, 'A new verification code has been sent to your email.');
    }

    /**
     * Get current user
     */
    public function me()
    {
        if (!Request::isGet()) {
            Response::error('Method not allowed', 405);
        }

        $user = Middleware::requireAuth();

        $fullUser = $this->userModel->getById($user['id']);

        Response::success($fullUser, 'User retrieved successfully');
    }

    /**
     * Change password
     */
    public function changePassword()
    {
        if (!Request::isPut()) {
            Response::error('Method not allowed', 405);
        }

        $user = Middleware::requireAuth();
        $data = Request::getJSON();

        if (empty($data['current_password']) || empty($data['new_password'])) {
            Response::error('Current and new password are required', 400);
        }

        if (!$this->userModel->verifyPassword($user['email'], $data['current_password'])) {
            Response::error('Current password is incorrect', 401);
        }

        if (!validatePassword($data['new_password'])) {
            Response::error('New password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        $result = $this->userModel->updatePassword($user['id'], $data['new_password']);

        if (!$result['success']) {
            Response::error('Password change failed', 500);
        }

        Response::success(null, 'Password changed successfully');
    }

    /**
     * Forgot password - Send reset link
     */
    public function forgotPassword()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        if (empty($data['email'])) {
            Response::error('Email is required', 400);
        }

        $user = $this->userModel->getByEmail($data['email']);

        if (!$user) {
            // If email lookup fails, try phone lookup
            $user = $this->userModel->getByPhone($data['email']);
        }

        if (!$user) {
            // For security, don't reveal if account exists. Just return success.
            Response::success(null, 'If your account is registered, you will receive reset instructions.');
        }

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $result = $this->userModel->setResetToken($user['email'], $otp);

        if (!$result['success']) {
            Response::error('Failed to generate OTP', 500);
        }

        // Generate a simulated reset link for frontend development
        $resetLink = FRONTEND_URL . "/reset-password/" . $otp;

        // Send real email
        $subject = "Password Reset Request - GHA Asset Manager";
        $emailMessage = "
            <div style='font-family: \"Segoe UI\", Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>
                <div style='background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px; text-align: center;'>
                    <h1 style='color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;'>GHA Asset Manager</h1>
                    <p style='color: #94a3b8; margin: 5px 0 0; font-size: 12px; font-weight: bold; letter-spacing: 1px;'>GHANA HIGHWAY AUTHORITY</p>
                </div>
                <div style='padding: 40px 30px;'>
                    <h2 style='color: #1e293b; margin: 0 0 20px; font-size: 20px;'>Password Reset Request</h2>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 20px;'>Hello <strong>{$user['name']}</strong>,</p>
                    <p style='color: #475569; line-height: 1.6; margin: 0 0 30px;'>We received a request to reset the password for your GHA Asset Manager account. Please use the verification code below to proceed:</p>
                    
                    <div style='background-color: #f1f5f9; border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1;'>
                        <span style='font-family: \"Courier New\", Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb;'>{$otp}</span>
                    </div>

                    <p style='color: #64748b; font-size: 14px; margin: 0 0 10px;'>This code will expire in <strong>1 hour</strong>.</p>
                    <p style='color: #64748b; font-size: 14px; margin: 0;'>If you did not request this reset, you can safely ignore this email.</p>
                </div>
                <div style='background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center;'>
                    <p style='color: #94a3b8; font-size: 12px; margin: 0 0 10px;'>&copy; " . date('Y') . " Ghana Highway Authority. All rights reserved.</p>
                    <p style='color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.4;'>
                        Head Office, P.O. Box GP 1641, Accra - Ghana<br>
                        Digital Address: GA-107-2101<br>
                        This is an automated message, please do not reply.
                    </p>
                </div>
            </div>
        ";

        $mailSent = Mail::send($user['email'], $subject, $emailMessage);

        $responseData = ['email_sent' => $mailSent];
        if (defined('DEBUG_MODE') && DEBUG_MODE) {
            $responseData['debug_otp'] = $otp;
            $responseData['debug_reset_link'] = $resetLink;
        }

        Response::success($responseData, 'A password reset email has been sent to your registered address.');
    }

    /**
     * Verify OTP for password reset
     */
    public function verifyResetOtp()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        if (empty($data['token'])) {
            Response::error('OTP token is required', 400);
        }

        $user = $this->userModel->verifyResetToken($data['token']);

        if (!$user) {
            Response::error('Invalid or expired OTP', 400);
        }

        Response::success(null, 'OTP verified successfully');
    }

    /**
     * Reset password using token
     */
    public function resetPassword()
    {
        if (!Request::isPost()) {
            Response::error('Method not allowed', 405);
        }

        $data = Request::getJSON();

        if (empty($data['token']) || empty($data['password'])) {
            Response::error('Token and new password are required', 400);
        }

        if (!validatePassword($data['password'])) {
            Response::error('Password must be at least 8 characters with uppercase, lowercase, and numbers', 400);
        }

        $result = $this->userModel->updatePasswordWithToken($data['token'], $data['password']);

        if (!$result['success']) {
            Response::error($result['message'] || 'Password reset failed', 400);
        }

        Response::success(null, 'Password has been reset successfully. You can now login.');
    }

    /**
     * Logout
     */
    public function logout()
    {
        // In JWT implementation, logout is typically handled client-side (token deletion)
        Response::success(null, 'Logout successful');
    }
}
