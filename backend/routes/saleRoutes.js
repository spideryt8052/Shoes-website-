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
  downloadInvoicePDF,
} = require('../controllers/saleController');

// Public route for customers to download their official PDF bill from WhatsApp
router.get('/invoice/:invoiceNumber/pdf', downloadInvoicePDF);
router.get('/:id/pdf', downloadInvoicePDF);

// All other sales routes require staff/admin login
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

