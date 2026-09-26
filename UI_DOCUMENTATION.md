# NutriLens — Comprehensive UI & UX Architecture Documentation
**ENIGMA 5.0 — Team Code Wreckers**
**Team Members:** Vibha Madabushi, Atharva Ketkar, Atharva Khandagale, Yunus Khan

---

## 1. Executive Summary & Design Vision

**NutriLens** is a clinical-grade, consumer-friendly food safety intelligence web application. Its purpose is to eliminate dangerous food risks by allowing users to set personal allergen and medical constraints, scan product barcodes or packaging labels, and receive immediate, plain-language risk evaluations before eating.

### Core Design Principles
1. **Warmth Over Sterile Clinical UI**: Built on a warm, calming cream background (`#F8F7F2`) with pure white floating cards (`#FFFFFF`) and deep obsidian typography (`#111827`).
2. **High-Contrast Traffic-Light Semantics**: Safety states are communicated using distinct, accessible surface colors:
   - **Safe**: Vivid chartreuse/lime (`#E4FA75`)
   - **Caution**: Warm golden amber (`#FDE68A`)
   - **High Risk**: Coral crimson (`#FECDD3`)
3. **Zero Engineering Jargon**: Internal database schemas (`severity: HIGH`, `data_quality: partial`, `trigger`, `source`) are strictly translated into human-centered plain language (e.g., *"This product may not be safe for you"*).
4. **Mobile-First Ergonomics**: Designed for seamless single-thumb operation on mobile devices (360px–390px viewports), featuring a floating black pill navigation dock, minimum 44px touch targets, and iOS safe-area inset support.

---

## 2. Design Tokens & Style System

The design system is centralized in `src/styles/tokens.js` and defined in `src/styles/theme.css`:

### 2.1 Color Tokens
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--nl-bg-canvas` | `#F8F7F2` | Global background canvas (warm off-white/cream) |
| `--nl-bg-surface` | `#FFFFFF` | Primary elevated card surface |
| `--nl-text-primary` | `#111827` | Headings, hero titles, primary button text |
| `--nl-text-secondary` | `#4B5563` | Subtitles, descriptive copy |
| `--nl-text-muted` | `#9CA3AF` | Form placeholders, subtle helper labels |
| `--nl-border-subtle` | `#E5E7EB` | Hairline borders and dividers |
| `--nl-verdict-safe` | `#E4FA75` | Safe status background (vivid chartreuse/lime) |
| `--nl-verdict-safe-dark` | `#22543D` | Dark forest green text for safe status |
| `--nl-verdict-caution` | `#FDE68A` | Caution status background (warm golden amber) |
| `--nl-verdict-caution-dark`| `#78350F` | Dark warm amber text for caution status |
| `--nl-verdict-risk` | `#FECDD3` | High risk status background (coral crimson) |
| `--nl-verdict-risk-dark` | `#991B1B` | Deep crimson text for high risk status |

### 2.2 Typography Hierarchy (Inter)
- **Hero Title**: `40px / 2.5rem`, `font-weight: 800`, `letter-spacing: -0.03em`
- **Section Heading (H1)**: `28px / 1.75rem`, `font-weight: 700`, `letter-spacing: -0.02em`
- **Card Heading (H2)**: `20px / 1.25rem`, `font-weight: 600`, `letter-spacing: -0.01em`
- **Body Text**: `15px / 0.9375rem`, `line-height: 1.5`, `color: #4B5563`
- **Label / Pill Button**: `13px / 0.8125rem`, `font-weight: 600`
- **Micro Badge**: `11px / 0.6875rem`, `font-weight: 700`, `text-transform: uppercase`

### 2.3 Radii, Borders & Shadows
- **Pill Radius**: `border-radius: 9999px` (super-elliptical pill buttons, navigation dock, tags)
- **Card Radius**: `border-radius: 24px`
- **Soft Ambient Elevation**: `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)`
- **Floating Dock Shadow**: `box-shadow: 0 12px 32px rgba(17, 24, 39, 0.18)`

---

## 3. Core Component Architecture

```
src/
├── components/
│   ├── common/
│   │   ├── PillButton.jsx      # Tactile pill CTA (primary, secondary, outline, ghost)
│   │   ├── PillButton.css
│   │   ├── Card.jsx            # Standardized rounded elevated container
│   │   ├── Card.css
│   │   ├── SegmentedControl.jsx# Pill-shaped segmented sliding selector
│   │   └── SegmentedControl.css
│   ├── Navigation.jsx          # Responsive dual-mode (Desktop header + Mobile floating dock)
│   ├── Navigation.css
│   ├── RiskCard.jsx            # Plain-language food safety finding evidence card
│   ├── RiskCard.css
│   ├── BarcodeScanner.jsx      # Camera viewfinder, laser reticle, mobile permission modal
│   └── BarcodeScanner.css
```

### 3.1 PillButton (`src/components/common/PillButton.jsx`)
- Supports `primary` (obsidian `#111827`), `secondary` (white `#FFFFFF`), `outline`, `ghost`, and `accent` (`#E4FA75`).
- Includes tactile active micro-spring scale (`active:scale(0.97)`).
- Supports leading and trailing icons with proper SVG vertical alignment.

### 3.2 Responsive Dual Navigation (`src/components/Navigation.jsx`)
- **Desktop Mode (≥768px)**:
  - Frosted top bar with `backdrop-filter: blur(16px)`.
  - Brand logo with green pulse status dot.
  - Centered navigation pill tabs: `Dashboard`, `Search`, `Scan Food`, `Profile`.
  - Right-aligned `Scan Product` instant action button.
- **Mobile Mode (<768px)**:
  - Floating pill dock anchored at bottom (`bottom: max(16px, env(safe-area-inset-bottom))`).
  - Active tab highlighted by an animated white pill background indicator.
  - Dedicated highlighted center scanning action button.

### 3.3 RiskCard (`src/components/RiskCard.jsx`)
- Converts complex allergen findings and nutritional threshold breaches into plain English.
- Displays severity badges, human-readable explanations, and collapsible source ingredient drawers.

### 3.4 BarcodeScanner & Mobile Permission Modal (`src/components/BarcodeScanner.jsx`)
- Continuous video streaming via `html5-qrcode`.
- Laser animation HUD indicating active scanning state.
- **Mobile Camera Permission Pop-Up**: Handles browser permission denials or mobile user gesture requirements with an interactive modal explaining camera access and providing a one-tap direct retry button.
- Fallback photo upload button for instant file/photo label OCR.

---

## 4. Screen Breakdown & User Journeys

### 4.1 Landing Page (`/`)
- **Brand Hero**: Clear value proposition: *"Know exactly what's in your food, in plain language."*
- **Live Demo Card**: Interactive preview displaying real-world allergen conflict analysis (e.g. Nutella flagged for hazelnuts) alongside a verified safe alternative (*SunButter Sunflower Butter*).
- **Difference & Problem Section**: Compares confusing chemical food labels vs. NutriLens plain-language clarity.
- **How It Works**: 3-step visualization (Set Profile → Scan Product → Eat with Confidence).
- **Trust & Compliance**: Highlights FDA major allergen adherence and verified food registries.
- **Action CTAs**: `Get Started →` routes to Onboarding; `Sign In` routes to `/signin`.

### 4.2 Authentication Flow (`/signin`)
- Minimalist, distraction-free authentication card on warm cream background.
- Email and password input fields with input focus ring styling.
- **1-Click Quick Demo Access**: Allows evaluators and users to instantly log in with pre-configured safety rules.
- Direct redirection to `/dashboard`.

### 4.3 5-Step Onboarding Flow (`/onboarding`)
Sequential tap-through flow that builds the user's safety profile:
- **Step 0 — Welcome**: Product overview, privacy assurance, and value proposition.
- **Step 1 — Name**: User identity personalization.
- **Step 2 — Allergens**: Grid of all 9 FDA major allergens (Peanuts, Tree Nuts, Milk/Dairy, Eggs, Wheat, Soy, Fish, Crustacean Shellfish, Sesame) + custom keyword tag input (e.g. *Strawberries*, *Sulfites*).
- **Step 3 — Health Conditions**: Chronic condition monitoring (Hypertension, Diabetes, CKD, PCOS) with transparent partial-coverage disclosures.
- **Step 4 — Review & Complete**: Final summary card with celebratory confetti animation (`canvas-confetti`).

### 4.4 The Restored Dashboard (`/dashboard`)
- **Active Safety Protection Hero**: Chartreuse lime card displaying real-time active shield status and monitored rule count.
- **Quick Action Launcher**: Large, accessible cards for `Scan Barcode / Label` and `Search Food by Name`.
- **Recent Checks Ledger**: History feed of previously scanned items with safety verdict chips and empty-state guidance.

### 4.5 Food Scanner & Multimodal Vision (`/scan`)
- Fullscreen camera viewfinder with target crosshair.
- Instant barcode identification with tactile haptic feedback.
- Manual barcode number entry and packaging photo upload fallback.

### 4.6 Food Search Catalog (`/search`)
- Real-time debounced query input across packaged food items.
- Live personalized risk evaluation badges (*Safe*, *Caution*, *Contains Allergens*) rendered directly in search results.
- Empty query state with suggested popular scans.

### 4.7 Product Risk Assessment & Analysis (`/results`)
- **Hero Verdict Card**: Visual traffic-light color and clear plain-language statement:
  - *Safe*: "Looks safe for you"
  - *Caution*: "A few things to check"
  - *Risk*: "This product may not be safe for you"
- **Data Quality Indicator**: Honest 3-state badge (`good`, `verify_label`, `clearer_photo`).
- **Evidence Breakdown**: Stack of composable `RiskCard` items explaining matching ingredients.
- **Safer Alternatives**: Suggests medically safe alternative products when risks are identified.

### 4.8 Profile & Health Rules Management (`/profile`)
- Direct toggle switches for allergens, chronic conditions, and custom ingredient tags.
- Instant profile reset and sign-out controls synced with `localStorage`.

---

## 5. Content Governance & Plain-Language Standards

| Internal Term | Banned UI Copy | Required Plain-Language Translation |
| :--- | :--- | :--- |
| `severity: HIGH` | "Severity: High" | *"This product may not be safe for you"* |
| `severity: MEDIUM` | "Severity: Medium" | *"A few things to check before eating"* |
| `severity: LOW` | "Severity: Low" | *"Looks safe for you"* |
| `category: allergen` | "Category: Allergen" | *"Matches your allergy to [Item]"* |
| `data_quality: partial`| "Partial Data Quality" | *"Some ingredients were hard to read. Double-check label."* |
| `data_quality: low` | "Low Data Quality" | *"We could not read the label clearly. Please take a clearer photo."* |

---

## 6. Verification, Testing & Quality Assurance

- **Automated Test Suite**: 46/46 unit and integration tests passing (`node scripts/test_nutrilens.mjs`).
- **Production Build**: Verified clean compilation with zero bundling errors (`npm run build`).
- **Responsive Viewport Validation**: Tested on desktop (1280x900) and mobile devices (360x780, 390x844).
- **Network Compatibility**: Configured with `host: true` in `vite.config.js` to allow testing across mobile devices over local WiFi.
