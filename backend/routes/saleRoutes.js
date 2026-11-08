const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  recordSale,
  recordBulkSales,
  getSales,
  exportToExcel,
  exportToCSV,
  syncToGoogleSheets,
  getGoogleSheetScript,
  getWhatsAppBill,
} = require('../controllers/saleController');

// All sales routes require staff/admin login
router.use(protect);

router.post('/', recordSale);
router.post('/bulk', recordBulkSales);
router.get('/', getSales);
router.get('/export-excel', exportToExcel);
router.get('/export-csv', exportToCSV);
router.post('/sync-google-sheet', syncToGoogleSheets);
router.get('/google-sheet-script', getGoogleSheetScript);
router.get('/:id/whatsapp-bill', getWhatsAppBill);

module.exports = router;

