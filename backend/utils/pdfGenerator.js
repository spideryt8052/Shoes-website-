let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (err) {
  console.warn('[PDF Module Warning] PDFKit could not be required:', err.message);
}

/**
 * Generate a professional branded PDF Tax Invoice / E-Bill for NEW MB SHOES Bhagalpur
 * @param {Object} sale - Sale document
 * @param {Object} storeSettings - Store settings
 * @returns {Promise<Buffer>} - Resolves to PDF Buffer
 */
function generateInvoicePDF(sale, storeSettings = {}) {
  return new Promise((resolve, reject) => {
    try {
      if (!PDFDocument) {
        throw new Error('PDF generator library (pdfkit) is not loaded.');
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
          Title: `Tax Invoice - #${sale.invoiceNumber} - NEW MB SHOES`,
          Author: 'NEW MB SHOES Bhagalpur',
          Subject: 'Footwear Purchase E-Receipt & Tax Invoice',
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const shopName = storeSettings.shopName || 'NEW MB SHOES';
      const tagline = storeSettings.tagline || 'Multi-Brand Footwear Showroom Network';
      const helpline = storeSettings.contactNumber || '+91 94312 14500';
      const email = storeSettings.email || 'info@newmbshoes.com';
      const branches = [
        'Branch 1 (Main): D.N. Singh Road, Shah Market (Near Titan World), Bhagalpur',
        'Branch 2: Tatarpur Road, Near Khalifabagh Chowk, Bhagalpur',
        'Branch 3: Tilkamanjhi Chowk, Bhagalpur',
      ];

      const saleDate = new Date(sale.saleDate || Date.now());
      const dateStr = saleDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = saleDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Palette
      const primaryColor = '#0f172a'; // Deep Navy Slate
      const accentColor = '#2563eb'; // Royal Blue
      const mutedColor = '#64748b'; // Gray
      const lightBg = '#f8fafc'; // Off-white
      const borderColor = '#e2e8f0';

      // -------------------------------------------------------------
      // 1. TOP HEADER BRANDING
      // -------------------------------------------------------------
      // Top colored accent bar
      doc.rect(0, 0, doc.page.width, 8).fill(accentColor);

      // Store Title
      doc.fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(22)
        .text(shopName.toUpperCase(), 36, 26, { letterSpacing: 1 });

      doc.fillColor(mutedColor)
        .font('Helvetica')
        .fontSize(9.5)
        .text(tagline, 36, 52);

      // Right Header Badge: "OFFICIAL TAX INVOICE"
      doc.rect(doc.page.width - 200, 24, 164, 40)
        .fill(lightBg)
        .strokeColor(borderColor)
        .stroke();

      doc.fillColor(accentColor)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('DIGITAL TAX INVOICE', doc.page.width - 195, 32, { width: 154, align: 'center' });

      doc.fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(`#${sale.invoiceNumber}`, doc.page.width - 195, 46, { width: 154, align: 'center' });

      // Showroom Branches & Helpline line
      doc.moveDown(1.5);
      doc.strokeColor(borderColor).lineWidth(1).moveTo(36, 76).lineTo(doc.page.width - 36, 76).stroke();

      let branchY = 82;
      doc.fillColor('#475569').font('Helvetica').fontSize(7.5);
      branches.forEach((b) => {
        doc.text(`• ${b}`, 36, branchY);
        branchY += 10;
      });
      doc.text(`Helpline: ${helpline}  |  Web: shoes-website-yaseenbrp25-6387.vercel.app`, 36, branchY);

      // Divider
      const metaTop = branchY + 16;
      doc.strokeColor(borderColor).lineWidth(1).moveTo(36, metaTop).lineTo(doc.page.width - 36, metaTop).stroke();

      // -------------------------------------------------------------
      // 2. INVOICE META & CUSTOMER DETAILS
      // -------------------------------------------------------------
      const boxY = metaTop + 8;
      const colWidth = (doc.page.width - 72) / 2;

      // Left Box: Billed To Customer
      doc.rect(36, boxY, colWidth - 8, 70).fill(lightBg).strokeColor(borderColor).stroke();
      doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(8.5).text('CUSTOMER DETAILS (BILLED TO)', 46, boxY + 8);
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text(sale.customerName || 'Walk-in Customer', 46, boxY + 22);
      doc.fillColor(mutedColor).font('Helvetica').fontSize(9).text(`Phone: ${sale.customerPhone || 'Counter Walk-in'}`, 46, boxY + 38);
      doc.text('Place of Supply: Bhagalpur, Bihar (10)', 46, boxY + 52);

      // Right Box: Invoice Meta
      const rightBoxX = 36 + colWidth + 8;
      doc.rect(rightBoxX, boxY, colWidth - 8, 70).fill(lightBg).strokeColor(borderColor).stroke();
      doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(8.5).text('INVOICE & PAYMENT DETAILS', rightBoxX + 10, boxY + 8);
      doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
      doc.text(`Date & Time : ${dateStr} at ${timeStr}`, rightBoxX + 10, boxY + 22);
      doc.text(`Payment Mode: ${sale.paymentMethod || 'UPI / QR'}`, rightBoxX + 10, boxY + 36);
      doc.text(`Cashier / POS: ${sale.adminName || 'Store Counter'}`, rightBoxX + 10, boxY + 50);

      // -------------------------------------------------------------
      // 3. ITEMIZED PRODUCT TABLE
      // -------------------------------------------------------------
      const tableTop = boxY + 82;
      const tableWidth = doc.page.width - 72;

      // Table Header Row
      doc.rect(36, tableTop, tableWidth, 24).fill(primaryColor);
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
      doc.text('SL', 44, tableTop + 7, { width: 25 });
      doc.text('ITEM DESCRIPTION', 72, tableTop + 7, { width: 240 });
      doc.text('SIZE / COLOR', 315, tableTop + 7, { width: 90 });
      doc.text('QTY', 410, tableTop + 7, { width: 35, align: 'center' });
      doc.text('RATE (₹)', 450, tableTop + 7, { width: 50, align: 'right' });
      doc.text('AMOUNT (₹)', 505, tableTop + 7, { width: 50, align: 'right' });

      // Table Row
      const rowY = tableTop + 24;
      doc.rect(36, rowY, tableWidth, 38).fill('#ffffff').strokeColor(borderColor).stroke();

      doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
      doc.text('1.', 44, rowY + 8, { width: 25 });

      // Item Name & Brand
      doc.font('Helvetica-Bold').fontSize(9.5).text(sale.productName, 72, rowY + 8, { width: 235 });
      doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text(`Brand: ${sale.brandName} | SKU: ${sale.sku || 'N/A'}`, 72, rowY + 22);

      // Variant info
      doc.fillColor(primaryColor).font('Helvetica').fontSize(9);
      doc.text(`UK ${sale.size}`, 315, rowY + 8);
      doc.font('Helvetica').fontSize(8).fillColor(mutedColor).text(sale.color, 315, rowY + 22);

      // Qty & Rate & Total
      doc.fillColor(primaryColor).font('Helvetica').fontSize(9.5);
      doc.text(String(sale.quantity || 1), 410, rowY + 12, { width: 35, align: 'center' });
      doc.text(Number(sale.sellingPrice).toLocaleString('en-IN'), 450, rowY + 12, { width: 50, align: 'right' });
      const itemGross = Number(sale.sellingPrice) * Number(sale.quantity || 1);
      doc.font('Helvetica-Bold').text(itemGross.toLocaleString('en-IN'), 505, rowY + 12, { width: 50, align: 'right' });

      // -------------------------------------------------------------
      // 4. SUMMARY / TOTALS CALCULATION
      // -------------------------------------------------------------
      const summaryY = rowY + 44;
      const summaryBoxWidth = 220;
      const summaryBoxX = doc.page.width - 36 - summaryBoxWidth;

      doc.rect(summaryBoxX, summaryY, summaryBoxWidth, 88).fill(lightBg).strokeColor(borderColor).stroke();

      let curY = summaryY + 8;
      // Subtotal
      doc.fillColor(mutedColor).font('Helvetica').fontSize(9).text('Gross Subtotal:', summaryBoxX + 12, curY);
      doc.fillColor(primaryColor).font('Helvetica').text(`₹${itemGross.toLocaleString('en-IN')}`, summaryBoxX + 12, curY, {
        width: summaryBoxWidth - 24,
        align: 'right',
      });

      // Discount
      curY += 16;
      doc.fillColor(mutedColor).text('In-Store Showroom Discount:', summaryBoxX + 12, curY);
      doc.fillColor('#dc2626').text(`- ₹${Number(sale.discount || 0).toLocaleString('en-IN')}`, summaryBoxX + 12, curY, {
        width: summaryBoxWidth - 24,
        align: 'right',
      });

      // Divider
      curY += 16;
      doc.strokeColor(borderColor).lineWidth(1).moveTo(summaryBoxX + 10, curY).lineTo(summaryBoxX + summaryBoxWidth - 10, curY).stroke();

      // Net Payable
      curY += 8;
      doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('NET TOTAL PAID:', summaryBoxX + 12, curY);
      doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(12).text(`₹${Number(sale.totalAmount).toLocaleString('en-IN')}`, summaryBoxX + 12, curY, {
        width: summaryBoxWidth - 24,
        align: 'right',
      });

      curY += 16;
      doc.fillColor(mutedColor).font('Helvetica').fontSize(8).text(`Payment Mode: ${sale.paymentMethod || 'UPI'} (Confirmed)`, summaryBoxX + 12, curY, {
        width: summaryBoxWidth - 24,
        align: 'right',
      });

      // Left of Summary: Official Seal / Authorized Signature Note
      doc.rect(36, summaryY, colWidth - 8, 88).fill(lightBg).strokeColor(borderColor).stroke();
      doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(8.5).text('NEW MB SHOES VERIFICATION', 46, summaryY + 8);
      doc.fillColor('#475569').font('Helvetica').fontSize(8);
      doc.text('• Authenticated in-store retail transaction.', 46, summaryY + 22);
      doc.text('• Real-time digital bill archived in showroom sales cloud.', 46, summaryY + 34);
      doc.text('• Valid for warranty and 7-day size exchange across all 3 Bhagalpur branches.', 46, summaryY + 46);
      doc.fillColor(mutedColor).fontSize(7.5).text(`Generated by: ${sale.adminName || 'Counter POS'} | System Timestamp: ${new Date().toISOString()}`, 46, summaryY + 68);

      // -------------------------------------------------------------
      // 5. 7-DAY EXCHANGE POLICY & GOOGLE REVIEW BANNER
      // -------------------------------------------------------------
      const bannerY = summaryY + 98;
      const bannerWidth = doc.page.width - 72;

      // Exchange Policy Highlight Box
      doc.rect(36, bannerY, bannerWidth, 42).fill('#ecfdf5').strokeColor('#a7f3d0').stroke();
      doc.fillColor('#065f46').font('Helvetica-Bold').fontSize(9).text('🛡️ 7-DAY FIT & SIZE EXCHANGE GUARANTEE', 46, bannerY + 7);
      doc.fillColor('#047857').font('Helvetica').fontSize(8).text(
        'Size exchange is available within 7 days across all 3 NEW MB SHOES Bhagalpur showrooms (Shah Market, Tatarpur, Tilkamanjhi). Footwear must be in unworn condition with original box packaging and this official PDF receipt.',
        46,
        bannerY + 20,
        { width: bannerWidth - 20 }
      );

      // Google Review Section
      const reviewY = bannerY + 48;
      doc.rect(36, reviewY, bannerWidth, 34).fill('#f1f5f9').strokeColor(borderColor).stroke();
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8.5).text('⭐ Rate Your In-Store Footwear Trial Experience', 46, reviewY + 6);
      doc.fillColor(accentColor).font('Helvetica').fontSize(8).text(
        storeSettings.googleReviewUrl || 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
        46,
        reviewY + 18,
        { underline: true }
      );

      // -------------------------------------------------------------
      // 6. FOOTER
      // -------------------------------------------------------------
      const footerY = doc.page.height - 36;
      doc.strokeColor(borderColor).lineWidth(1).moveTo(36, footerY - 8).lineTo(doc.page.width - 36, footerY - 8).stroke();
      doc.fillColor(mutedColor).font('Helvetica').fontSize(7.5).text(
        '*** THANK YOU FOR SHOPPING AT NEW MB SHOES BHAGALPUR! VISIT US AGAIN FOR NEW BRANDED ARRIVALS ***',
        36,
        footerY,
        { width: doc.page.width - 72, align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePDF };

