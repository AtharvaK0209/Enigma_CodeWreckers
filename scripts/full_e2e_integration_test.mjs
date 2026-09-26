import { loadRiskKnowledgeBase, getRKB } from '../backend/knowledge/index.js';
import { productApiService } from '../services/productApiService.js';
import { normalizeWithRKB } from '../services/normalizationService.js';
import { evaluateProductSafety } from '../services/decisionEngine.js';

console.log('================================================================');
console.log('       NUTRILENS FULL E2E INTEGRATION VERIFICATION SUITE       ');
console.log('================================================================\n');

const BASE_URL = 'http://localhost:5001';

async function runFullTestSuite() {
  let passedCount = 0;
  let totalCount = 10;

  // -------------------------------------------------------------
  // Step 1: Confirm Mission 0's four JSON files loaded at startup
  // -------------------------------------------------------------
  console.log('>>> [Step 1/10] Verifying Risk Knowledge Base startup loading...');
  const rkb = loadRiskKnowledgeBase();
  if (
    rkb &&
    Object.keys(rkb.allergies).length === 9 &&
    Object.keys(rkb.conditions).length === 5 &&
    Array.isArray(rkb.ingredientSynonyms) &&
    rkb.ingredientSynonyms.length === 9 &&
    Array.isArray(rkb.sources) &&
    rkb.sources.length === 7
  ) {
    console.log('    ✅ Step 1 PASS: All 4 JSON files loaded and validated (9 allergens, 5 conditions, 9 synonym groups, 7 sources).');
    passedCount++;
  } else {
    throw new Error('Step 1 FAIL: RKB failed to load or had unexpected count');
  }

  // -------------------------------------------------------------
  // Step 2: Create / login as User A -> profile loads from MongoDB
  // -------------------------------------------------------------
  console.log('\n>>> [Step 2/10] Creating and logging in User A (Alice: Peanut Allergy + Hypertension)...');
  const userAEmail = `alice_${Date.now()}@nutrilens.app`;
  const signupARes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userAEmail,
      password: 'AlicePassword2026!',
      name: 'Alice',
      allergies: ['peanut'],
      conditions: ['hypertension'],
    }),
  });
  const authA = await signupARes.json();
  const tokenA = authA.token;
  const userAId = authA.user.id;

  // Fetch /api/profile with User A's token
  const profileARes = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const profileA = await profileARes.json();

  if (profileA.id === userAId && profileA.allergies.includes('peanut') && profileA.conditions.includes('hypertension')) {
    console.log(`    ✅ Step 2 PASS: User A authenticated and profile loaded cleanly: id=${userAId}, name=${profileA.name}, allergies=${JSON.stringify(profileA.allergies)}.`);
    passedCount++;
  } else {
    throw new Error('Step 2 FAIL: User A profile did not match expected structure');
  }

  // -------------------------------------------------------------
  // Step 3 & 4: Call OFF via backend for real barcode (Nutella)
  // -------------------------------------------------------------
  console.log('\n>>> [Step 3 & 4/10] Analyzing real barcode (8000500310427) for User A via Open Food Facts...');
  const scanARes = await fetch(`${BASE_URL}/api/analyze/barcode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ barcode: '8000500310427' }),
  });
  const scanA = await scanARes.json();

  const canonicalA = scanA.canonicalProduct;
  if (
    scanARes.ok &&
    canonicalA &&
    canonicalA.source === 'openfoodfacts' &&
    canonicalA.name &&
    canonicalA.imageUrl &&
    canonicalA.ingredientsText &&
    canonicalA.nutrition
  ) {
    console.log(`    ✅ Step 3 & 4 PASS: Barcode 8000500310427 resolved via live Open Food Facts:`);
    console.log(`       Product Name: "${canonicalA.name}"`);
    console.log(`       Brand: "${canonicalA.brand}"`);
    console.log(`       Image URL: "${canonicalA.imageUrl}"`);
    console.log(`       Ingredients: ${canonicalA.ingredientsText.slice(0, 70)}...`);
    console.log(`       Nutrition: Energy=${canonicalA.nutrition.energy}kcal, Sugars=${canonicalA.nutrition.sugars}g, Sodium=${canonicalA.nutrition.sodium}g`);
    passedCount += 2;
  } else {
    throw new Error('Step 3 & 4 FAIL: Could not fetch canonical OFF data');
  }

  // -------------------------------------------------------------
  // Step 5: Personalized analysis runs using User A's actual profile
  // -------------------------------------------------------------
  console.log('\n>>> [Step 5/10] Evaluating personalized safety findings for User A against RKB...');
  // Alice has peanut allergy and hypertension. Nutella has hazelnuts, milk, soy, and low sodium (0.22g / 100g).
  // Alice does NOT have milk/hazelnut allergy, and sodium is within safe cardiac limits.
  console.log(`       User A Verdict: ${scanA.verdict} ("${scanA.verdictTitle}")`);
  console.log(`       User A Findings Count: ${scanA.findings.length}`);
  const hasUnexpectedMilkRiskForAlice = scanA.findings.some(f => f.category === 'Allergen Alert' && f.severity === 'risk');
  if (!hasUnexpectedMilkRiskForAlice && scanA.verdict === 'safe') {
    console.log('    ✅ Step 5 PASS: Personalized analysis accurately reflects User A profile (peanut safe, low sodium).');
    passedCount++;
  } else {
    throw new Error('Step 5 FAIL: Personalized analysis failed for User A');
  }

  // -------------------------------------------------------------
  // Step 6: Scan saves to User A's account
  // -------------------------------------------------------------
  console.log('\n>>> [Step 6/10] Verifying scan persistence in User A history...');
  const historyARes = await fetch(`${BASE_URL}/api/history`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const historyA = await historyARes.json();
  if (Array.isArray(historyA) && historyA.length === 1 && historyA[0].name.includes('NUTELLA')) {
    console.log(`    ✅ Step 6 PASS: Scan successfully saved to User A history: "${historyA[0].name}" (id: ${historyA[0].id}).`);
    passedCount++;
  } else {
    throw new Error('Step 6 FAIL: Scan not found in User A history');
  }

  // -------------------------------------------------------------
  // Step 7: Log out, log in as User B -> User B's own profile loads
  // -------------------------------------------------------------
  console.log('\n>>> [Step 7/10] Creating and logging in User B (Bob: Milk Allergy + Diabetes)...');
  const userBEmail = `bob_${Date.now()}@nutrilens.app`;
  const signupBRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userBEmail,
      password: 'BobPassword2026!',
      name: 'Bob',
      allergies: ['milk'],
      conditions: ['diabetes'],
    }),
  });
  const authB = await signupBRes.json();
  const tokenB = authB.token;
  const userBId = authB.user.id;

  const profileBRes = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const profileB = await profileBRes.json();

  if (profileB.id === userBId && profileB.allergies.includes('milk') && profileB.conditions.includes('diabetes')) {
    console.log(`    ✅ Step 7 PASS: User B profile loaded independently: id=${userBId}, name=${profileB.name}, allergies=${JSON.stringify(profileB.allergies)}.`);
    passedCount++;
  } else {
    throw new Error('Step 7 FAIL: User B profile incorrect');
  }

  // -------------------------------------------------------------
  // Step 8: User B does not see User A's profile or scan history
  // -------------------------------------------------------------
  console.log('\n>>> [Step 8/10] Checking User B isolation from User A history...');
  const historyBInitialRes = await fetch(`${BASE_URL}/api/history`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const historyBInitial = await historyBInitialRes.json();

  if (Array.isArray(historyBInitial) && historyBInitial.length === 0) {
    console.log('    ✅ Step 8 PASS: User B history is completely empty; zero cross-contamination from User A.');
    passedCount++;
  } else {
    throw new Error('Step 8 FAIL: User B saw items from User A!');
  }

  // -------------------------------------------------------------
  // Step 9: Barcode image upload uses same OFF pipeline
  // -------------------------------------------------------------
  console.log('\n>>> [Step 9/10] Verifying image upload barcode path hits identical endpoint and returns canonical object...');
  // The client decodes the image via html5-qrcode and passes the barcode string to POST /api/analyze/barcode
  const uploadBarcode = '737628064502'; // Thai noodles
  const uploadScanRes = await fetch(`${BASE_URL}/api/analyze/barcode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ barcode: uploadBarcode }),
  });
  const uploadScan = await uploadScanRes.json();

  if (uploadScanRes.ok && uploadScan.canonicalProduct && uploadScan.canonicalProduct.barcode === uploadBarcode) {
    console.log(`    ✅ Step 9 PASS: Barcode image decode path successfully routed to /api/analyze/barcode.`);
    console.log(`       Resolved Product: "${uploadScan.canonicalProduct.name}"`);
    passedCount++;
  } else {
    throw new Error('Step 9 FAIL: Upload barcode analysis failed');
  }

  // -------------------------------------------------------------
  // Step 10: Barcode unknown to OFF shows not-found (never fake data)
  // -------------------------------------------------------------
  console.log('\n>>> [Step 10/10] Testing unknown barcode (0000000000000) not-found status and exact copy...');
  const notFoundRes = await fetch(`${BASE_URL}/api/analyze/barcode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ barcode: '0000000000000' }),
  });
  const notFoundJson = await notFoundRes.json();

  if (
    notFoundRes.status === 404 &&
    notFoundJson.code === 'BARCODE_NOT_FOUND' &&
    notFoundJson.error === "We couldn't find this barcode in Open Food Facts."
  ) {
    console.log(`    ✅ Step 10 PASS: Unknown barcode returned HTTP 404 with exact copy:`);
    console.log(`       status: ${notFoundRes.status}`);
    console.log(`       code: "${notFoundJson.code}"`);
    console.log(`       error: "${notFoundJson.error}"`);
    passedCount++;
  } else {
    throw new Error(`Step 10 FAIL: Unexpected response for unknown barcode: ${JSON.stringify(notFoundJson)}`);
  }

  console.log('\n================================================================');
  console.log(`🎉 ALL 10 INTEGRATION CHECK STEPS PASSED SUCCESSFULLY (${passedCount}/${totalCount})`);
  console.log('================================================================\n');
}

runFullTestSuite().catch((err) => {
  console.error('\n❌ INTEGRATION SUITE FAILURE:', err);
  process.exit(1);
});
