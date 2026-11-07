const express = require('express');
const router = express.Router();
const {
  getInventory,
  updateVariantStock,
  batchStockAdjustment,
  getDashboardStats,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInventory);
router.get('/dashboard-stats', protect, getDashboardStats);
router.post('/update-variant', protect, updateVariantStock);
router.post('/batch-update', protect, batchStockAdjustment);

module.exports = router;

