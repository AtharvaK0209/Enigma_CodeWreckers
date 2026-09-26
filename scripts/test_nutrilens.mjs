import { analyzeBarcode, analyzeImage, searchFood } from '../src/services/api.js';
import { THEME } from '../src/styles/tokens.js';

async function runTests() {
  console.log('--- Starting NutriLens Design & UX Revision Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Mission 1: Theme Tokens Check
  assert(THEME.colors.safe?.surface === '#E4FA75', 'Safe verdict surface color is vivid chartreuse/lime (#E4FA75)');
  assert(THEME.colors.caution?.surface === '#FDE68A', 'Caution verdict surface color is warm golden amber (#FDE68A)');
  assert(THEME.colors.risk?.surface === '#FECDD3', 'Risk verdict surface color is coral crimson (#FECDD3)');
  assert(THEME.allergens.length === 9, 'Theme exports all 9 major allergen items (peanut, milk, egg, wheat, tree_nuts, soy, fish, crustacean_shellfish, sesame)');
  assert(THEME.conditions.length === 4, 'Theme exports all 4 conditions (hypertension, diabetes, ckd, pcos)');
  assert(THEME.conditions.find(c => c.id === 'ckd')?.isFullySupported === false, 'CKD condition has isFullySupported: false for honest coverage');
  assert(THEME.conditions.find(c => c.id === 'pcos')?.isFullySupported === false, 'PCOS condition has isFullySupported: false for honest coverage');

  // 2. Mission 4: Allergen Risk Detection & Plain-Language Copy
  const nutellaResult = await analyzeBarcode('8000500310427', {
    name: 'Yunus',
    allergies: ['tree_nuts'],
    conditions: ['hypertension'],
  });
  assert(nutellaResult.verdict === 'risk', 'Nutella spread flags "risk" for tree_nuts allergy');
  assert(nutellaResult.verdictTitle === 'This product may not be safe for you', 'Risk verdict copy matches Mission 4: "This product may not be safe for you"');
  assert(nutellaResult.dataQuality === 'good', 'Default barcode data quality is "good"');
  assert(nutellaResult.findings.length > 0, 'Produces structured findings list');

  // Verify RiskFinding contract shape
  for (const finding of nutellaResult.findings) {
    assert(typeof finding.category === 'string', 'Finding has string category');
    assert(['safe', 'caution', 'risk'].includes(finding.severity), 'Finding severity matches enum');
    assert(typeof finding.evidence === 'string', 'Finding has string evidence');
    assert(finding.trigger === undefined || finding.trigger === null || typeof finding.trigger === 'string', 'Finding trigger is string or null');
    assert(finding.source === undefined || finding.source === null || typeof finding.source === 'string', 'Finding source is string or null');
  }

  // 3. Mission 4: Caution Verdict Copy
  const energyResult = await analyzeBarcode('5449000000996', {
    name: 'Yunus',
    allergies: [],
    conditions: ['hypertension', 'diabetes'],
  });
  assert(energyResult.verdict === 'caution', 'Energy drink flags "caution" for hypertension and diabetes');
  assert(energyResult.verdictTitle === 'A few things to check', 'Caution verdict copy matches Mission 4: "A few things to check"');

  // 4. Mission 4: Safe Verdict Copy
  const oatsResult = await analyzeBarcode('030000010204', {
    name: 'Yunus',
    allergies: ['peanut'],
    conditions: [],
  });
  assert(oatsResult.verdict === 'safe', 'Pure Oats flags "safe" with no allergen conflicts');
  assert(oatsResult.verdictTitle === 'Looks safe for you', 'Safe verdict copy matches Mission 4: "Looks safe for you"');
  assert(oatsResult.findings.every(f => f.severity === 'safe'), 'All findings are safe for clean oats');

  // 5. Mission 7: Food Search by Name
  const snickersMatches = await searchFood('Snickers', { allergies: ['peanut'] });
  assert(snickersMatches.length > 0, 'Searching for "Snickers" returns results');
  assert(snickersMatches[0].product.name.includes('Snickers') || snickersMatches[0].product.brand === 'Snickers', 'Search result matches product name/brand');
  assert(snickersMatches[0].verdict === 'risk', 'Evaluated search result flags peanut allergen risk');

  const emptyMatches = await searchFood('xyznonexistentfood123', {});
  assert(Array.isArray(emptyMatches) && emptyMatches.length === 0, 'Searching for nonexistent food returns empty array for dedicated empty state');

  // 6. Custom Allergen Detection (Mission 5)
  const customAllergenResult = await analyzeBarcode('040000000002', {
    name: 'Yunus',
    allergies: ['custom_roasted_peanuts'],
    customAllergens: [{ id: 'custom_roasted_peanuts', label: 'Roasted Peanuts' }],
    conditions: [],
  });
  assert(customAllergenResult.verdict === 'risk', 'Custom keyword allergen correctly triggers risk evaluation');

  // 7. Error Handling: Barcode Not Found & Image Unreadable
  try {
    await analyzeBarcode('999999999999');
    assert(false, 'Expected BARCODE_NOT_FOUND error to be thrown');
  } catch (err) {
    assert(err.code === 'BARCODE_NOT_FOUND', 'Correctly throws BARCODE_NOT_FOUND for unregistered code 999999999999');
  }

  try {
    await analyzeImage('SIMULATE_BLURRY_IMAGE');
    assert(false, 'Expected IMAGE_UNREADABLE error to be thrown');
  } catch (err) {
    assert(err.code === 'IMAGE_UNREADABLE', 'Correctly throws IMAGE_UNREADABLE for blurry image input');
  }

  // 8. Data Quality States
  const dqGood = await analyzeImage('dummy_base64', {}, { dataQuality: 'good' });
  assert(dqGood.dataQuality === 'good', 'Data quality state good returned');

  const dqPartial = await analyzeImage('dummy_base64', {}, { dataQuality: 'verify_label' });
  assert(dqPartial.dataQuality === 'verify_label', 'Data quality state verify_label returned');

  const dqLow = await analyzeImage('dummy_base64', {}, { dataQuality: 'clearer_photo' });
  assert(dqLow.dataQuality === 'clearer_photo', 'Data quality state clearer_photo returned');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

