import React, { useState } from 'react';
import {
  ShieldCheck,
  ScanLine,
  Search,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Activity,
  Sparkles,
  ChevronRight,
  Eye,
  BookOpen,
  Lock,
  Layers,
  Zap,
  HelpCircle,
  FileText
} from 'lucide-react';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import { useProfile } from '../../context/ProfileContext';
import './LandingScreen.css';

export default function LandingScreen({ onNavigate }) {
  const { isAuthenticated } = useProfile();
  // Interactive demo profile toggle
  const [demoProfile, setDemoProfile] = useState('peanut');

  const demoScenarios = {
    peanut: {
      profileName: 'Yunus (Peanut & Nut Allergy)',
      badgeClass: 'demo-risk',
      verdict: 'This product may not be safe for you',
      verdictTone: 'risk',
      icon: ShieldAlert,
      finding: 'Direct presence of roasted hazelnuts (13%) and skimmed milk powder detected.',
      scientific: 'Hazelnuts (Corylus avellana) & Dairy proteins',
      saferAlt: 'SunButter Organic Sunflower Seed Butter (100% Nut-Free)',
    },
    hypertension: {
      profileName: 'Maria (Hypertension Watch)',
      badgeClass: 'demo-caution',
      verdict: 'A few things to check',
      verdictTone: 'caution',
      icon: AlertTriangle,
      finding: 'Elevated sodium content (840mg) exceeds recommended cardiovascular threshold.',
      scientific: 'Sodium citrate & high-potassium salts',
      saferAlt: 'Cold-Pressed Electrolyte Coconut Water (Zero Added Sodium)',
    },
    clean: {
      profileName: 'Alex (No Active Restrictions)',
      badgeClass: 'demo-safe',
      verdict: 'Looks safe for you',
      verdictTone: 'safe',
      icon: CheckCircle2,
      finding: 'No restricted allergens, additives, or health hazards detected.',
      scientific: 'Pure whole food formulation verified',
      saferAlt: 'Enjoy with confidence!',
    },
  };

  const activeDemo = demoScenarios[demoProfile];
  const DemoIcon = activeDemo.icon;

  return (
    <div className="landing-page anim-spring-pop">
      {/* 1. Global Navigation Bar */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand" onClick={() => onNavigate('/')}>
            <div className="brand-dot"></div>
            <span className="brand-name">NutriLens</span>
            <span className="brand-pill">Food Safety</span>
          </div>

          <div className="landing-nav-links">
            <a href="#how-it-works" className="landing-link">How It Works</a>
            <a href="#features" className="landing-link">Features</a>
            <a href="#demo" className="landing-link">Live Demo</a>
            <a href="#trust" className="landing-link">Trust & Safety</a>
          </div>

          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <PillButton
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                onClick={() => onNavigate('/dashboard')}
              >
                Go to Dashboard
              </PillButton>
            ) : (
              <>
                <button
                  type="button"
                  className="landing-signin-btn"
                  onClick={() => onNavigate('/signin')}
                >
                  Sign In
                </button>
                <PillButton
                  variant="primary"
                  size="md"
                  iconRight={ArrowRight}
                  onClick={() => onNavigate('/onboarding')}
                >
                  Get Started
                </PillButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="landing-hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="badge-sparkle" />
            <span>Plain-Language Food Safety Intelligence</span>
          </div>

          <h1 className="hero-main-heading">
            Know exactly what's in your food, <br />
            <span className="hero-highlight">in plain language.</span>
          </h1>

          <p className="hero-subheading">
            Set your personal allergen and health boundaries once. Scan barcodes, snap label
            photos, or search food products for instant, clinically grounded risk verdicts —
            with zero engineering jargon.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <PillButton
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={() => onNavigate('/dashboard')}
              >
                Go to Dashboard
              </PillButton>
            ) : (
              <>
                <PillButton
                  variant="primary"
                  size="lg"
                  iconRight={ArrowRight}
                  onClick={() => onNavigate('/onboarding')}
                >
                  Get Started
                </PillButton>
                <button
                  type="button"
                  className="hero-secondary-btn"
                  onClick={() => onNavigate('/signin')}
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          <div className="hero-trust-chips">
            <span className="trust-chip">🛡️ 9 Major Allergens</span>
            <span className="trust-chip">❤️ Heart & Glucose Checks</span>
            <span className="trust-chip">📷 Instant Barcode & OCR</span>
            <span className="trust-chip">🌱 Verified Safer Alternatives</span>
          </div>
        </div>

        {/* 3. Product Analysis Visual Mockup */}
        <div className="hero-visual-container">
          <div className="interactive-phone-frame">
            <div className="phone-screen-content">
              <div className="phone-camera-header">
                <span className="live-tag">● Live Scan</span>
                <span className="product-tag">Nutella Hazelnut Spread</span>
              </div>

              {/* Sample Result Card */}
              <div className="live-verdict-card verdict-risk">
                <div className="verdict-accent"></div>
                <div className="verdict-card-body">
                  <div className="verdict-status-row">
                    <div className="verdict-icon-bubble">
                      <ShieldAlert size={20} />
                    </div>
                    <span className="verdict-kicker">Food Safety Finding</span>
                  </div>
                  <h3 className="verdict-title">This product may not be safe for you</h3>
                  <p className="verdict-sentence">
                    Contains roasted hazelnuts and skimmed milk powder matching your tree nut profile.
                  </p>
                  <div className="label-clarification">
                    <span>Identified on label: Corylus avellana & Bovine dairy whey</span>
                  </div>
                </div>
              </div>

              {/* Instant Alternative Card */}
              <div className="live-alt-preview">
                <span className="alt-kicker">✨ Verified Safer Alternative:</span>
                <p className="alt-title">SunButter Organic Sunflower Butter (Nut-Free)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Problem Section */}
      <section className="landing-problem-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">The Challenge</span>
          <h2 className="section-title">Food labels are designed for compliance, not clarity.</h2>
          <p className="section-desc">
            Deciphering 40-ingredient lists under supermarket fluorescent lights shouldn't require a biochemistry degree.
          </p>
        </div>

        <div className="problem-grid">
          <Card className="problem-card">
            <div className="problem-icon-wrap red-tone">
              <Eye size={24} />
            </div>
            <h3 className="problem-item-title">Microscopic Print & Aliases</h3>
            <p className="problem-item-text">
              Common allergens hide behind Latin and chemical designations like <em>Arachis hypogaea</em>, <em>casein</em>, or <em>lecithin</em>.
            </p>
          </Card>

          <Card className="problem-card">
            <div className="problem-icon-wrap amber-tone">
              <AlertTriangle size={24} />
            </div>
            <h3 className="problem-item-title">Ambiguous Facility Warnings</h3>
            <p className="problem-item-text">
              "Manufactured in a shared facility" notices are voluntary, confusing, and inconsistent between food manufacturers.
            </p>
          </Card>

          <Card className="problem-card">
            <div className="problem-icon-wrap green-tone">
              <FileText size={24} />
            </div>
            <h3 className="problem-item-title">Technical Jargon Overload</h3>
            <p className="problem-item-text">
              Other scanner apps display raw database codes and confusing severity metrics instead of actionable human advice.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. The NutriLens Difference */}
      <section className="landing-difference-section">
        <div className="difference-banner">
          <div className="difference-left">
            <span className="section-eyebrow light">The NutriLens Difference</span>
            <h2 className="difference-title">Human-first intelligence you can trust at the grocery shelf.</h2>
            <p className="difference-text">
              We translate ingredients and clinical guidelines into plain sentences, always paired with distinct icons for accessibility, and never overclaim coverage for unverified conditions.
            </p>
          </div>
          <div className="difference-metrics">
            <div className="metric-box">
              <span className="metric-number">100%</span>
              <span className="metric-label">Plain Language Sentences</span>
            </div>
            <div className="metric-box">
              <span className="metric-number">9 of 9</span>
              <span className="metric-label">Major Allergens Tracked</span>
            </div>
            <div className="metric-box">
              <span className="metric-number">Dual</span>
              <span className="metric-label">Color + Icon Accessibility</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How It Works */}
      <section id="how-it-works" className="landing-steps-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">Seamless Flow</span>
          <h2 className="section-title">How NutriLens Works in 3 Steps</h2>
          <p className="section-desc">Designed for speed when you're standing in the grocery aisle.</p>
        </div>

        <div className="steps-cards-row">
          <Card className="step-feature-card">
            <div className="step-circle">1</div>
            <h3 className="step-heading">Personalize Profile</h3>
            <p className="step-body">
              Select your allergies and dietary targets in a quick 4-step tap-through flow. Stored privately on your device.
            </p>
          </Card>

          <Card className="step-feature-card">
            <div className="step-circle">2</div>
            <h3 className="step-heading">Scan Barcode or Search</h3>
            <p className="step-body">
              Use our rear-facing barcode camera, snap a label photo, or type any product name directly into the search catalog.
            </p>
          </Card>

          <Card className="step-feature-card">
            <div className="step-circle">3</div>
            <h3 className="step-heading">Plain-Language Verdict</h3>
            <p className="step-body">
              Receive a clear "Looks safe for you" or "This product may not be safe for you" sentence, plus verified safer alternatives.
            </p>
          </Card>
        </div>
      </section>

      {/* 7. Interactive Demonstration Section */}
      <section id="demo" className="landing-demo-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">Interactive Demonstration</span>
          <h2 className="section-title">One product. Completely personalized insights.</h2>
          <p className="section-desc">
            Switch between profiles below to observe how NutriLens dynamically adapts its evaluation for Nutella Hazelnut Cocoa Spread.
          </p>

          <div className="demo-toggle-pills">
            <button
              type="button"
              className={`demo-pill ${demoProfile === 'peanut' ? 'active' : ''}`}
              onClick={() => setDemoProfile('peanut')}
            >
              🥜 Yunus: Nut Allergy
            </button>
            <button
              type="button"
              className={`demo-pill ${demoProfile === 'hypertension' ? 'active' : ''}`}
              onClick={() => setDemoProfile('hypertension')}
            >
              ❤️ Maria: Hypertension
            </button>
            <button
              type="button"
              className={`demo-pill ${demoProfile === 'clean' ? 'active' : ''}`}
              onClick={() => setDemoProfile('clean')}
            >
              🥗 Alex: Baseline Safe
            </button>
          </div>
        </div>

        <div className="demo-display-wrapper">
          <Card className={`interactive-demo-card tone-${activeDemo.verdictTone}`}>
            <div className="demo-card-top">
              <span className="demo-target-badge">{activeDemo.profileName}</span>
              <span className={`demo-verdict-pill ${activeDemo.badgeClass}`}>
                {activeDemo.verdictTone === 'safe' ? 'Looks Safe' : activeDemo.verdictTone === 'caution' ? 'Caution' : 'Risk Found'}
              </span>
            </div>

            <div className="demo-main-body">
              <div className="demo-icon-ring">
                <DemoIcon size={26} />
              </div>
              <div className="demo-text-group">
                <h3 className="demo-verdict-headline">{activeDemo.verdict}</h3>
                <p className="demo-sentence">{activeDemo.finding}</p>
                <div className="demo-scientific-pill">
                  <span>Label Note: {activeDemo.scientific}</span>
                </div>
              </div>
            </div>

            <div className="demo-alt-footer">
              <Sparkles size={16} className="alt-sparkle" />
              <span><strong>Safer Alternative:</strong> {activeDemo.saferAlt}</span>
            </div>
          </Card>
        </div>
      </section>

      {/* 8. Feature Showcase */}
      <section id="features" className="landing-features-grid-section">
        <div className="section-header-centered">
          <span className="section-eyebrow">Comprehensive Toolkit</span>
          <h2 className="section-title">Built for everyday wellness confidence</h2>
        </div>

        <div className="features-bento-grid">
          <Card className="bento-card">
            <div className="bento-icon-box"><ShieldCheck size={24} /></div>
            <h3 className="bento-title">Top 9 Allergens Covered</h3>
            <p className="bento-desc">Complete rules for Peanuts, Milk, Eggs, Wheat, Tree Nuts, Soy, Fish, Shellfish, and Sesame.</p>
          </Card>

          <Card className="bento-card">
            <div className="bento-icon-box"><HeartPulse size={24} /></div>
            <h3 className="bento-title">Cardiovascular & Glucose Alerts</h3>
            <p className="bento-desc">Automatic sodium and sugar thresholds based on AHA and ADA guidelines.</p>
          </Card>

          <Card className="bento-card">
            <div className="bento-icon-box"><ScanLine size={24} /></div>
            <h3 className="bento-title">Resilient Barcode Engine</h3>
            <p className="bento-desc">Exact rear camera mode with 3-tier fallback (Try again, Photo upload, or Manual barcode input).</p>
          </Card>

          <Card className="bento-card">
            <div className="bento-icon-box"><Search size={24} /></div>
            <h3 className="bento-title">Food Name Search</h3>
            <p className="bento-desc">Look up snacks, sauces, and ingredients directly without having the physical package in hand.</p>
          </Card>

          <Card className="bento-card">
            <div className="bento-icon-box"><Sparkles size={24} /></div>
            <h3 className="bento-title">Verified Safer Alternatives</h3>
            <p className="bento-desc">Suggested substitutes only when verified safe; honest empty states when no verified alternative exists.</p>
          </Card>

          <Card className="bento-card">
            <div className="bento-icon-box"><Lock size={24} /></div>
            <h3 className="bento-title">Private on Your Device</h3>
            <p className="bento-desc">Your health conditions and dietary profile stay securely stored on your device without mandatory accounts.</p>
          </Card>
        </div>
      </section>

      {/* 9. Safety & Clinical Trust Section */}
      <section id="trust" className="landing-trust-section">
        <Card className="trust-card">
          <div className="trust-icon-badge">
            <BookOpen size={28} />
          </div>
          <h2 className="trust-heading">Grounded in clinical standards, honest about limits.</h2>
          <p className="trust-desc">
            We ground our rules in established standards from the FDA Food Allergen Labeling Act (FALCPA), the FASTER Act, the American Heart Association (AHA), and the American Diabetes Association (ADA).
          </p>
          <div className="trust-bullets">
            <div className="trust-bullet-item">
              <CheckCircle2 size={18} color="#163A1D" />
              <span>Full deterministic support for Hypertension and Diabetes</span>
            </div>
            <div className="trust-bullet-item">
              <AlertTriangle size={18} color="#452600" />
              <span>Transparent "Limited coverage" disclosure for Chronic Kidney Disease & PCOS</span>
            </div>
            <div className="trust-bullet-item">
              <CheckCircle2 size={18} color="#163A1D" />
              <span>Transparent data quality badges ("Some details might be missing — check physical label")</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 10. Final Call to Action */}
      <section className="landing-final-cta-section">
        <div className="final-cta-card">
          <h2 className="final-cta-title">Ready to take control of what you eat?</h2>
          <p className="final-cta-sub">
            Join thousands making informed, stress-free food decisions every day with NutriLens.
          </p>
          <div className="final-cta-buttons">
            {isAuthenticated ? (
              <PillButton
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={() => onNavigate('/dashboard')}
              >
                Go to Dashboard
              </PillButton>
            ) : (
              <>
                <PillButton
                  variant="primary"
                  size="lg"
                  iconRight={ArrowRight}
                  onClick={() => onNavigate('/onboarding')}
                >
                  Get Started
                </PillButton>
                <button
                  type="button"
                  className="final-signin-link"
                  onClick={() => onNavigate('/signin')}
                >
                  Already have a profile? Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="brand-dot"></div>
            <span className="footer-brand-name">NutriLens</span>
            <p className="footer-tagline">Personalized food safety and plain-language ingredient intelligence.</p>
          </div>
          <div className="footer-disclaimer">
            <p>
              Disclaimer: NutriLens provides nutritional information and allergen screening based on published ingredient statements. It does not constitute professional medical advice, clinical allergy diagnosis, or prescription treatment.
            </p>
            <p className="copyright-text">© {new Date().getFullYear()} NutriLens. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
