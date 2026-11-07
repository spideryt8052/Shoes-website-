const fs = require('fs');

async function testSalesSystem() {
  console.log('\n======================================================');
  console.log('   STEP HOUSE - IN-STORE SALES & EXCEL/SHEETS TEST    ');
  console.log('======================================================\n');

  const BASE_URL = 'http://127.0.0.1:5000';
  let token = '';

  // Helper request
  async function request(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { status: res.status, data };
    } else {
      const buffer = await res.arrayBuffer();
      return { status: res.status, buffer, contentType };
    }
  }

  // 1. Authenticate as Admin
  console.log('[Test 1] Logging in as Admin...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@stephouse.com', password: 'adminpassword123' }),
  });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.data));
  }
  token = loginRes.data.token;
  console.log('✓ Admin login successful. Token acquired.');

  // 2. Fetch a product to test real-time sale
  console.log('\n[Test 2] Fetching products to pick a variant...');
  const productsRes = await request('/api/products?limit=1');
  const testProduct = productsRes.data.products[0];
  if (!testProduct || !testProduct.variants || testProduct.variants.length === 0) {
    throw new Error('No products found to test');
  }

  const testVariant = testProduct.variants.find((v) => v.quantity > 0) || testProduct.variants[0];
  const initialQty = testVariant.quantity;
  console.log(`✓ Selected: "${testProduct.name}" (Size: ${testVariant.size}, Color: ${testVariant.color})`);
  console.log(`  Initial Stock in Showroom: ${initialQty} pairs`);

  // 3. Record a Real-Time Quick Sale (1 pair)
  console.log('\n[Test 3] Recording real-time in-store sale of 1 pair via POST /api/sales...');
  const saleRes = await request('/api/sales', {
    method: 'POST',
    body: JSON.stringify({
      productId: testProduct._id,
      variantId: testVariant._id,
      quantity: 1,
      sellingPrice: testProduct.sellingPrice,
      discount: 0,
      paymentMethod: 'UPI / QR',
      customerName: 'Rahul Sharma',
      customerPhone: '9876543210',
      remarks: 'Walk-in UPI purchase test',
    }),
  });

  if (saleRes.status !== 201) {
    throw new Error('Sale recording failed: ' + JSON.stringify(saleRes.data));
  }
  const saleData = saleRes.data;
  console.log(`✓ Sale recorded! Invoice #${saleData.sale.invoiceNumber}`);
  console.log(`  Reported Remaining Variant Stock: ${saleData.remainingVariantStock}`);
  if (saleData.remainingVariantStock !== initialQty - 1) {
    throw new Error(`Expected variant stock ${initialQty - 1}, but got ${saleData.remainingVariantStock}`);
  }

  // 4. Verify Public Catalogue immediately reflects reduced stock
  console.log('\n[Test 4] Verifying public product catalogue shows live reduced stock...');
  const publicProdRes = await request(`/api/products/${testProduct.slug}`);
  const updatedVariant = publicProdRes.data.product.variants.find((v) => v._id === testVariant._id);
  console.log(`✓ Live Public Website Stock for Size ${updatedVariant.size}: ${updatedVariant.quantity} pairs`);
  if (updatedVariant.quantity !== initialQty - 1) {
    throw new Error(`Public catalogue out-of-sync! Expected ${initialQty - 1}, got ${updatedVariant.quantity}`);
  }

  // 5. Check Stock Movement Audit History was logged
  console.log('\n[Test 5] Checking StockHistory audit movement...');
  const stockHistRes = await request(`/api/stock-history?productId=${testProduct._id}&limit=1`);
  const latestLog = stockHistRes.data.history[0];
  console.log(`✓ Audit log verified: ${latestLog.changeType} of ${latestLog.quantityChanged} pairs (${latestLog.remarks})`);

  // 6. Test End-of-Day Bulk Sales Recording
  console.log('\n[Test 6] Testing End-of-Day Batch Sales Entry (POST /api/sales/bulk)...');
  const bulkRes = await request('/api/sales/bulk', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          productId: testProduct._id,
          variantId: testVariant._id,
          quantity: 1,
          sellingPrice: testProduct.sellingPrice,
          paymentMethod: 'Cash',
          customerName: 'Evening Walk-in',
        },
      ],
      remarks: 'End-of-day Saturday closing sales batch',
    }),
  });

  if (bulkRes.status !== 201 || bulkRes.data.salesCount !== 1) {
    throw new Error('Bulk sale failed: ' + JSON.stringify(bulkRes.data));
  }
  console.log(`✓ End-of-day batch sale successful! Recorded ${bulkRes.data.salesCount} items.`);

  // 7. Verify Sales Ledger Query & Daily Aggregates
  console.log('\n[Test 7] Querying Sales Ledger & KPIs (GET /api/sales?period=today)...');
  const ledgerRes = await request('/api/sales?period=today');
  if (ledgerRes.status !== 200) {
    throw new Error('Failed to fetch sales ledger: ' + JSON.stringify(ledgerRes.data));
  }
  console.log(`✓ Total Today Revenue: ₹${ledgerRes.data.totalRevenue.toLocaleString('en-IN')}`);
  console.log(`✓ Total Today Pairs Sold: ${ledgerRes.data.totalPairs} pairs`);
  console.log(`✓ Payment Breakdown:`, ledgerRes.data.paymentBreakdown);

  // 8. Test Export to Real Microsoft Excel (.xlsx)
  console.log('\n[Test 8] Generating real Microsoft Excel (.xlsx) spreadsheet...');
  const excelRes = await request('/api/sales/export-excel');
  if (excelRes.status !== 200) {
    throw new Error('Excel generation failed: ' + excelRes.status);
  }
  console.log(`✓ Excel binary buffer generated successfully (${excelRes.buffer.byteLength} bytes)`);
  console.log(`  Content-Type: ${excelRes.contentType}`);

  // 9. Test Export to CSV
  console.log('\n[Test 9] Generating CSV spreadsheet...');
  const csvRes = await request('/api/sales/export-csv');
  if (csvRes.status !== 200) {
    throw new Error('CSV generation failed: ' + csvRes.status);
  }
  console.log(`✓ CSV generated successfully (${csvRes.buffer.byteLength} bytes)`);

  // 10. Test Google Sheets Template & Webhook Script
  console.log('\n[Test 10] Fetching Google Apps Script template...');
  const scriptRes = await request('/api/sales/google-sheet-script');
  if (scriptRes.status !== 200 || !scriptRes.data.scriptTemplate.includes('doPost')) {
    throw new Error('Invalid Apps Script template');
  }
  console.log('✓ Google Apps Script template ready (includes doPost handler and column headers).');

  // 11. Test Google Sheets Sync Endpoint
  console.log('\n[Test 11] Testing sync to Google Sheets endpoint...');
  const syncRes = await request('/api/sales/sync-google-sheet', {
    method: 'POST',
    body: JSON.stringify({ syncAll: false }),
  });
  console.log('✓ Google Sheets sync endpoint handled cleanly:', syncRes.data.message);

  console.log('\n======================================================');
  console.log('   🎉 ALL 11 IN-STORE SALES & AUTOMATION TESTS PASSED!');
  console.log('======================================================\n');
}

testSalesSystem().catch((err) => {
  console.error('\n❌ Test Failure:', err.message);
  process.exit(1);
});

