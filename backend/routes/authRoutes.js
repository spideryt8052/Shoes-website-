const express = require('express');
const router = express.Router();
const {
  register,
  login,
  sendEmailOtp,
  verifyEmailOtp,
  googleLogin,
  verify2FA,
  request2FAReset,
  verify2FAReset,
  getMe,
  logout,
  updateProfile,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  get2FAStatus,
  setup2FA,
  enable2FA,
  disable2FA,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Primary Step 1 Auth Routes
router.post('/register', loginLimiter, register);
router.post('/signup', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/send-email-otp', loginLimiter, sendEmailOtp);
router.post('/verify-email-otp', loginLimiter, verifyEmailOtp);
router.post('/google-login', loginLimiter, googleLogin);

// Step 2 Mandatory Gate: Google Authenticator PIN & Emergency Recovery
router.post('/verify-2fa', loginLimiter, verify2FA);
router.post('/reset-2fa-request', loginLimiter, request2FAReset);
router.post('/reset-2fa-verify', loginLimiter, verify2FAReset);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// In-App 2FA Management (Like other standard apps & websites)
router.get('/2fa/status', protect, get2FAStatus);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);

// Admin user management (Admin only)
router.route('/users')
  .get(protect, authorize('admin'), getAdmins)
  .post(protect, authorize('admin'), createAdmin);

router.route('/users/:id')
  .put(protect, authorize('admin'), updateAdmin)
  .delete(protect, authorize('admin'), deleteAdmin);

module.exports = router;

