const express = require('express');
const router = express.Router();
const {
  getStoreSettings,
  updateStoreSettings,
} = require('../controllers/storeSettingsController');
const { protect } = require('../middleware/auth');

router.get('/', getStoreSettings);
router.put('/', protect, updateStoreSettings);

module.exports = router;

