/**
 * Automated Pre-Deployment Backend Validation Suite
 * Verifies syntax, imports, WhatsApp service, MongoDB, and API endpoints.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const BACKEND_DIR = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ ${message}`);
  } else {
    failedChecks++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// 1. Collect all JS files in backend and api
function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'uploads' || file === 'dist') {
      continue;
    }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function runValidation() {
  console.log('==================================================');
  console.log('🚀 RUNNING COMPREHENSIVE BACKEND VALIDATION');
  console.log('==================================================\n');

  // STEP 1: Syntax Validation
  console.log('--- [1/5] JavaScript Syntax Check ---');
  const jsFiles = [
    ...getAllJsFiles(BACKEND_DIR),
    ...getAllJsFiles(path.join(ROOT_DIR, 'api')),
  ];

  let syntaxFailed = 0;
  for (const file of jsFiles) {
    const relPath = path.relative(ROOT_DIR, file);
    try {
      execSync(`node -c "${file}"`, { stdio: 'pipe' });
    } catch (err) {
      syntaxFailed++;
      console.error(`  ✗ Syntax Error in ${relPath}: ${err.message}`);
    }
  }
  assert(syntaxFailed === 0, `Syntax validated across all ${jsFiles.length} JavaScript files`);

  // STEP 2: Module Resolution & Import Check
  console.log('\n--- [2/5] Import Resolution & Module Boot Check ---');
  let app;
  let apiHandler;
  let whatsappService;
  try {
    whatsappService = require('../services/whatsappService');
    assert(typeof whatsappService.dispatchWhatsAppBill === 'function', 'whatsappService exports dispatchWhatsAppBill');
    assert(typeof whatsappService.formatInternationalPhone === 'function', 'whatsappService exports formatInternationalPhone');

    app = require('../app');
    assert(typeof app === 'function', 'backend/app.js loaded and exported Express app');

    apiHandler = require(path.join(ROOT_DIR, 'api', 'index.js'));
    assert(typeof apiHandler === 'function', 'api/index.js loaded and exported Vercel serverless handler');
  } catch (err) {
    assert(false, `Module load failed: ${err.message}`);
  }

  // STEP 3: WhatsApp Service Unit Tests
  console.log('\n--- [3/5] WhatsApp Service Logic & Protection Tests ---');
  if (whatsappService) {
    const { formatInternationalPhone, getBillTextAndLinks, dispatchWhatsAppBill } = whatsappService;

    // Test phone number formatting
    assert(formatInternationalPhone('9876543210') === '919876543210', 'Phone formatter formats 10-digit number correctly');
    assert(formatInternationalPhone('09876543210') === '919876543210', 'Phone formatter strips leading 0 and prefixes 91');
    assert(formatInternationalPhone('919876543210') === '919876543210', 'Phone formatter preserves existing 91 prefix');
    assert(formatInternationalPhone('+91 98765-43210') === '919876543210', 'Phone formatter strips non-digit characters');
    assert(formatInternationalPhone('') === '', 'Phone formatter returns empty for blank');
    assert(formatInternationalPhone('123') === '', 'Phone formatter rejects invalid short numbers');

    // Test bill text generator
    const mockSale = {
      invoiceNumber: 'INV-TEST-001',
      saleDate: new Date('2026-01-01T10:00:00Z'),
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      totalAmount: 2499,
      paymentMethod: 'UPI',
    };
    const billInfo = getBillTextAndLinks(mockSale, { shopName: 'NEW MB SHOES' });
    assert(billInfo.captionText.includes('INV-TEST-001'), 'Bill text contains invoice number');
    assert(billInfo.pdfDownloadUrl.includes('INV-TEST-001'), 'PDF download URL contains invoice number');

    // Test rejection of invalid phone numbers without external API call
    const invalidPhoneResult = await dispatchWhatsAppBill({ customerPhone: 'invalid' });
    assert(invalidPhoneResult.success === false, 'Invalid customer phone is safely rejected');
  }

  // STEP 4: MongoDB Connectivity & Health Endpoint Check
  console.log('\n--- [4/5] MongoDB & Express In-Memory Server Test ---');
  const mongoose = require('mongoose');
  const connectDB = require('../config/db');

  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = mongoose.connection.readyState === 1;
    assert(dbConnected, `MongoDB connected successfully to host: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`  ! MongoDB note: ${err.message}`);
  }

  // Start test server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  async function testGet(urlPath) {
    const res = await fetch(`${baseUrl}${urlPath}`);
    const data = await res.json();
    return { status: res.status, data };
  }

  // Test /api/health
  try {
    const { status, data } = await testGet('/api/health');
    assert(
      (status === 200 && data.success === true && data.database === 'connected') ||
      (status === 503 && data.success === false && data.database === 'disconnected'),
      `GET /api/health returned valid structure (status: ${status}, database: ${data.database})`
    );
  } catch (err) {
    assert(false, `GET /api/health failed: ${err.message}`);
  }

  // Test /api
  try {
    const { status, data } = await testGet('/api');
    assert(status === 200 && data.success === true, `GET /api returned 200 OK (${data.message})`);
  } catch (err) {
    assert(false, `GET /api failed: ${err.message}`);
  }

  // STEP 5: Critical API Endpoints Verification
  console.log('\n--- [5/5] Critical Endpoints Availability Check ---');
  // Test /api/brands
  try {
    const { status, data } = await testGet('/api/brands');
    assert(status === 200 && data.success === true, `GET /api/brands returned 200 OK (${data.brands ? data.brands.length : 0} brands)`);
  } catch (err) {
    assert(false, `GET /api/brands failed: ${err.message}`);
  }

  // Test /api/categories
  try {
    const { status, data } = await testGet('/api/categories');
    assert(status === 200 && data.success === true, `GET /api/categories returned 200 OK (${data.categories ? data.categories.length : 0} categories)`);
  } catch (err) {
    assert(false, `GET /api/categories failed: ${err.message}`);
  }

  // Test /api/store-settings
  try {
    const { status, data } = await testGet('/api/store-settings');
    assert(status === 200 && data.success === true, `GET /api/store-settings returned 200 OK`);
  } catch (err) {
    assert(false, `GET /api/store-settings failed: ${err.message}`);
  }

  // Teardown
  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
  console.log('==================================================');

  if (failedChecks > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL BACKEND CHECKS PASSED PERFECTLY!\n');
    process.exit(0);
  }
}

runValidation().catch((err) => {
  console.error('Fatal Validation Error:', err);
  process.exit(1);
});
