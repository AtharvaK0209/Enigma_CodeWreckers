# ENIGMA 5.0 

## Team Name: Code Wreckers

### Team Members:
* Vibha Madabushi
* Atharva Ketkar
* Atharva Khandagale
* Yunus Khan

---

# NutriLens — Food Safety & Allergen Scanner

NutriLens is a responsive food safety scanner web application that empowers users to establish a personalized health & allergy profile, scan product barcodes or capture label photos via OCR, and receive real-time, actionable traffic-light risk assessments.

## Key Features
- **Personalized Safety Profile**: Configure alerts for all 9 FDA major food allergens (Peanuts, Tree Nuts, Milk/Dairy, Eggs, Wheat/Gluten, Soy, Fish, Crustacean Shellfish, Sesame) and chronic health conditions (Hypertension, Diabetes, CKD, PCOS) with custom ingredient tags.
- **Dedicated Landing Page & Authentication**: Full public landing page (`/`) with live demo analysis, 1-click demo sign-in (`/signin`), and 5-step onboarding wizard (`/onboarding`).
- **Restored Health Overview Dashboard**: Active Safety Protection hero card (`/dashboard`) with real-time monitored rules and quick action tiles.
- **Mobile Camera & Barcode Scanner**: Camera viewfinder powered by `html5-qrcode` with laser HUD, mobile camera permission modal, and instant photo upload fallback.
- **Search Catalog**: Real-time food search with live personalized risk tags.
- **Traffic-Light Verdict Hero Card**: Plain-language risk assessments (Safe Lime `#E4FA75`, Caution Amber `#FDE68A`, Risk Coral `#FECDD3`).
- **Data Quality Indicators**: 3-state honest label clarity indicators (`good`, `verify_label`, `clearer_photo`).
- **Plain-Language Evidence Cards**: Composable `RiskCard` evidence stack free of confusing engineering terms.

## Detailed UI & Architecture Documentation
For an exhaustive breakdown of the design system, tokens, components, and user journeys, see:
- [UI_DOCUMENTATION.md](./UI_DOCUMENTATION.md)

## Tech Stack
- **Frontend**: React 19, Vite 8, Lucide React, Canvas Confetti
- **Styling**: Vanilla CSS Design Tokens (Warm cream `#F8F7F2`, rounded cards, black pill navigation)
- **Scanning Engine**: `html5-qrcode`

## Running Locally
```bash
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

## Testing & Quality Assurance
```bash
node scripts/test_nutrilens.mjs
npm run build
```