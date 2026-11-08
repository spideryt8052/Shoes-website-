const express = require('express');
const router = express.Router();
const {
  register,
  login,
  sendEmailOtp,
  verifyEmailOtp,
  googleLogin,
  verify2FA,
  getMe,
  logout,
  updateProfile,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
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

// Step 2 Mandatory Gate: Google Authenticator PIN
router.post('/verify-2fa', verify2FA);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin user management (Admin only)
router.route('/users')
  .get(protect, authorize('admin'), getAdmins)
  .post(protect, authorize('admin'), createAdmin);

router.route('/users/:id')
  .put(protect, authorize('admin'), updateAdmin)
  .delete(protect, authorize('admin'), deleteAdmin);

module.exports = router;

