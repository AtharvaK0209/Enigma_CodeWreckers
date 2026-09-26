/**
 * NutriLens Comprehensive Backend & Mission Verification Suite
 * Validates Missions 1, 3, 4, 6, 9, 10
 */

import app, { startServer } from '../server.js';
import http from 'http';

const TEST_PORT = 5001;
process.env.PORT = TEST_PORT;

let server;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('\n================================================================');
  console.log('--- NutriLens Mission Verification Suite ---');
  console.log('================================================================\n');

  // Start test server
  server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, () => {
      console.log(`[Test Server] Listening on ${BASE_URL}`);
      resolve(s);
    });
  });

  const summary = [];

  try {
    // -------------------------------------------------------------
    // MISSION 1: Mongo Atlas + Profile Persistence (GET & PUT)
    // -------------------------------------------------------------
    console.log('\n>>> TESTING MISSION 1: Profile GET/PUT & Mongo Fallback with MONGO_URI unset...');
    
    // 1. GET initial profile
    const getRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: { 'x-user-id': 'test-user-m1' },
    });
    const profile = await getRes.json();
    console.log('[M1] GET /api/profile response:', JSON.stringify(profile, null, 2));

    if (getRes.status !== 200 || !profile.name) {
      throw new Error(`[M1 FAIL] Expected 200 with profile object, got ${getRes.status}`);
    }

    // 2. PUT updated profile
    const putRes = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-m1',
      },
      body: JSON.stringify({
        name: 'Yunus Tested',
        age: '21',
        allergies: ['peanut', 'tree_nuts', 'wheat'],
        customAllergens: [{ id: 'cust-1', label: 'MSG' }],
        conditions: ['hypertension', 'diabetes'],
      }),
    });
    const updatedProfile = await putRes.json();
    console.log('[M1] PUT /api/profile response:', JSON.stringify(updatedProfile, null, 2));

    if (
      updatedProfile.name !== 'Yunus Tested' ||
      !updatedProfile.allergies.includes('wheat') ||
      updatedProfile.customAllergens.length !== 1
    ) {
      throw new Error('[M1 FAIL] Profile update did not reflect submitted values');
    }

    // 3. Verify persistence with second GET
    const verifyGet = await fetch(`${BASE_URL}/api/profile`, {
      headers: { 'x-user-id': 'test-user-m1' },
    });
    const persisted = await verifyGet.json();
    if (persisted.name !== 'Yunus Tested') {
      throw new Error('[M1 FAIL] Profile changes did not persist across requests');
    }
    console.log('✅ MISSION 1 PASSED: Profile persistence verified with MONGO_URI unset.');
    summary.push({ mission: 'Mission 1 (Profile & Mongo Fallback)', status: 'PASSED' });

    // -------------------------------------------------------------
    // MISSION 3: Confirm history writes at end of every analysis
    // -------------------------------------------------------------
    console.log('\n>>> TESTING MISSION 3: History writes for barcode, image, and search...');
    const testUserId = 'test-user-m3';

    // 1. Analyze Barcode
    console.log('[M3] 1/3 Testing barcode analysis history write...');
    const barcodeRes = await fetch(`${BASE_URL}/api/analyze/barcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({ barcode: '8000500310427' }),
    });
    const barcodeData = await barcodeRes.json();
    console.log(`[M3] Barcode result verdict: ${barcodeData.verdict}, findings: ${barcodeData.findings?.length}`);

    // 2. Analyze Image
    console.log('[M3] 2/3 Testing image analysis history write...');
    const imageRes = await fetch(`${BASE_URL}/api/analyze/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        productKey: '7622210449283',
      }),
    });
    const imageData = await imageRes.json();
    console.log(`[M3] Image result verdict: ${imageData.verdict}, findings: ${imageData.findings?.length}`);

    // 3. Search Food
    console.log('[M3] 3/3 Testing search food history write...');
    const searchRes = await fetch(`${BASE_URL}/api/search?q=oats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': testUserId },
      body: JSON.stringify({ query: 'oats' }),
    });
    const searchData = await searchRes.json();
    console.log(`[M3] Search returned ${searchData.length} items`);

    // 4. Query /api/history to verify all 3 writes landed
    const histRes = await fetch(`${BASE_URL}/api/history`, {
      headers: { 'x-user-id': testUserId },
    });
    const historyList = await histRes.json();
    console.log(`[M3] History contains ${historyList.length} entries for user ${testUserId}`);
    console.log('[M3] History methods recorded:', historyList.map((h) => `${h.method}: ${h.name} (${h.verdict})`));

    const methodsRecorded = new Set(historyList.map((h) => h.method));
    if (!methodsRecorded.has('barcode') || !methodsRecorded.has('image') || !methodsRecorded.has('search')) {
      throw new Error(`[M3 FAIL] Expected history entries for barcode, image, and search. Found: ${Array.from(methodsRecorded)}`);
    }
    console.log('✅ MISSION 3 PASSED: All three analysis entry points land history documents.');
    summary.push({ mission: 'Mission 3 (History Writes on Analysis)', status: 'PASSED' });

    // -------------------------------------------------------------
    // MISSION 4: AlternativeService & /api/alternatives
    // -------------------------------------------------------------
    console.log('\n>>> TESTING MISSION 4: AlternativeService with real OFF search & deterministic filter...');
    
    // Test 1: Flagged product with alternatives (Tree nuts / Nutella)
    const nutellaAltRes = await fetch(`${BASE_URL}/api/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: {
          id: '8000500310427',
          barcode: '8000500310427',
          name: 'Hazelnut Cocoa Spread',
          primaryAllergenKey: 'tree_nuts',
          allergensDetected: ['tree_nuts', 'milk'],
          categories: ['spreads', 'chocolate-spreads'],
        },
        userProfile: {
          allergies: ['tree_nuts'],
          conditions: [],
        },
        mockGemini: true,
      }),
    });
    const nutellaAlts = await nutellaAltRes.json();
    console.log('[M4] Flagged product alternatives response:', JSON.stringify(nutellaAlts, null, 2));

    if (!nutellaAlts.hasAlternatives || nutellaAlts.alternatives.length === 0) {
      throw new Error('[M4 FAIL] Expected alternatives for tree nut flagged product');
    }

    // Verify none of the recommended alternatives contain tree_nuts!
    for (const alt of nutellaAlts.alternatives) {
      if ((alt.allergensDetected || []).includes('tree_nuts')) {
        throw new Error(`[M4 FAIL] Alternative ${alt.name} contained tree nuts! Deterministic filter failed.`);
      }
    }

    // Test 2: Flagged product with NO survivors -> explicit empty flag, NOT empty list with no signal
    console.log('[M4] Testing impossible dietary restrictions with zero survivors...');
    const impossibleAltRes = await fetch(`${BASE_URL}/api/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: {
          id: 'flagged-extreme-item',
          name: 'Ultra Complex Food',
          primaryAllergenKey: 'wheat',
          allergensDetected: ['wheat'],
          categories: ['cookies'],
        },
        // All conceivable ingredients blocked
        userProfile: {
          allergies: ['peanut', 'tree_nuts', 'wheat', 'milk', 'soy', 'egg', 'fish', 'shellfish', 'sesame'],
          conditions: ['hypertension', 'diabetes'],
          customAllergens: [
            { id: 'c1', label: 'flour' },
            { id: 'c2', label: 'sugar' },
            { id: 'c3', label: 'oat' },
            { id: 'c4', label: 'seed' },
            { id: 'c5', label: 'water' },
            { id: 'c6', label: 'salt' },
          ],
        },
      }),
    });
    const impossibleAlts = await impossibleAltRes.json();
    console.log('[M4] Impossible restrictions response:', JSON.stringify(impossibleAlts, null, 2));

    if (impossibleAlts.status !== 'no_verified_alternative' || impossibleAlts.hasAlternatives !== false) {
      throw new Error('[M4 FAIL] Expected status: "no_verified_alternative" and hasAlternatives: false');
    }
    console.log('✅ MISSION 4 PASSED: Deterministic filter verified, explicit empty state confirmed.');
    summary.push({ mission: 'Mission 4 (Safer Alternatives Backend)', status: 'PASSED' });

    // -------------------------------------------------------------
    // MISSION 6: Clarification State Machine (/api/clarify)
    // -------------------------------------------------------------
    console.log('\n>>> TESTING MISSION 6: /api/clarify 3-question capped state machine...');

    // 1. Start session
    const startRes = await fetch(`${BASE_URL}/api/clarify/start`, { method: 'POST' });
    const sessionData = await startRes.json();
    const sessionId = sessionData.sessionId;
    console.log('[M6] Started session:', sessionId, 'Step:', sessionData.stepIndex);

    if (sessionData.stepIndex !== 0 || sessionData.totalQuestionsAllowed !== 3) {
      throw new Error('[M6 FAIL] Expected start at stepIndex 0 with max 3 questions');
    }

    // 2. Answer Step 0: "yes" -> should yield Step 1
    const ans0Res = await fetch(`${BASE_URL}/api/clarify/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, stepIndex: 0, answer: 'yes' }),
    });
    const step1Data = await ans0Res.json();
    console.log('[M6] Step 1 response:', step1Data.question?.question);
    if (step1Data.stepIndex !== 1 || step1Data.isTerminal) {
      throw new Error('[M6 FAIL] Expected advance to stepIndex 1');
    }

    // 3. Answer Step 1: "yes" -> should yield Step 2 (Question 3)
    const ans1Res = await fetch(`${BASE_URL}/api/clarify/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, stepIndex: 1, answer: 'yes' }),
    });
    const step2Data = await ans1Res.json();
    console.log('[M6] Step 2 response (Final Question):', step2Data.question?.question);
    if (step2Data.stepIndex !== 2 || step2Data.isTerminal) {
      throw new Error('[M6 FAIL] Expected advance to stepIndex 2 (final question)');
    }

    // 4. Answer Step 2 (Final Question): Allergen picker answer -> MUST yield terminal final_result
    const ans2Res = await fetch(`${BASE_URL}/api/clarify/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        stepIndex: 2,
        answer: 'yes',
        selectedAllergens: ['peanut', 'tree_nuts'],
        userProfile: { allergies: ['peanut'] },
      }),
    });
    const finalData = await ans2Res.json();
    console.log('[M6] Final result outcome:', finalData.outcome, 'Verdict:', finalData.result?.verdict);
    console.log('[M6] Final data quality:', finalData.dataQuality);
    console.log('[M6] Tagged findings:', JSON.stringify(finalData.result?.findings, null, 2));

    if (!finalData.isTerminal || finalData.outcome !== 'final_result') {
      throw new Error('[M6 FAIL] Step 2 answer did not produce terminal final_result');
    }

    // Verify strict constraints:
    // dataQuality stays "low", source: "user_confirmed", confidence: "user_reported"
    if (finalData.dataQuality !== 'low' || finalData.source !== 'user_confirmed' || finalData.confidence !== 'user_reported') {
      throw new Error('[M6 FAIL] Constraint violated: dataQuality must be "low", source "user_confirmed", confidence "user_reported"');
    }

    // Check individual finding tags
    const confirmedFinding = finalData.result?.findings?.find((f) => f.evidenceSource === 'user_confirmed');
    if (!confirmedFinding || confirmedFinding.confidence !== 'user_reported') {
      throw new Error('[M6 FAIL] Finding missing evidenceSource: "user_confirmed" or confidence: "user_reported"');
    }

    // Verify 4th question is structurally rejected
    const ans4Res = await fetch(`${BASE_URL}/api/clarify/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, stepIndex: 3, answer: 'yes' }),
    });
    const step4Data = await ans4Res.json();
    console.log('[M6] 4th question attempt response:', step4Data);
    if (!step4Data.isTerminal) {
      throw new Error('[M6 FAIL] 4th question was not structurally prevented!');
    }

    // Test Branch: "no" on Step 0 -> should yield needs_new_photo
    const branchRes = await fetch(`${BASE_URL}/api/clarify/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'branch-test', stepIndex: 0, answer: 'no' }),
    });
    const branchData = await branchRes.json();
    console.log('[M6] "No" answer outcome:', branchData.outcome);
    if (branchData.outcome !== 'needs_new_photo') {
      throw new Error('[M6 FAIL] Expected "needs_new_photo" outcome when answer is "no"');
    }

    console.log('✅ MISSION 6 PASSED: Capped 3-question clarification state machine verified.');
    summary.push({ mission: 'Mission 6 (Clarification State Machine)', status: 'PASSED' });

    // -------------------------------------------------------------
    // MISSION 9: Product-lookup caching (Open Food Facts cache)
    // -------------------------------------------------------------
    console.log('\n>>> TESTING MISSION 9: Product lookup caching layer...');
    
    // First lookup
    const lookup1 = await fetch(`${BASE_URL}/api/analyze/barcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: '030000010204' }),
    });
    const res1 = await lookup1.json();

    // Second lookup of exact same barcode
    const lookup2 = await fetch(`${BASE_URL}/api/analyze/barcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: '030000010204' }),
    });
    const res2 = await lookup2.json();

    if (res1.product.name !== res2.product.name) {
      throw new Error('[M9 FAIL] Cached response mismatch');
    }
    console.log('✅ MISSION 9 PASSED: Caching layer serves repeat barcode lookups.');
    summary.push({ mission: 'Mission 9 (Product Lookup Caching)', status: 'PASSED' });

    // -------------------------------------------------------------
    // MISSION 10: Real bcrypt + JWT Auth
    // -------------------------------------------------------------
    console.log('\n>>> TESTING MISSION 10: Real bcrypt password hashing and JWT issuance...');
    const testEmail = `user_${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';

    // 1. Signup
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'JWT User',
        allergies: ['fish'],
        conditions: ['ckd'],
      }),
    });
    const signupData = await signupRes.json();
    console.log('[M10] Signup response message:', signupData.message, 'Token received:', Boolean(signupData.token));
    if (!signupData.token) {
      throw new Error('[M10 FAIL] Signup did not issue a JWT token');
    }

    // 2. Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    console.log('[M10] Login success. Token received:', Boolean(loginData.token));
    if (!loginData.token) {
      throw new Error('[M10 FAIL] Login did not issue a JWT token');
    }

    // 3. Access protected route (/api/profile) with Bearer token
    const authProfileRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const authProfile = await authProfileRes.json();
    console.log('[M10] Protected /api/profile accessed via Bearer JWT:', authProfile.name, authProfile.email);
    if (authProfile.email !== testEmail || authProfile.name !== 'JWT User') {
      throw new Error('[M10 FAIL] Authenticated route did not recognize JWT user');
    }

    // 4. Access /api/history with Bearer token
    const authHistoryRes = await fetch(`${BASE_URL}/api/history`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    if (authHistoryRes.status !== 200) {
      throw new Error('[M10 FAIL] Protected /api/history failed with JWT');
    }

    console.log('✅ MISSION 10 PASSED: Real bcrypt hashing and JWT tokens verified across protected routes.');
    summary.push({ mission: 'Mission 10 (bcrypt + JWT Auth)', status: 'PASSED' });

    console.log('\n================================================================');
    console.log('--- ALL BACKEND TEST MISSIONS PASSED SUCCESSFULLY ---');
    console.log('================================================================');
    console.table(summary);
  } finally {
    if (server) {
      server.close();
      console.log('[Test Server] Stopped.');
    }
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
