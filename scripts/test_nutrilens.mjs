import { analyzeBarcode, analyzeImage } from '../src/services/api.js';
import { THEME } from '../src/styles/tokens.js';

async function runTests() {
  console.log('--- Starting NutriLens Test Suite ---');
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

  // 1. Theme Tokens Check (Mission 1)
  assert(THEME.colors.safe?.surface === '#E4FA75', 'Safe verdict surface color is vivid chartreuse/lime (#E4FA75)');
  assert(THEME.colors.caution?.surface === '#FDE68A', 'Caution verdict surface color is warm golden amber (#FDE68A)');
  assert(THEME.colors.risk?.surface === '#FECDD3', 'Risk verdict surface color is coral crimson (#FECDD3)');
  assert(THEME.allergens.length === 7, 'Theme exports all 7 major allergen items (peanut, milk, egg, tree_nuts, wheat, soy, sesame)');
  assert(THEME.conditions.length === 2, 'Theme exports both health conditions (hypertension, diabetes)');

  // 2. Allergen Risk Detection (Mission 1 & 2 & 5)
  const nutellaResult = await analyzeBarcode('8000500310427', {
    name: 'Yunus',
    allergies: ['tree_nuts'],
    conditions: ['hypertension'],
  });
  assert(nutellaResult.verdict === 'risk', 'Nutella spread flags "risk" for tree_nuts allergy');
  assert(nutellaResult.verdictTitle === 'Risk found', 'Verdict title is "Risk found"');
  assert(nutellaResult.dataQuality === 'good', 'Default barcode data quality is "good"');
  assert(nutellaResult.dataQualityMessage === 'Verified data', 'Data quality message is "Verified data"');
  assert(nutellaResult.findings.length > 0, 'Produces structured findings list');

  // Verify RiskFinding contract shape
  for (const finding of nutellaResult.findings) {
    assert(typeof finding.category === 'string', 'Finding has string category');
    assert(['safe', 'caution', 'risk'].includes(finding.severity), 'Finding severity matches enum');
    assert(typeof finding.evidence === 'string', 'Finding has string evidence');
    assert(finding.trigger === undefined || finding.trigger === null || typeof finding.trigger === 'string', 'Finding trigger is string or null');
    assert(finding.source === undefined || finding.source === null || typeof finding.source === 'string', 'Finding source is string or null');
  }

  // 3. Condition Caution Detection (Mission 1 & 2 & 5)
  const energyResult = await analyzeBarcode('5449000000996', {
    name: 'Yunus',
    allergies: [],
    conditions: ['hypertension', 'diabetes'],
  });
  assert(energyResult.verdict === 'caution', 'Energy drink flags "caution" for hypertension and diabetes');

  // 4. Wholesome 100% Safe (Mission 7 Edge Case 3: No concerns found)
  const oatsResult = await analyzeBarcode('030000010204', {
    name: 'Yunus',
    allergies: ['peanut'],
    conditions: [],
  });
  assert(oatsResult.verdict === 'safe', 'Pure Oats flags "safe" with no allergen conflicts');
  assert(oatsResult.findings.every(f => f.severity === 'safe'), 'All findings are safe for clean oats');

  // 5. Mission 7 Edge Case 1: Barcode Not Found
  try {
    await analyzeBarcode('999999999999');
    assert(false, 'Expected BARCODE_NOT_FOUND error to be thrown');
  } catch (err) {
    assert(err.code === 'BARCODE_NOT_FOUND', 'Correctly throws BARCODE_NOT_FOUND for unregistered code 999999999999');
  }

  // 6. Mission 4 & Mission 7 Edge Case 2: Image Unreadable
  try {
    await analyzeImage('SIMULATE_BLURRY_IMAGE');
    assert(false, 'Expected IMAGE_UNREADABLE error to be thrown');
  } catch (err) {
    assert(err.code === 'IMAGE_UNREADABLE', 'Correctly throws IMAGE_UNREADABLE for blurry image input');
  }

  // 7. Mission 6: Three Data Quality Badge States
  const dqState1 = await analyzeImage('dummy_base64', {}, { dataQuality: 'good' });
  assert(dqState1.dataQualityMessage === 'Verified data', 'State 1 data quality message is "Verified data"');

  const dqState2 = await analyzeImage('dummy_base64', {}, { dataQuality: 'verify_label' });
  assert(dqState2.dataQualityMessage === 'Please verify against the physical label', 'State 2 data quality message is "Please verify against the physical label"');

  const dqState3 = await analyzeImage('dummy_base64', {}, { dataQuality: 'clearer_photo' });
  assert(dqState3.dataQualityMessage === 'Please provide a clearer photo', 'State 3 data quality message is "Please provide a clearer photo"');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
