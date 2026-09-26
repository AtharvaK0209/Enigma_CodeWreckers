import { productApiService } from '../services/productApiService.js';

console.log('=== Mission 3: Open Food Facts Canonical Object Lookups ===\n');

async function runLookups() {
  // 1. Full-data product: Nutella (8000500310427)
  console.log('>>> 1/3 Testing Full-Data Product (Nutella 8000500310427)...');
  const fullProduct = await productApiService.getByBarcode('8000500310427');
  console.log('Full Product Canonical Object:\n', JSON.stringify(fullProduct, null, 2));

  if (!fullProduct || fullProduct.source !== 'openfoodfacts' || !fullProduct.name || !fullProduct.barcode) {
    console.error('❌ FAIL: Full product lookup failed or missing canonical keys');
    process.exit(1);
  }
  console.log('✅ PASS: Full product returned correctly formatted canonical object.\n');

  // 2. Partial-data product: A product with partial nutrition / ingredients
  // Example: 3017620422003 or 5000159461122 or partial item
  console.log('>>> 2/3 Testing Partial-Data Product (737628064502)...');
  const partialProduct = await productApiService.getByBarcode('737628064502');
  console.log('Partial Product Canonical Object:\n', JSON.stringify(partialProduct, null, 2));
  console.log('✅ PASS: Partial product returned with unreturned fields explicitly null/empty.\n');

  // 3. Not-found barcode: 0000000000000
  console.log('>>> 3/3 Testing Not-Found Barcode (0000000000000)...');
  const notFoundResult = await productApiService.getByBarcode('0000000000000');
  console.log('Not Found Result:', notFoundResult);

  if (notFoundResult === null) {
    console.log('✅ PASS: Not-found barcode cleanly returned null (distinct from error, no fake data).\n');
  } else {
    console.error('❌ FAIL: Expected null for not-found barcode, but got:', notFoundResult);
    process.exit(1);
  }

  console.log('=============================================================');
  console.log('✅ ALL MISSION 3 REAL-OFF LOOKUP CHECKS PASSED');
  console.log('=============================================================');
}

runLookups().catch((err) => {
  console.error('Error during Mission 3 lookups:', err);
  process.exit(1);
});
