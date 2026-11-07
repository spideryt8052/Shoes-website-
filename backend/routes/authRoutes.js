const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  logout,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Admin user management (Admin only)
router.route('/users')
  .get(protect, authorize('admin'), getAdmins)
  .post(protect, authorize('admin'), createAdmin);

router.route('/users/:id')
  .put(protect, authorize('admin'), updateAdmin)
  .delete(protect, authorize('admin'), deleteAdmin);

module.exports = router;

