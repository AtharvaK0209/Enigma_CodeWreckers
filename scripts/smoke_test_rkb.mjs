import { loadRiskKnowledgeBase, getRKB } from '../backend/knowledge/index.js';
import { normalizeWithRKB } from '../services/normalizationService.js';
import { evaluateProductSafety } from '../services/decisionEngine.js';

console.log('=== Mission 0: Risk Knowledge Base Startup & Smoke Test ===\n');

// 1. Startup load
const rkb = loadRiskKnowledgeBase();
console.log('✅ RKB loaded successfully at startup.\n');

// 2. Smoke Test 1: Peanut-derived ingredient (Arachis hypogaea) for peanut-allergic profile
console.log('>>> Running Smoke Test 1: Peanut ingredient match with RKB sources...');
const peanutProductCanonical = {
  source: 'openfoodfacts',
  barcode: '1234567890123',
  name: 'Organic Peanut Butter',
  brand: 'NutriSafe',
  imageUrl: 'https://example.com/pb.jpg',
  ingredientsText: 'Roasted organic peanuts (arachis hypogaea), sea salt.',
  allergens: ['en:peanuts'],
  traces: [],
  servingSize: '32g',
  nutrition: {
    energy: 590,
    carbohydrates: 20,
    sugars: 4,
    fiber: 8,
    protein: 25,
    fat: 50,
    saturatedFat: 10,
    transFat: 0,
    sodium: 0.15,
  },
};

const userProfilePeanut = {
  name: 'Allergic User',
  allergies: ['peanut'],
  conditions: [],
};

const normalizedPeanutProduct = normalizeWithRKB(peanutProductCanonical);
const peanutEval = evaluateProductSafety(normalizedPeanutProduct, userProfilePeanut);

console.log('Peanut Analysis Verdict:', peanutEval.verdict);
console.log('Peanut Findings Count:', peanutEval.findings.length);

const peanutFinding = peanutEval.findings.find(f => f.category === 'Allergen Alert' && f.severity === 'risk');
if (peanutFinding) {
  console.log('✅ PASS: Found risk finding:', peanutFinding.headline);
  console.log('   Evidence:', peanutFinding.evidence);
  console.log('   Trigger:', peanutFinding.trigger);
  console.log('   Source:', peanutFinding.source);
  if (peanutFinding.source === 'FDA_MAJOR_ALLERGENS') {
    console.log('✅ PASS: Finding source strictly matches FDA_MAJOR_ALLERGENS from sources.json');
  } else {
    console.warn('⚠️ Source was:', peanutFinding.source);
  }
} else {
  console.error('❌ FAIL: No risk finding produced for peanut product!');
  process.exit(1);
}

// 3. Smoke Test 2: High-sodium product for hypertension profile
console.log('\n>>> Running Smoke Test 2: High sodium product for hypertension profile...');
const highSodiumProductCanonical = {
  source: 'openfoodfacts',
  barcode: '9876543210987',
  name: 'Instant Ramen Noodles',
  brand: 'QuickMeal',
  imageUrl: 'https://example.com/ramen.jpg',
  ingredientsText: 'Wheat flour, palm oil, salt, monosodium glutamate.',
  allergens: ['en:gluten'],
  traces: [],
  servingSize: '85g',
  nutrition: {
    energy: 380,
    carbohydrates: 55,
    sugars: 2,
    fiber: 2,
    protein: 8,
    fat: 14,
    saturatedFat: 7,
    transFat: 0,
    sodium: 1.82, // 1.82g sodium / 100g = 1820mg sodium
  },
};

const userProfileHypertension = {
  name: 'Hypertensive User',
  allergies: [],
  conditions: ['hypertension'],
};

const normalizedSodiumProduct = normalizeWithRKB(highSodiumProductCanonical);
const sodiumEval = evaluateProductSafety(normalizedSodiumProduct, userProfileHypertension);

console.log('Sodium Analysis Verdict:', sodiumEval.verdict);
const sodiumFinding = sodiumEval.findings.find(f => f.category === 'Hypertension Concern' && f.severity === 'caution');
if (sodiumFinding) {
  console.log('✅ PASS: Found hypertension finding:', sodiumFinding.headline);
  console.log('   Evidence:', sodiumFinding.evidence);
  console.log('   Trigger:', sodiumFinding.trigger);
  console.log('   Source:', sodiumFinding.source);
  if (sodiumFinding.source === 'WHO_SODIUM') {
    console.log('✅ PASS: Finding source strictly matches WHO_SODIUM from sources.json');
  } else {
    console.warn('⚠️ Source was:', sodiumFinding.source);
  }
} else {
  console.error('❌ FAIL: No hypertension finding produced for high sodium product!');
  process.exit(1);
}

console.log('\n=============================================================');
console.log('✅ ALL MISSION 0 SMOKE TESTS COMPLETED SUCCESSFULLY');
console.log('=============================================================\n');
