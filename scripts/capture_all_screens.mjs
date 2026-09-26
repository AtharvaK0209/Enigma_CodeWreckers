import { execSync } from 'child_process';
import path from 'path';

const ARTIFACT_DIR = '/Users/yunuskhan/.gemini/antigravity-ide/brain/03bcbbc2-4fe7-4f82-90d7-f0035c824bcf';
const CHROME_PATH = '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';

const tasks = [
  { name: 'styleguide_desktop.png', url: 'http://127.0.0.1:5173/styleguide', width: 1280, height: 950 },
  { name: 'styleguide_mobile.png', url: 'http://127.0.0.1:5173/styleguide', width: 390, height: 844 },
  { name: 'home_desktop.png', url: 'http://127.0.0.1:5173/', width: 1280, height: 900 },
  { name: 'home_mobile_390.png', url: 'http://127.0.0.1:5173/', width: 390, height: 844 },
  { name: 'home_mobile_360.png', url: 'http://127.0.0.1:5173/', width: 360, height: 780 },
  { name: 'onboarding_step0_welcome.png', url: 'http://127.0.0.1:5173/onboarding?step=0', width: 390, height: 844 },
  { name: 'onboarding_step1_name.png', url: 'http://127.0.0.1:5173/onboarding?step=1', width: 390, height: 844 },
  { name: 'onboarding_step2_allergens_other.png', url: 'http://127.0.0.1:5173/onboarding?step=2&other=1', width: 390, height: 950 },
  { name: 'onboarding_step3_conditions_ckd.png', url: 'http://127.0.0.1:5173/onboarding?step=3', width: 390, height: 844 },
  { name: 'onboarding_step4_summary.png', url: 'http://127.0.0.1:5173/onboarding?step=4', width: 390, height: 844 },
  { name: 'search_initial_mobile.png', url: 'http://127.0.0.1:5173/search', width: 390, height: 844 },
  { name: 'search_results_mobile.png', url: 'http://127.0.0.1:5173/search?q=Snickers', width: 390, height: 844 },
  { name: 'search_empty_mobile.png', url: 'http://127.0.0.1:5173/search?q=xyznonexistentfood123', width: 390, height: 844 },
  { name: 'results_risk_mobile.png', url: 'http://127.0.0.1:5173/results', width: 390, height: 1100 },
  { name: 'results_safe_mobile.png', url: 'http://127.0.0.1:5173/results?state=safe', width: 390, height: 900 },
  { name: 'results_dq_partial_mobile.png', url: 'http://127.0.0.1:5173/results?dq=verify_label', width: 390, height: 1000 },
  { name: 'results_dq_low_mobile.png', url: 'http://127.0.0.1:5173/results?dq=clearer_photo', width: 390, height: 1000 },
  { name: 'analyze_fallback_mobile.png', url: 'http://127.0.0.1:5173/analyze', width: 390, height: 844 },
];

console.log(`Starting automated capture of ${tasks.length} screens...`);

for (const t of tasks) {
  const dest = path.join(ARTIFACT_DIR, t.name);
  const cmd = `${CHROME_PATH} --headless --disable-gpu --window-size=${t.width},${t.height} --virtual-time-budget=2500 --screenshot="${dest}" "${t.url}"`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log(`📸 Captured: ${t.name} (${t.width}x${t.height})`);
  } catch (err) {
    console.error(`Failed to capture ${t.name}:`, err.message);
  }
}

console.log('Capture complete!');
