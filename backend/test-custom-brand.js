async function testCustomBrand() {
  console.log('\n======================================================');
  console.log('       TESTING CUSTOM BRAND CREATION & PRODUCT LINK   ');
  console.log('======================================================\n');

  const BASE_URL = 'http://127.0.0.1:5000';
  let token = '';

  async function request(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
    });
    return { status: res.status, data: await res.json() };
  }

  // 1. Admin Login
  console.log('[Step 1] Logging in as admin...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@stephouse.com', password: 'adminpassword123' }),
  });
  token = loginRes.data.token;
  console.log('✓ Admin login successful.');

  // 2. Fetch categories to attach
  const catsRes = await request('/api/categories');
  const cat = catsRes.data.categories[0];
  console.log(`✓ Using Category: ${cat.name} (${cat._id})`);

  // 3. Create a product passing customBrandName: "Crocs Special Edition"
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const customBrandName = `Crocs Custom ${randomSuffix}`;
  const customSku = `CRK-${randomSuffix}`;

  console.log(`\n[Step 2] Creating new product with custom brand: "${customBrandName}"...`);
  const createRes = await request('/api/products', {
    method: 'POST',
    body: JSON.stringify({
      name: `Classic Clog ${randomSuffix}`,
      customBrandName,
      gender: 'Unisex',
      category: cat._id,
      description: 'Comfortable lightweight footwear with arch support',
      sku: customSku,
      sellingPrice: 1999,
      variants: [
        { size: 'UK 7', color: 'Navy Blue', quantity: 5 },
        { size: 'UK 8', color: 'Navy Blue', quantity: 3 },
      ],
    }),
  });

  if (createRes.status !== 201) {
    throw new Error('Product creation with custom brand failed: ' + JSON.stringify(createRes.data));
  }
  const createdProduct = createRes.data.product;
  console.log(`✓ Product created successfully!`);
  console.log(`  Product Name: ${createdProduct.name}`);
  console.log(`  Brand Attached: ${createdProduct.brandName} (ID: ${createdProduct.brand})`);

  // 4. Verify Brand collection has this new brand
  console.log('\n[Step 3] Verifying brand exists in Brand collection...');
  const brandsRes = await request('/api/brands');
  const foundBrand = brandsRes.data.brands.find((b) => b.name.toLowerCase() === customBrandName.toLowerCase());
  if (!foundBrand) {
    throw new Error(`Custom brand "${customBrandName}" was not found in Brand collection!`);
  }
  console.log(`✓ Custom brand found in database! Name: "${foundBrand.name}", Slug: "${foundBrand.slug}"`);

  // 5. Query Products filtering by this custom brand
  console.log('\n[Step 4] Querying public products filtered by custom brand...');
  const filterRes = await request(`/api/products?brand=${encodeURIComponent(customBrandName)}`);
  if (filterRes.data.total === 0) {
    throw new Error('Filter by custom brand returned 0 results');
  }
  console.log(`✓ Filtered products found: ${filterRes.data.total} item(s) under "${customBrandName}"!`);

  console.log('\n======================================================');
  console.log('   🎉 CUSTOM BRAND FEATURE VERIFIED & FULLY WORKING!  ');
  console.log('======================================================\n');
}

testCustomBrand().catch((err) => {
  console.error('\n❌ Test Failure:', err.message);
  process.exit(1);
});
