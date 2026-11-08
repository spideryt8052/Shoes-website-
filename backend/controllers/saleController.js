const xlsx = require('xlsx');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const StockHistory = require('../models/StockHistory');
const StoreSettings = require('../models/StoreSettings');
const { pushToGoogleSheet, GOOGLE_APPS_SCRIPT_TEMPLATE } = require('../services/googleSheetsService');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const cache = require('../utils/cache');

// Helper to generate Invoice Number (Prefixed with MB for NEW MB SHOES)
const generateInvoiceNumber = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `MB-${dateStr}-${randomStr}`;
};

// @desc    Record a single in-store sale in real time
// @route   POST /api/sales
// @access  Private (Admin / Staff)
exports.recordSale = async (req, res, next) => {
  try {
    const {
      productId,
      variantId,
      quantity = 1,
      sellingPrice,
      discount = 0,
      paymentMethod = 'UPI / QR',
      customerName = 'Walk-in Customer',
      customerPhone = '',
      remarks = '',
      storeBranch,
      storeAddress,
      storePhone,
    } = req.body;

    if (!productId || !variantId) {
      return res.status(400).json({ success: false, message: 'Product and Size Variant are required' });
    }

    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Selected size variant not found on product' });
    }

    if (variant.quantity < parsedQty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient in-store stock! Only ${variant.quantity} pair(s) available for Size ${variant.size} (${variant.color}).`,
      });
    }

    const previousQuantity = variant.quantity;
    const newQuantity = previousQuantity - parsedQty;
    const finalPrice = sellingPrice ? Number(sellingPrice) : product.sellingPrice;
    const totalAmount = Math.max(0, finalPrice * parsedQty - (Number(discount) || 0));
    const invoiceNumber = generateInvoiceNumber();

    // 1. Update Variant Quantity
    variant.quantity = newQuantity;
    await product.save();

    // 2. Record Stock Movement History
    await StockHistory.create({
      product: product._id,
      productName: product.name,
      variantId: variant._id,
      size: variant.size,
      color: variant.color,
      previousQuantity,
      newQuantity,
      quantityChanged: -parsedQty,
      changeType: 'Stock Out',
      adminUser: req.admin ? req.admin._id : null,
      adminName: req.admin ? req.admin.name : 'Store Staff',
      remarks: remarks || `In-Store Sale (Invoice #${invoiceNumber})`,
    });

    // 3. Create Sale Record
    const sale = await Sale.create({
      invoiceNumber,
      product: product._id,
      productName: product.name,
      brandName: product.brandName,
      sku: variant.sku || `${product.sku}-${variant.color}-${variant.size}`,
      variantId: variant._id,
      size: variant.size,
      color: variant.color,
      quantity: parsedQty,
      sellingPrice: finalPrice,
      discount: Number(discount) || 0,
      totalAmount,
      paymentMethod,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      storeBranch: storeBranch || 'NEW MB SHOES (Shah Market Main Flagship)',
      storeAddress: storeAddress || 'D.N. Singh Road, Shah Market (Near Titan World), Bhagalpur',
      storePhone: storePhone || '+91 94312 14500',
      adminUser: req.admin ? req.admin._id : null,
      adminName: req.admin ? req.admin.name : 'Store Staff',
      remarks: remarks.trim(),
      saleDate: new Date(),
    });

    // 4. Background Sync to Google Sheet (if configured)
    const settings = await StoreSettings.findOne();
    if (settings && settings.googleSheetWebhookUrl && settings.autoSyncGoogleSheet) {
      pushToGoogleSheet(sale).catch((err) =>
        console.error('Auto Google Sheet sync error:', err.message)
      );
    }

    cache.clearTag('products:');
    cache.clearTag('inventory:');

    res.status(201).json({
      success: true,
      message: `Sale recorded: ${parsedQty} pair(s) of ${product.name} (Size ${variant.size}). Remaining in store: ${newQuantity} pairs.`,
      sale,
      remainingVariantStock: newQuantity,
      totalProductStock: product.totalStock,
      isAvailable: product.isAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record multiple sales before day ends (Batch / Shift end sales)
// @route   POST /api/sales/bulk
// @access  Private (Admin / Staff)
exports.recordBulkSales = async (req, res, next) => {
  try {
    const { items, defaultPaymentMethod = 'UPI / QR', remarks = 'End-of-day batch sales entry' } = req.body;
    // items: [{ productId, variantId, quantity, sellingPrice, paymentMethod, customerName, customerPhone }]

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one sale item' });
    }

    const recordedSales = [];

    for (const item of items) {
      const { productId, variantId, quantity = 1, sellingPrice, paymentMethod, customerName, customerPhone } = item;
      const product = await Product.findById(productId);
      if (!product) continue;

      const variant = product.variants.id(variantId);
      if (!variant) continue;

      const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
      const prevQty = variant.quantity;
      const newQty = Math.max(0, prevQty - parsedQty);
      const invoiceNumber = generateInvoiceNumber();
      const unitPrice = sellingPrice ? Number(sellingPrice) : product.sellingPrice;
      const totalAmount = unitPrice * parsedQty;

      variant.quantity = newQty;
      await product.save();

      await StockHistory.create({
        product: product._id,
        productName: product.name,
        variantId: variant._id,
        size: variant.size,
        color: variant.color,
        previousQuantity: prevQty,
        newQuantity: newQty,
        quantityChanged: -parsedQty,
        changeType: 'Stock Out',
        adminUser: req.admin ? req.admin._id : null,
        adminName: req.admin ? req.admin.name : 'Store Staff',
        remarks: remarks || `End-of-day sale entry (${invoiceNumber})`,
      });

      const sale = await Sale.create({
        invoiceNumber,
        product: product._id,
        productName: product.name,
        brandName: product.brandName,
        sku: variant.sku || `${product.sku}-${variant.color}-${variant.size}`,
        variantId: variant._id,
        size: variant.size,
        color: variant.color,
        quantity: parsedQty,
        sellingPrice: unitPrice,
        totalAmount,
        paymentMethod: paymentMethod || defaultPaymentMethod,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        adminUser: req.admin ? req.admin._id : null,
        adminName: req.admin ? req.admin.name : 'Store Staff',
        remarks,
        saleDate: new Date(),
      });

      recordedSales.push(sale);
    }

    // Auto-sync to Google Sheet if configured
    const settings = await StoreSettings.findOne();
    if (settings && settings.googleSheetWebhookUrl && settings.autoSyncGoogleSheet && recordedSales.length > 0) {
      pushToGoogleSheet(recordedSales).catch((err) =>
        console.error('Bulk Google Sheet sync error:', err.message)
      );
    }

    cache.clearTag('products:');
    cache.clearTag('inventory:');

    res.status(201).json({
      success: true,
      message: `Successfully recorded ${recordedSales.length} in-store sales. Live showroom inventory updated!`,
      salesCount: recordedSales.length,
      sales: recordedSales,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales history with date filter & aggregates
// @route   GET /api/sales
// @access  Private (Admin / Staff)
exports.getSales = async (req, res, next) => {
  try {
    const { period, startDate, endDate, paymentMethod, brand, search, page = 1, limit = 20 } = req.query;

    const query = {};

    // Period filter
    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.saleDate = { $gte: startOfDay };
    } else if (period === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.saleDate = { $gte: startOfYesterday, $lt: endOfYesterday };
    } else if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.saleDate.$lte = eDate;
      }
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    if (brand && brand !== 'All') {
      query.brandName = brand;
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { productName: regex },
        { invoiceNumber: regex },
        { sku: regex },
        { customerName: regex },
        { customerPhone: regex },
        { adminName: regex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('product', 'primaryImage');

    // Aggregate revenue & pairs for this query
    const statsAggregation = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalPairs: { $sum: '$quantity' },
        },
      },
    ]);

    const totalRevenue = statsAggregation.length > 0 ? statsAggregation[0].totalRevenue : 0;
    const totalPairs = statsAggregation.length > 0 ? statsAggregation[0].totalPairs : 0;

    // Payment methods breakdown for today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const paymentBreakdown = await Sale.aggregate([
      { $match: { saleDate: { $gte: startOfToday } } },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$totalAmount' },
          count: { $sum: '$quantity' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalRevenue,
      totalPairs,
      paymentBreakdown,
      sales,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Sales to Real Excel (.xlsx) Spreadsheet
// @route   GET /api/sales/export-excel
// @access  Private (Admin)
exports.exportToExcel = async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const query = {};

    const now = new Date();
    if (period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.saleDate = { $gte: startOfDay };
    } else if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.saleDate.$lte = eDate;
      }
    }

    const sales = await Sale.find(query).sort({ saleDate: -1 });

    // Format Excel Rows
    const dataRows = sales.map((s, idx) => ({
      'S.No': idx + 1,
      'Invoice No': s.invoiceNumber,
      'Date': new Date(s.saleDate).toLocaleDateString('en-IN'),
      'Time': new Date(s.saleDate).toLocaleTimeString('en-IN'),
      'Shoe Model': s.productName,
      'Brand': s.brandName,
      'SKU': s.sku,
      'Colour': s.color,
      'Size': s.size,
      'Pairs Sold': s.quantity,
      'Price Per Pair (INR)': s.sellingPrice,
      'Discount (INR)': s.discount,
      'Total Amount (INR)': s.totalAmount,
      'Payment Mode': s.paymentMethod,
      'Staff Name': s.adminName,
      'Customer Name': s.customerName,
      'Customer Phone': s.customerPhone,
      'Google Sheet Synced': s.syncedToGoogleSheet ? 'Yes' : 'No',
      'Remarks': s.remarks,
    }));

    const worksheet = xlsx.utils.json_to_sheet(dataRows);

    // Adjust column widths for clean readability
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 18 }, // Invoice No
      { wch: 12 }, // Date
      { wch: 12 }, // Time
      { wch: 32 }, // Shoe Model
      { wch: 14 }, // Brand
      { wch: 16 }, // SKU
      { wch: 14 }, // Colour
      { wch: 10 }, // Size
      { wch: 12 }, // Pairs Sold
      { wch: 18 }, // Price Per Pair
      { wch: 14 }, // Discount
      { wch: 18 }, // Total Amount
      { wch: 16 }, // Payment Mode
      { wch: 18 }, // Staff Name
      { wch: 20 }, // Customer Name
      { wch: 16 }, // Customer Phone
      { wch: 20 }, // Google Sheet Synced
      { wch: 30 }, // Remarks
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'In-Store Sales');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `Step_House_Sales_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Sales to CSV (Excel Compatible with UTF-8 BOM)
// @route   GET /api/sales/export-csv
// @access  Private (Admin)
exports.exportToCSV = async (req, res, next) => {
  try {
    const sales = await Sale.find().sort({ saleDate: -1 });

    const headers = [
      'Invoice No',
      'Date',
      'Time',
      'Shoe Model',
      'Brand',
      'SKU',
      'Colour',
      'Size',
      'Quantity Sold',
      'Unit Price',
      'Total Amount (INR)',
      'Payment Mode',
      'Staff Name',
      'Customer Name',
      'Customer Phone',
      'Remarks',
    ];

    const csvRows = [headers.join(',')];

    sales.forEach((s) => {
      const row = [
        `"${s.invoiceNumber}"`,
        `"${new Date(s.saleDate).toLocaleDateString('en-IN')}"`,
        `"${new Date(s.saleDate).toLocaleTimeString('en-IN')}"`,
        `"${s.productName.replace(/"/g, '""')}"`,
        `"${s.brandName}"`,
        `"${s.sku}"`,
        `"${s.color}"`,
        `"${s.size}"`,
        s.quantity,
        s.sellingPrice,
        s.totalAmount,
        `"${s.paymentMethod}"`,
        `"${s.adminName}"`,
        `"${s.customerName}"`,
        `"${s.customerPhone}"`,
        `"${(s.remarks || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Excel compatibility

    res.setHeader('Content-Disposition', `attachment; filename="Step_House_Sales_${Date.now()}.csv"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger manual sync to Google Sheets
// @route   POST /api/sales/sync-google-sheet
// @access  Private (Admin)
exports.syncToGoogleSheets = async (req, res, next) => {
  try {
    const { syncAll } = req.body;
    const query = syncAll ? {} : { syncedToGoogleSheet: false };

    const sales = await Sale.find(query).sort({ saleDate: 1 }).limit(100);

    if (sales.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All in-store sales are already up-to-date in your Google Sheet!',
        syncedCount: 0,
      });
    }

    const result = await pushToGoogleSheet(sales);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error || result.reason || 'Failed to sync with Google Sheet',
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully exported ${result.count} sales record(s) directly to your Google Sheet!`,
      syncedCount: result.count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Google Apps Script webhook code template
// @route   GET /api/sales/google-sheet-script
// @access  Private (Admin)
exports.getGoogleSheetScript = (req, res) => {
  res.status(200).json({
    success: true,
    scriptTemplate: GOOGLE_APPS_SCRIPT_TEMPLATE,
  });
};

// @desc    Generate AI-formatted digital WhatsApp bill text for a sale
// @route   GET /api/sales/:id/whatsapp-bill
// @access  Private (Admin / Staff)
exports.getWhatsAppBill = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    const settings = await StoreSettings.findOne();
    const storeName = settings?.shopName || 'NEW MB SHOES';
    const storeAddress = settings?.address || 'Shah Market, D.N. Singh Road, Bhagalpur';
    const contactNo = settings?.contactNumber || '+91 94312 14500';
    const reviewUrl = settings?.googleReviewUrl || 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6';

    const dateFormatted = new Date(sale.saleDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeFormatted = new Date(sale.saleDate).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const customerGreeting = sale.customerName && sale.customerName !== 'Walk-in Customer'
      ? `Dear *${sale.customerName}*,`
      : 'Dear Customer,';

    const pdfDownloadUrl = `https://shoes-website-yaseenbrp25-6387.vercel.app/api/sales/invoice/${sale.invoiceNumber}/pdf`;

    const billText = `🏪 *${storeName.toUpperCase()}*
📍 _${storeAddress}_
📞 Showroom Helpline: ${contactNo}
─────────────────────
🧾 *DIGITAL TAX INVOICE & RECEIPT*
Invoice: *#${sale.invoiceNumber}*
Date: ${dateFormatted} | ${timeFormatted}
Cashier: ${sale.adminName || 'Counter POS'}
─────────────────────
${customerGreeting}
Thank you for visiting *NEW MB SHOES Bhagalpur*! Here is your official e-bill & PDF receipt:

👟 *PURCHASED ITEM*:
• *${sale.productName}*
  Brand: *${sale.brandName}*
  Size: *UK ${sale.size}* | Color: *${sale.color}*
  Quantity: *${sale.quantity} Pair(s)*
  Rate: ₹${sale.sellingPrice.toLocaleString('en-IN')}
${sale.discount > 0 ? `  Discount: -₹${sale.discount.toLocaleString('en-IN')}\n` : ''}
💰 *TOTAL AMOUNT PAID: ₹${sale.totalAmount.toLocaleString('en-IN')}*
💳 Payment Method: *${sale.paymentMethod}*
─────────────────────
📄 *DOWNLOAD OFFICIAL PDF BILL & TAX INVOICE*:
${pdfDownloadUrl}
─────────────────────
🛡️ *7-DAY SIZE EXCHANGE POLICY*:
• Fit/size exchange is available within 7 days at any of our 3 Bhagalpur branches (Shah Market, Tatarpur, Tilkamanjhi) with this PDF bill.
• Shoes must be unworn and in original box packaging.

⭐ *How was your showroom trial experience? Review us on Google*:
${reviewUrl}

✨ *Visit NEW MB SHOES again for fresh branded footwear arrivals!*`;

    const cleanPhone = sale.customerPhone ? sale.customerPhone.replace(/\D/g, '') : '';
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(billText)}`;

    res.status(200).json({
      success: true,
      invoiceNumber: sale.invoiceNumber,
      customerPhone: sale.customerPhone,
      cleanPhone: formattedPhone,
      pdfDownloadUrl,
      billText,
      whatsappUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download / Stream branded PDF Invoice for a sale (Public for WhatsApp customers)
// @route   GET /api/sales/invoice/:invoiceNumber/pdf or GET /api/sales/:id/pdf
// @access  Public
exports.downloadInvoicePDF = async (req, res, next) => {
  try {
    const { identifier, invoiceNumber, id } = req.params;
    const searchTarget = identifier || invoiceNumber || id;

    if (!searchTarget) {
      return res.status(400).json({ success: false, message: 'Invoice number or ID is required' });
    }

    let sale;
    if (searchTarget.match(/^[0-9a-fA-F]{24}$/)) {
      sale = await Sale.findById(searchTarget);
    }
    if (!sale) {
      sale = await Sale.findOne({ invoiceNumber: searchTarget });
    }

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: `Sale invoice '${searchTarget}' was not found in showroom records.`,
      });
    }

    const settings = await StoreSettings.findOne();
    const pdfBuffer = await generateInvoicePDF(sale, settings || {});

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="NEW-MB-SHOES-Invoice-${sale.invoiceNumber}.pdf"`
    );
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

