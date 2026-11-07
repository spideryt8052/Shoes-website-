const StoreSettings = require('../models/StoreSettings');
const Sale = require('../models/Sale');

/**
 * Push a single sale or batch of sales to Google Sheets Webhook
 * @param {Array|Object} sales - Single sale or array of sales
 */
const pushToGoogleSheet = async (sales) => {
  try {
    const settings = await StoreSettings.findOne();
    if (!settings || !settings.googleSheetWebhookUrl || settings.googleSheetWebhookUrl.trim() === '') {
      return { success: false, reason: 'Google Sheet Webhook URL not configured' };
    }

    const salesArray = Array.isArray(sales) ? sales : [sales];
    if (salesArray.length === 0) return { success: true, count: 0 };

    // Format rows for Google Sheets
    const rows = salesArray.map((s) => ({
      date: new Date(s.saleDate || s.createdAt).toLocaleDateString('en-IN'),
      time: new Date(s.saleDate || s.createdAt).toLocaleTimeString('en-IN'),
      invoiceNumber: s.invoiceNumber,
      productName: s.productName,
      brand: s.brandName,
      sku: s.sku,
      size: s.size,
      color: s.color,
      quantity: s.quantity,
      unitPrice: s.sellingPrice,
      totalAmount: s.totalAmount,
      paymentMethod: s.paymentMethod,
      staffName: s.adminName || 'Store Staff',
      customerName: s.customerName || 'Walk-in',
      customerPhone: s.customerPhone || '',
      remarks: s.remarks || '',
    }));

    // Post to Google Apps Script Webhook
    const response = await fetch(settings.googleSheetWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'append_sales',
        storeName: settings.shopName || 'STEP HOUSE',
        rows,
      }),
    });

    // Mark sales as synced
    const ids = salesArray.map((s) => s._id);
    await Sale.updateMany(
      { _id: { $in: ids } },
      { syncedToGoogleSheet: true, syncedAt: new Date() }
    );

    return { success: true, count: rows.length };
  } catch (error) {
    console.error('[GoogleSheetSync Error]:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Ready-to-copy Google Apps Script template for the shop owner
 */
const GOOGLE_APPS_SCRIPT_TEMPLATE = `
/**
 * STEP HOUSE FOOTWEAR - GOOGLE APPS SCRIPT WEBHOOK
 * Paste this into Google Sheets > Extensions > Apps Script
 * Click Deploy > New Deployment > Select type: Web App
 * Execute as: Me
 * Who has access: Anyone
 * Copy the Web App URL and paste it into STEP HOUSE Store Settings!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create Header if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Date", "Time", "Invoice No", "Shoe Model", "Brand", "SKU",
        "Size", "Colour", "Qty Sold", "Price/Pair (₹)", "Total (₹)",
        "Payment Mode", "Staff Name", "Customer Name", "Customer Phone", "Remarks"
      ]);
      sheet.getRange(1, 1, 1, 16).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    var data = JSON.parse(e.postData.contents);
    var rows = data.rows || [];
    
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      sheet.appendRow([
        r.date, r.time, r.invoiceNumber, r.productName, r.brand, r.sku,
        r.size, r.color, r.quantity, r.unitPrice, r.totalAmount,
        r.paymentMethod, r.staffName, r.customerName, r.customerPhone, r.remarks
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", rowsAdded: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;

module.exports = {
  pushToGoogleSheet,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
};

