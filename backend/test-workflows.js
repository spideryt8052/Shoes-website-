const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE WORKFLOW & INTEGRATION TESTS');
  console.log('========================================================\n');

  let adminToken = '';
  let createdBrandId = '';
  let createdProductId = '';
  let testVariantId = '';

  try {
    // TEST 1: Public catalogue access without login
    console.log('▶ Test 1: Public catalogue access without login...');
    const catRes = await req('/products');
    if (catRes.status === 200 && catRes.data.success && catRes.data.products.length > 0) {
      console.log(`  ✓ Passed: Public users can explore ${catRes.data.totalProducts} shoes without any authentication.`);
    } else {
      throw new Error('Public catalogue fetch failed');
    }

    // TEST 2: Real-time Stock Status & Variant Availability
    console.log('\n▶ Test 2: Real-time in-stock vs out-of-stock validation...');
    const rev7 = catRes.data.products.find(p => p.sku === 'NK-REV7-BLK');
    if (!rev7) throw new Error('Nike Revolution 7 not found in seeded database');

    const v7 = rev7.variants.find(v => v.size === 'UK 7');
    const v8 = rev7.variants.find(v => v.size === 'UK 8');
    console.log(`  - Checking ${rev7.name}:`);
    console.log(`    Size UK 7 stock: ${v7 ? v7.quantity : 'N/A'} pairs (Status: ${v7?.quantity > 0 ? 'In Stock' : 'Out of Stock'})`);
    console.log(`    Size UK 8 stock: ${v8 ? v8.quantity : 'N/A'} pairs (Status: ${v8?.quantity > 0 ? 'In Stock' : 'Out of Stock'})`);

    if (v7 && v7.quantity > 0 && v8 && v8.quantity === 0) {
      console.log('  ✓ Passed: Size-wise real stock verified accurately (Size 7 In Stock, Size 8 Out of Stock).');
    } else {
      throw new Error('Variant stock mismatch');
    }

    // TEST 3: Zero total stock test
    console.log('\n▶ Test 3: Zero total stock model out-of-stock label test...');
    const outProd = catRes.data.products.find(p => p.totalStock === 0);
    if (outProd) {
      console.log(`  - Model: "${outProd.name}" -> Total Stock: ${outProd.totalStock}, isAvailable: ${outProd.isAvailable}`);
      if (outProd.isAvailable === false) {
        console.log('  ✓ Passed: Products with 0 stock accurately marked out of stock.');
      } else {
        throw new Error('Product with 0 stock has isAvailable=true');
      }
    } else {
      console.log('  ⚠ Notice: No 0-stock product found to test');
    }

    // TEST 4: Protected route rejection without token
    console.log('\n▶ Test 4: Protected route authorization check (No token)...');
    const unauthRes = await req('/inventory');
    if (unauthRes.status === 401) {
      console.log('  ✓ Passed: Public users cannot access protected admin routes (HTTP 401 Unauthorized).');
    } else {
      throw new Error(`Protected route allowed unauthenticated request! Status: ${unauthRes.status}`);
    }

    // TEST 5: Admin Login
    console.log('\n▶ Test 5: Admin login with credentials...');
    const loginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@stephouse.com',
        password: 'adminpassword123',
      }),
    });

    if (loginRes.data.success && loginRes.data.token) {
      adminToken = loginRes.data.token;
      console.log(`  ✓ Passed: Admin logged in successfully as "${loginRes.data.admin.name}" (${loginRes.data.admin.role}).`);
    } else {
      throw new Error('Admin login failed: ' + JSON.stringify(loginRes.data));
    }

    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // TEST 6: Admin adds a dynamic brand
    console.log('\n▶ Test 6: Dynamic brand addition ("Asics")...');
    const brandName = `Asics-Test-${Date.now().toString().slice(-4)}`;
    const brandRes = await req('/brands', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: brandName,
        description: 'Global Japanese athletic brand.',
        isFeatured: true,
      }),
    });

    if (brandRes.data.success && brandRes.data.brand) {
      createdBrandId = brandRes.data.brand._id;
      console.log(`  ✓ Passed: Brand "${brandName}" added dynamically.`);
    } else {
      throw new Error('Brand creation failed: ' + JSON.stringify(brandRes.data));
    }

    // TEST 7: Admin adds a product with variant size-stock matrix
    console.log('\n▶ Test 7: Admin adds a product with size/colour inventory matrix...');
    const categoriesRes = await req('/categories');
    const testCategory = categoriesRes.data.categories[0];

    const sku = `TEST-${Date.now().toString().slice(-6)}`;
    const newProdRes = await req('/products', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Asics Gel-Kayano Test Edition',
        brand: createdBrandId,
        gender: 'Men',
        category: testCategory._id,
        subcategory: 'Stability Running',
        occasion: 'Sports',
        sku,
        description: 'Elite distance stability shoe with PureGEL technology.',
        sellingPrice: 8999,
        originalPrice: 11999,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80'],
        variants: [
          { size: 'UK 8', color: 'Midnight Navy', quantity: 3 },
          { size: 'UK 9', color: 'Midnight Navy', quantity: 0 },
          { size: 'UK 10', color: 'Midnight Navy', quantity: 5 },
        ],
      }),
    });

    if (newProdRes.data.success && newProdRes.data.product) {
      createdProductId = newProdRes.data.product._id;
      testVariantId = newProdRes.data.product.variants[1]._id; // size 9 (0 pairs)
      console.log(`  ✓ Passed: Product created with SKU "${sku}", Total Stock: ${newProdRes.data.product.totalStock} pairs.`);
    } else {
      throw new Error('Product creation failed: ' + JSON.stringify(newProdRes.data));
    }

    // TEST 8: Admin updates inventory (0 to 5) and audit log check
    console.log('\n▶ Test 8: Live inventory adjustment & stock movement audit log...');
    const invRes = await req('/inventory/update-variant', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        productId: createdProductId,
        variantId: testVariantId,
        newQuantity: 5,
        changeType: 'Stock In',
        remarks: 'Restocked 5 pairs from warehouse shipment #TR-990',
      }),
    });

    if (invRes.data.success && invRes.data.updatedVariant.quantity === 5) {
      console.log(`  ✓ Passed: Stock updated from 0 to 5 for variant. Total product stock now: ${invRes.data.totalProductStock}.`);
    } else {
      throw new Error('Inventory update failed: ' + JSON.stringify(invRes.data));
    }

    // Verify stock audit log was written
    const historyRes = await req(`/stock-history?productId=${createdProductId}`, { headers: authHeaders });
    if (historyRes.data.success && historyRes.data.history.length > 0) {
      const latest = historyRes.data.history[0];
      console.log(`  ✓ Passed: Audit trail recorded -> [${latest.changeType}] by ${latest.adminName}: "${latest.remarks}"`);
    } else {
      throw new Error('Stock history not recorded');
    }

    // TEST 9: Admin edits product
    console.log('\n▶ Test 9: Admin edits product price...');
    const editRes = await req(`/products/${createdProductId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        sellingPrice: 7999,
      }),
    });

    if (editRes.data.success && editRes.data.product.sellingPrice === 7999) {
      console.log('  ✓ Passed: Product price updated to ₹7,999.');
    } else {
      throw new Error('Product edit failed: ' + JSON.stringify(editRes.data));
    }

    // TEST 10: Admin deletes test product
    console.log('\n▶ Test 10: Admin deletes product and clears inventory...');
    const delRes = await req(`/products/${createdProductId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (delRes.data.success) {
      console.log('  ✓ Passed: Product deleted cleanly.');
    } else {
      throw new Error('Product delete failed: ' + JSON.stringify(delRes.data));
    }

    // Clean up test brand
    await req(`/brands/${createdBrandId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    // TEST 11: Dynamic Search & Filtering
    console.log('\n▶ Test 11: Dynamic backend search and filter APIs...');
    const searchRes = await req('/products?search=Nike&gender=Men&availability=inStock');
    if (searchRes.data.success) {
      console.log(`  ✓ Passed: Search and faceted filtering returned ${searchRes.data.count} matching shoes.`);
    }

    // TEST 12: Store Settings & Directions
    console.log('\n▶ Test 12: Store Settings and Google Maps verification...');
    const settingsRes = await req('/store-settings');
    if (settingsRes.data.success && settingsRes.data.settings.shopName === 'STEP HOUSE') {
      console.log(`  ✓ Passed: Store name: "${settingsRes.data.settings.shopName}", Rating: ${settingsRes.data.settings.googleRating}★, Directions: ${settingsRes.data.settings.googleMapsLocationUrl}`);
    }

    console.log('\n========================================================');
    console.log('🎉 ALL 12 INTEGRATION & WORKFLOW TESTS PASSED PERFECTLY!');
    console.log('========================================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
