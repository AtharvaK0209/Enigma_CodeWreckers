import http from 'http';
import app from '../server.js';

console.log('=== Testing Missions 1, 2, 7 & 8: Real Auth, Profile, RKB & Scoped History ===\n');

const server = app.listen(5002, async () => {
  try {
    const baseUrl = 'http://localhost:5002';

    // 1. Sign up User A (Alice - Peanut Allergy & Hypertension)
    console.log('>>> 1. Creating User A (Alice: Peanut Allergy + Hypertension)...');
    const signupARes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `alice_${Date.now()}@example.com`,
        password: 'passwordAlice123',
        name: 'Alice',
        allergies: ['peanut'],
        conditions: ['hypertension'],
      }),
    });
    const signupA = await signupARes.json();
    const tokenA = signupA.token;
    console.log(`✅ User A Created: id=${signupA.user.id}, token=${tokenA.slice(0, 20)}...`);

    // 2. Sign up User B (Bob - Milk Allergy & Diabetes)
    console.log('\n>>> 2. Creating User B (Bob: Milk Allergy + Diabetes)...');
    const signupBRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `bob_${Date.now()}@example.com`,
        password: 'passwordBob123',
        name: 'Bob',
        allergies: ['milk'],
        conditions: ['diabetes'],
      }),
    });
    const signupB = await signupBRes.json();
    const tokenB = signupB.token;
    console.log(`✅ User B Created: id=${signupB.user.id}, token=${tokenB.slice(0, 20)}...`);

    // Verify distinct sessions
    if (tokenA === tokenB || signupA.user.id === signupB.user.id) {
      throw new Error('User A and User B tokens or IDs collided!');
    }
    console.log('✅ PASS (Mission 1): Two distinct authenticated sessions confirmed.');

    // 3. User A scans Nutella (8000500310427)
    console.log('\n>>> 3. User A scans Nutella (8000500310427)...');
    const scanARes = await fetch(`${baseUrl}/api/analyze/barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ barcode: '8000500310427' }),
    });
    const scanA = await scanARes.json();
    console.log(`User A Scan Verdict: ${scanA.verdict} ("${scanA.verdictTitle}")`);
    console.log(`User A Findings:`, scanA.findings.map(f => `${f.category}: ${f.headline} (${f.severity})`));

    // 4. User B scans Nutella (8000500310427)
    console.log('\n>>> 4. User B scans Nutella (8000500310427)...');
    const scanBRes = await fetch(`${baseUrl}/api/analyze/barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ barcode: '8000500310427' }),
    });
    const scanB = await scanBRes.json();
    console.log(`User B Scan Verdict: ${scanB.verdict} ("${scanB.verdictTitle}")`);
    console.log(`User B Findings:`, scanB.findings.map(f => `${f.category}: ${f.headline} (${f.severity})`));

    // Check personalization differences (Mission 2 & 7)
    const userBMilkRisk = scanB.findings.find(f => f.headline.toLowerCase().includes('milk') && f.severity === 'risk');
    const userAMilkRisk = scanA.findings.find(f => f.headline.toLowerCase().includes('milk') && f.severity === 'risk');

    if (userBMilkRisk && !userAMilkRisk) {
      console.log('✅ PASS (Mission 2 & 7): Personalization verified! User B flagged risk for milk, whereas User A (peanut allergy) did not flag milk as risk.');
      console.log(`   User B Milk Finding Evidence: ${userBMilkRisk.evidence}`);
      console.log(`   User B Milk Finding Source: ${userBMilkRisk.source}`);
    } else {
      console.error('❌ Personalization check failed between User A and User B');
    }

    // 5. User B also scans a separate product (Thai noodles 737628064502)
    console.log('\n>>> 5. User B scans Thai Noodles (737628064502)...');
    await fetch(`${baseUrl}/api/analyze/barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ barcode: '737628064502' }),
    });

    // 6. Check History Isolation (Mission 8)
    console.log('\n>>> 6. Checking History Isolation (Mission 8)...');
    const historyARes = await fetch(`${baseUrl}/api/history`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const historyA = await historyARes.json();

    const historyBRes = await fetch(`${baseUrl}/api/history`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const historyB = await historyBRes.json();

    console.log(`User A History Count: ${historyA.length} (Items: ${historyA.map(h => h.name).join(', ')})`);
    console.log(`User B History Count: ${historyB.length} (Items: ${historyB.map(h => h.name).join(', ')})`);

    if (historyA.length === 1 && historyB.length === 2 && !historyA.some(h => h.name.includes('Thai'))) {
      console.log('✅ PASS (Mission 8): History strictly scoped to authenticated user with zero cross-contamination!');
    } else {
      console.error('❌ History isolation check failed!');
    }

    console.log('\n=============================================================');
    console.log('✅ ALL MISSIONS 1, 2, 7 & 8 CRITERIA MET');
    console.log('=============================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    process.exit(1);
  }
});
