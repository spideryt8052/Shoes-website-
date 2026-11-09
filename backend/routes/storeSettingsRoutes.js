const express = require('express');
const router = express.Router();
const {
  getStoreSettings,
  updateStoreSettings,
} = require('../controllers/storeSettingsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getStoreSettings);
router.put('/', protect, authorize('admin', 'developer'), updateStoreSettings);

module.exports = router;

