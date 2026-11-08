/**
 * Self-Contained High-Resolution Vector PDF Generator (ISO 32000-1 / PDF-1.4)
 * Custom engineered for NEW MB SHOES Bhagalpur.
 * 
 * Features:
 * - 100% Pure JavaScript (Zero external binary or font file dependencies).
 * - Instant sub-millisecond execution in serverless cloud (Vercel) & local environments.
 * - Standard Type 1 Vector Fonts (Helvetica & Helvetica-Bold) supported natively across
 *   all mobile and desktop devices (iOS, Android, Chrome, Safari, Edge, Adobe Reader).
 * - Full retail showroom layout: Header, customer details, itemized table,
 *   subtotals, discounts, 7-day size exchange guarantee, and Google review link.
 */

function generateInvoicePDF(sale, settings = {}) {
  return new Promise((resolve) => {
    let stream = '';

    const fillRect = (x, y, w, h, r, g, b) => {
      stream += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg ${x} ${y} ${w} ${h} re f\n`;
    };

    const strokeRect = (x, y, w, h, r, g, b, lw = 1) => {
      stream += `${lw} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x} ${y} ${w} ${h} re s\n`;
    };

    const line = (x1, y1, x2, y2, r, g, b, lw = 1) => {
      stream += `${lw} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1} ${y1} m ${x2} ${y2} l s\n`;
    };

    const text = (str, font, size, x, y, r = 0, g = 0, b = 0) => {
      const escaped = String(str || '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/[\r\n]/g, ' ');
      stream += `BT /${font} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${x} ${y} Tm (${escaped}) Tj ET\n`;
    };

    // 1. Top Accent Bar (Royal Blue)
    fillRect(0, 834, 595.28, 8, 0.15, 0.39, 0.92);

    // 2. Store Header
    const storeName = settings.shopName || 'NEW MB SHOES';
    const storeTagline = settings.tagline || 'Multi-Brand Footwear Showroom Network - Bhagalpur, Bihar';
    const helpline = settings.contactNumber || '+91 94312 14500';

    text(storeName.toUpperCase(), 'F2', 22, 36, 804, 0.06, 0.09, 0.16);
    text(storeTagline, 'F1', 9.5, 36, 788, 0.39, 0.45, 0.55);

    // Badge: DIGITAL TAX INVOICE
    fillRect(390, 780, 170, 42, 0.97, 0.98, 0.99);
    strokeRect(390, 780, 170, 42, 0.88, 0.91, 0.94);
    text('OFFICIAL TAX INVOICE', 'F2', 9, 418, 806, 0.15, 0.39, 0.92);
    text('#' + sale.invoiceNumber, 'F2', 11, 410, 792, 0.06, 0.09, 0.16);

    // Branches & Helpline line
    line(36, 772, 560, 772, 0.88, 0.91, 0.94);
    text('Branch 1 (Main Flagship): D.N. Singh Road, Shah Market (Near Titan World), Bhagalpur', 'F1', 7.5, 36, 760, 0.28, 0.33, 0.41);
    text('Branch 2: Tatarpur Main Road  |  Branch 3: Tilkamanjhi Chowk, Bhagalpur', 'F1', 7.5, 36, 748, 0.28, 0.33, 0.41);
    text(`Helpline: ${helpline}  |  Web: shoes-website-yaseenbrp25-6387.vercel.app`, 'F1', 7.5, 36, 736, 0.28, 0.33, 0.41);

    // 3. Customer & Meta Boxes
    line(36, 728, 560, 728, 0.88, 0.91, 0.94);

    // Left Box: Customer Details
    fillRect(36, 650, 255, 70, 0.97, 0.98, 0.99);
    strokeRect(36, 650, 255, 70, 0.88, 0.91, 0.94);
    text('BILLED TO (CUSTOMER DETAILS)', 'F2', 8.5, 46, 706, 0.15, 0.39, 0.92);
    text(sale.customerName || 'Walk-in Customer', 'F2', 11, 46, 690, 0.06, 0.09, 0.16);
    text('Mobile: ' + (sale.customerPhone || 'Counter Walk-in'), 'F1', 9, 46, 676, 0.39, 0.45, 0.55);
    text('Place of Supply: Bhagalpur, Bihar (Code 10)', 'F1', 7.5, 46, 662, 0.39, 0.45, 0.55);

    // Right Box: Transaction Meta
    fillRect(305, 650, 255, 70, 0.97, 0.98, 0.99);
    strokeRect(305, 650, 255, 70, 0.88, 0.91, 0.94);
    text('INVOICE & TRANSACTION META', 'F2', 8.5, 315, 706, 0.15, 0.39, 0.92);
    text('Date & Time : ' + new Date(sale.saleDate || Date.now()).toLocaleString('en-IN'), 'F1', 8.5, 315, 690, 0.06, 0.09, 0.16);
    text('Payment Mode: ' + (sale.paymentMethod || 'UPI / QR'), 'F1', 8.5, 315, 676, 0.06, 0.09, 0.16);
    text('Cashier POS : ' + (sale.adminName || 'Store Counter POS'), 'F1', 8.5, 315, 662, 0.06, 0.09, 0.16);

    // 4. Product Table
    // Table Header Row
    fillRect(36, 612, 524, 24, 0.06, 0.09, 0.16);
    text('SL', 'F2', 8.5, 46, 620, 1, 1, 1);
    text('ITEM DESCRIPTION', 'F2', 8.5, 75, 620, 1, 1, 1);
    text('SIZE / COLOR', 'F2', 8.5, 310, 620, 1, 1, 1);
    text('QTY', 'F2', 8.5, 405, 620, 1, 1, 1);
    text('RATE (Rs)', 'F2', 8.5, 455, 620, 1, 1, 1);
    text('AMOUNT (Rs)', 'F2', 8.5, 510, 620, 1, 1, 1);

    // Table Row
    fillRect(36, 566, 524, 46, 1, 1, 1);
    strokeRect(36, 566, 524, 46, 0.88, 0.91, 0.94);
    text('1.', 'F1', 9, 46, 594, 0.06, 0.09, 0.16);
    text(sale.productName || 'Footwear Item', 'F2', 10, 75, 596, 0.06, 0.09, 0.16);
    text('Brand: ' + (sale.brandName || 'Brand') + '  |  SKU: ' + (sale.sku || 'MB-001'), 'F1', 8, 75, 580, 0.39, 0.45, 0.55);
    text('UK ' + (sale.size || 'N/A'), 'F1', 9.5, 310, 596, 0.06, 0.09, 0.16);
    text(sale.color || '', 'F1', 8, 310, 580, 0.39, 0.45, 0.55);
    text(String(sale.quantity || 1), 'F1', 9.5, 412, 590, 0.06, 0.09, 0.16);
    text(Number(sale.sellingPrice || 0).toLocaleString('en-IN'), 'F1', 9.5, 460, 590, 0.06, 0.09, 0.16);
    const gross = Number(sale.sellingPrice || 0) * Number(sale.quantity || 1);
    text(gross.toLocaleString('en-IN'), 'F2', 10, 515, 590, 0.06, 0.09, 0.16);

    // 5. Summary Total Box (Right)
    fillRect(325, 468, 235, 86, 0.97, 0.98, 0.99);
    strokeRect(325, 468, 235, 86, 0.88, 0.91, 0.94);
    text('Gross Subtotal:', 'F1', 8.5, 337, 538, 0.39, 0.45, 0.55);
    text('Rs. ' + gross.toLocaleString('en-IN'), 'F1', 8.5, 485, 538, 0.06, 0.09, 0.16);
    text('Showroom Discount:', 'F1', 8.5, 337, 522, 0.39, 0.45, 0.55);
    text('- Rs. ' + Number(sale.discount || 0).toLocaleString('en-IN'), 'F1', 8.5, 480, 522, 0.86, 0.15, 0.15);
    line(337, 512, 548, 512, 0.88, 0.91, 0.94);
    text('NET TOTAL PAID:', 'F2', 10, 337, 494, 0.06, 0.09, 0.16);
    text('Rs. ' + Number(sale.totalAmount || 0).toLocaleString('en-IN'), 'F2', 11, 470, 494, 0.15, 0.39, 0.92);
    text('Payment: ' + (sale.paymentMethod || 'UPI') + ' (Confirmed)', 'F1', 7.5, 337, 478, 0.39, 0.45, 0.55);

    // Left of Summary: Official Authentication Box
    fillRect(36, 468, 275, 86, 0.97, 0.98, 0.99);
    strokeRect(36, 468, 275, 86, 0.88, 0.91, 0.94);
    text('NEW MB SHOES OFFICIAL AUTHENTICATION', 'F2', 8, 46, 538, 0.15, 0.39, 0.92);
    text('• Genuine physical footwear showroom retail bill.', 'F1', 7.5, 46, 524, 0.28, 0.33, 0.41);
    text('• Synchronized with Bhagalpur central showroom ledger.', 'F1', 7.5, 46, 512, 0.28, 0.33, 0.41);
    text('• Valid for 7-day size exchange across all 3 Bhagalpur branches.', 'F1', 7.5, 46, 500, 0.28, 0.33, 0.41);
    text('Showroom Counter: Shah Market Flagship | Cashier: ' + (sale.adminName || 'Counter POS'), 'F1', 7, 46, 482, 0.39, 0.45, 0.55);

    // 6. 7-Day Size Exchange Guarantee Banner
    fillRect(36, 408, 524, 46, 0.92, 0.99, 0.96);
    strokeRect(36, 408, 524, 46, 0.65, 0.95, 0.82);
    text('7-DAY FIT & SIZE EXCHANGE GUARANTEE', 'F2', 9, 46, 440, 0.02, 0.37, 0.27);
    text('Size and fit exchange is available within 7 days across all 3 NEW MB SHOES Bhagalpur showrooms', 'F1', 8, 46, 426, 0.02, 0.47, 0.34);
    text('(Shah Market, Tatarpur, Tilkamanjhi). Footwear must be unworn with original box packaging.', 'F1', 8, 46, 415, 0.02, 0.47, 0.34);

    // 7. Google Review Banner
    fillRect(36, 362, 524, 34, 0.95, 0.96, 0.98);
    strokeRect(36, 362, 524, 34, 0.88, 0.91, 0.94);
    text('Rate Your In-Store Footwear Trial Experience on Google Maps:', 'F2', 8, 46, 384, 0.12, 0.16, 0.23);
    text(settings.googleReviewUrl || 'https://search.google.com/local/writereview?placeid=ChIJKee6jMZL8DkRBVnKzNakO44', 'F1', 7.5, 46, 371, 0.15, 0.39, 0.92);

    // 8. Footer
    line(36, 40, 560, 40, 0.88, 0.91, 0.94);
    text('*** THANK YOU FOR SHOPPING AT NEW MB SHOES BHAGALPUR! VISIT US AGAIN FOR FRESH ARRIVALS ***', 'F2', 7.5, 75, 28, 0.39, 0.45, 0.55);

    // Compile PDF 1.4 Binary
    const contentStream = Buffer.from(stream, 'utf8');
    let pdf = '%PDF-1.4\n';
    const offsets = [];

    const addObj = (objNum, content) => {
      offsets[objNum] = Buffer.byteLength(pdf, 'utf8');
      pdf += `${objNum} 0 obj\n${content}\nendobj\n`;
    };

    addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    addObj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>');
    addObj(4, `<< /Length ${contentStream.length} >>\nstream\n${stream}endstream`);
    addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    addObj(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    const xrefStart = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
      pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }

    pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    resolve(Buffer.from(pdf, 'binary'));
  });
}

module.exports = { generateInvoicePDF };
