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
- **Personalized Intake Profile**: Configure alerts for 7 major food allergens (Peanuts, Tree Nuts, Dairy/Milk, Eggs, Wheat/Gluten, Soy, Sesame) and 2 dietary conditions (Hypertension, Diabetes).
- **Barcode Scanner**: Camera viewfinder powered by `html5-qrcode` with laser HUD overlay and fallback controls.
- **Multimodal Label OCR**: Camera photo capture and file drag-and-drop with client-side image compression and animated AI analysis HUD.
- **Traffic-Light Verdict Hero Card**: Scaled-up health overview status cards with distinct safe, caution, and risk color systems.
- **Data Quality Badges**: 3-state data fidelity verification (`Verified data`, `Please verify against the physical label`, `Please provide a clearer photo`).
- **Structured Findings**: Composable `RiskCard` evidence stack detailing category, severity, evidence, trigger ingredient, and reference regulations.

## Tech Stack
- **Frontend**: React 19, Vite 8, Lucide React, Canvas Confetti
- **Styling**: Vanilla CSS Design Tokens (Warm cream palette, rounded cards, black pill navigation)
- **Scanning Engine**: `html5-qrcode`

## Running Locally
```bash
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.