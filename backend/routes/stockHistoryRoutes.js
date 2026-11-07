const express = require('express');
const router = express.Router();
const { getStockHistory } = require('../controllers/stockHistoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getStockHistory);

module.exports = router;

