const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createRemovalRequest,
  getDailyStatus,
  getRemovalRequests,
  approveRemovalRequest,
  rejectRemovalRequest,
} = require('../controllers/removalRequestController');

router.use(protect);

router.post('/', createRemovalRequest);
router.get('/', getRemovalRequests);
router.get('/daily-status', getDailyStatus);

router.put('/:id/approve', authorize('admin', 'developer'), approveRemovalRequest);
router.put('/:id/reject', authorize('admin', 'developer'), rejectRemovalRequest);

module.exports = router;

