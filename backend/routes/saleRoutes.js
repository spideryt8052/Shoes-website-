const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  recordSale,
  recordBulkSales,
  getSales,
  exportToExcel,
  exportToCSV,
  syncToGoogleSheets,
  getGoogleSheetScript,
  getWhatsAppBill,
  sendWhatsAppBill,
  downloadInvoicePDF,
} = require('../controllers/saleController');

// Public route for customers to download their official PDF bill from WhatsApp
router.get('/invoice/:invoiceNumber/pdf', downloadInvoicePDF);
router.get('/:id/pdf', downloadInvoicePDF);

// All other sales routes require staff/admin login
router.use(protect);

router.post('/', recordSale);
router.post('/bulk', recordBulkSales);
router.get('/:id/whatsapp-bill', getWhatsAppBill);
router.post('/:id/send-whatsapp', sendWhatsAppBill);

// Store Financial Ledger & Reports (Admin / Developer only)
router.get('/', authorize('admin', 'developer'), getSales);
router.get('/export-excel', authorize('admin', 'developer'), exportToExcel);
router.get('/export-csv', authorize('admin', 'developer'), exportToCSV);
router.post('/sync-google-sheet', authorize('admin', 'developer'), syncToGoogleSheets);
router.get('/google-sheet-script', authorize('admin', 'developer'), getGoogleSheetScript);

module.exports = router;

