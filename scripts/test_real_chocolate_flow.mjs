console.log('================================================================');
console.log('     TEST REAL CHOCOLATE BARCODE & OFF DATA FLOW VERIFICATION   ');
console.log('================================================================\n');

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  let passed = 0;
  let total = 5;

  // 1. Test real chocolate barcode: Lindt Excellence 85% Cacao (3046920022606)
  console.log('>>> [1/5] Testing REAL Chocolate Barcode (3046920022606)...');
  const chocolateRes = await fetch(`${BASE_URL}/api/analyze/barcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      barcode: '3046920022606',
      userProfile: { name: 'Chocolate Lover', allergies: [], conditions: [] },
    }),
  });

  const chocolateData = await chocolateRes.json();
  console.log('HTTP Status:', chocolateRes.status);
  console.log('Product Name:', chocolateData.product?.name);
  console.log('Brand:', chocolateData.product?.brand);
  console.log('Barcode:', chocolateData.product?.barcode);
  console.log('Canonical Name:', chocolateData.canonicalProduct?.name);
  console.log('Canonical Brand:', chocolateData.canonicalProduct?.brand);
  console.log('Canonical Image:', chocolateData.canonicalProduct?.imageUrl);
  console.log('Canonical Images Object:', chocolateData.canonicalProduct?.images);
  console.log('Canonical Nutrition:', chocolateData.canonicalProduct?.nutrition);

  // Must NOT be Nitro Surge or Volt Energy
  if (
    chocolateRes.ok &&
    chocolateData.product?.name?.toLowerCase().includes('excellence') &&
    chocolateData.canonicalProduct?.barcode === '3046920022606' &&
    !JSON.stringify(chocolateData).includes('Nitro Surge') &&
    !JSON.stringify(chocolateData).includes('Volt Energy')
  ) {
    console.log('✅ PASS [1/5]: Real chocolate product correctly resolved and mapped from Open Food Facts!\n');
    passed++;
  } else {
    throw new Error(`FAIL [1/5]: Product was not the expected chocolate! Data: ${JSON.stringify(chocolateData)}`);
  }

  // 2. Test unknown barcode: 0000000000000
  console.log('>>> [2/5] Testing Unknown Barcode (0000000000000)...');
  const notFoundRes = await fetch(`${BASE_URL}/api/analyze/barcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode: '0000000000000' }),
  });
  const notFoundData = await notFoundRes.json();
  console.log('HTTP Status:', notFoundRes.status);
  console.log('Response Error:', notFoundData.error);

  if (
    notFoundRes.status === 404 &&
    notFoundData.error === 'Product not found in Open Food Facts.' &&
    notFoundData.code === 'BARCODE_NOT_FOUND' &&
    !notFoundData.product &&
    !JSON.stringify(notFoundData).includes('Nitro Surge')
  ) {
    console.log('✅ PASS [2/5]: Unknown barcode cleanly returned 404 with exact copy, zero fake products!\n');
    passed++;
  } else {
    throw new Error(`FAIL [2/5]: Expected 404 not found, got: ${JSON.stringify(notFoundData)}`);
  }

  // 3. Test missing barcode: empty string
  console.log('>>> [3/5] Testing Missing Barcode ("")...');
  const missingRes = await fetch(`${BASE_URL}/api/analyze/barcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode: '   ' }),
  });
  const missingData = await missingRes.json();
  console.log('HTTP Status:', missingRes.status);
  console.log('Response Error:', missingData.error);
  console.log('Response Message:', missingData.message);

  if (
    missingRes.status === 400 &&
    missingData.error === 'BARCODE_NOT_RECEIVED' &&
    missingData.message === "Couldn't read the barcode. Please scan again."
  ) {
    console.log('✅ PASS [3/5]: Missing barcode returned 400 BARCODE_NOT_RECEIVED with exact message!\n');
    passed++;
  } else {
    throw new Error(`FAIL [3/5]: Expected 400 BARCODE_NOT_RECEIVED, got: ${JSON.stringify(missingData)}`);
  }

  // 4. Test product search: "chocolate"
  console.log('>>> [4/5] Testing Product Name Search ("chocolate")...');
  const searchRes = await fetch(`${BASE_URL}/api/search?q=chocolate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'chocolate' }),
  });
  const searchMatches = await searchRes.json();
  console.log(`Search returned ${searchMatches.length} items.`);
  if (searchMatches.length > 0) {
    console.log('First Match Name:', searchMatches[0].product?.name);
    console.log('First Match Source:', searchMatches[0].canonicalProduct?.source);
    console.log('First Match Images:', searchMatches[0].canonicalProduct?.images);
  }

  if (
    searchRes.ok &&
    Array.isArray(searchMatches) &&
    searchMatches.length > 0 &&
    searchMatches.every((m) => m.canonicalProduct?.source === 'openfoodfacts') &&
    !JSON.stringify(searchMatches).includes('Volt Energy')
  ) {
    console.log('✅ PASS [4/5]: Search results correctly pass through mapOFFProduct with same canonical schema!\n');
    passed++;
  } else {
    throw new Error(`FAIL [4/5]: Search results invalid: ${JSON.stringify(searchMatches.slice(0, 2))}`);
  }

  // 5. Test Image Upload Endpoint: declare unavailable honestly (Requirement 10)
  console.log('>>> [5/5] Testing Image Upload Endpoint (declares unavailable honestly)...');
  const imageRes = await fetch(`${BASE_URL}/api/analyze/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: 'data:image/jpeg;base64,FAKEIMAGE' }),
  });
  const imageData = await imageRes.json();
  console.log('HTTP Status:', imageRes.status);
  console.log('Response Error:', imageData.error);

  if (
    imageRes.status === 422 &&
    imageData.error === 'Product identification from image is unavailable.' &&
    !JSON.stringify(imageData).includes('Nitro Surge')
  ) {
    console.log('✅ PASS [5/5]: Image endpoint honestly reports unavailable without faking products!\n');
    passed++;
  } else {
    throw new Error(`FAIL [5/5]: Image endpoint did not return expected honest error: ${JSON.stringify(imageData)}`);
  }

  console.log('================================================================');
  console.log(`🎉 ALL 5 REAL CHOCOLATE & OFF INTEGRATION CHECKS PASSED (${passed}/${total})`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
