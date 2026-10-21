const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));
router.get('/me', requireAuth, (req, res) => authController.me(req, res));
router.put('/change-password', requireAuth, (req, res) => authController.changePassword(req, res));
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/verify-reset-otp', (req, res) => authController.verifyResetOtp(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));
router.post('/verify-email', (req, res) => authController.verifyEmail(req, res));
router.post('/set-initial-password', (req, res) => authController.setInitialPassword(req, res));
router.post('/resend-verification', (req, res) => authController.resendVerification(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

module.exports = router;
