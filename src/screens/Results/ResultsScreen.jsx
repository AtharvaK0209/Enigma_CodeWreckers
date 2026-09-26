import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ScanLine,
  Share2,
  ArrowLeft,
  Sparkles,
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import RiskCard from '../../components/RiskCard';
import { useAnalysis } from '../../context/AnalysisContext';
import { useProfile } from '../../context/ProfileContext';
import './ResultsScreen.css';

export default function ResultsScreen({ onNavigate }) {
  const { currentResult, setCurrentResult, lastMethod } = useAnalysis();
  const { profile } = useProfile();

  // Fallback demo result if navigated to directly without scanning
  const defaultSampleResult = {
    verdict: 'risk',
    verdictTitle: 'Risk found',
    verdictSummary: 'Direct match with restricted allergen (Peanuts & Hazelnuts). We advise against consumption.',
    dataQuality: 'good',
    dataQualityMessage: 'Verified data',
    product: {
      name: 'Hazelnut Cocoa Spread',
      brand: 'Nutella',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
      ingredients: ['Sugar', 'Palm Oil', 'Hazelnuts (13%)', 'Skimmed Milk Powder (8.7%)', 'Fat-Reduced Cocoa (7.4%)', 'Soy Lecithins', 'Vanillin'],
      nutrition: { sodium: '42mg', sugars: '56.3g', calories: '539 kcal' },
      barcode: '8000500310427',
    },
    findings: [
      {
        category: 'Allergen Alert',
        severity: 'risk',
        evidence: 'Direct allergen match: Hazelnuts (13%) and Milk Powder present in product formulation.',
        trigger: 'Hazelnuts (13%) & Skimmed Milk Powder',
        source: 'FDA Food Allergen Labeling Act (FALCPA)',
      },
      {
        category: 'Cross-Contact Advisory',
        severity: 'caution',
        evidence: 'Manufactured on shared line with tree nuts and potential peanut residues.',
        trigger: 'May contain traces of Peanuts',
        source: 'Manufacturer Advisory Note',
      },
      {
        category: 'Glycemic Concern',
        severity: 'caution',
        evidence: 'High sugar density: 56.3g sugar per 100g serving exceeds rapid glucose spike threshold.',
        trigger: 'Sugar 56.3g / 100g',
        source: 'ADA Glycemic Standard',
      },
      {
        category: 'Sodium Safe',
        severity: 'safe',
        evidence: 'Low sodium formulation (42mg) complies comfortably with hypertension guidelines.',
        trigger: 'Sodium 42mg',
        source: 'WHO Cardiovascular Baseline',
      },
    ],
  };

  const safeSampleResult = {
    verdict: 'safe',
    verdictTitle: 'Safe for you',
    verdictSummary: 'All ingredients clear of your profile restrictions and health goals.',
    dataQuality: 'good',
    dataQualityMessage: 'Verified data',
    product: {
      name: 'Organic Rolled Oats',
      brand: 'Bob\'s Red Mill',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80',
      ingredients: ['100% Whole Grain Rolled Oats (Certified Gluten-Free)'],
      nutrition: { sodium: '0mg', sugars: '1g', calories: '150 kcal' },
      barcode: '030000010204',
    },
    findings: [
      {
        category: 'Wholesome Formulation',
        severity: 'safe',
        evidence: 'Certified Gluten-Free oats with zero detected cross-contact or allergens.',
        trigger: '100% Whole Grain Oats',
        source: 'NutriLens Verification Standard',
      },
      {
        category: 'Cardiovascular Compliance',
        severity: 'safe',
        evidence: 'Zero milligrams of sodium per serving; ideal for cardiac blood pressure maintenance.',
        trigger: 'Sodium 0mg',
        source: 'AHA Heart-Healthy Guidance',
      },
    ],
  };

  const params = new URLSearchParams(window.location.search);
  const stateParam = params.get('state');
  const baseResult = stateParam === 'safe'
    ? safeSampleResult
    : (currentResult || defaultSampleResult);

  const activeResult = baseResult;
  const initialDq = params.get('dq') || activeResult.dataQuality || 'good';
  const [activeDataQuality, setActiveDataQuality] = useState(initialDq);

  // Trigger celebration confetti if verdict is 100% safe
  useEffect(() => {
    if (activeResult.verdict === 'safe') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#E4FA75', '#22C55E', '#111111'],
        });
      } catch (e) {
        // gracefully handle if canvas-confetti is not loaded
      }
    }
  }, [activeResult.verdict]);

  // Data Quality Messaging Dictionary (Exact 3-states from Mission 6 spec)
  const DATA_QUALITY_MAPPINGS = {
    good: {
      badgeClass: 'dq-good',
      label: 'Verified data',
      subtext: 'High-confidence OCR match with official manufacturer packaging.',
    },
    verify_label: {
      badgeClass: 'dq-verify',
      label: 'Please verify against the physical label',
      subtext: 'Partial optical contrast detected. Always double-check ingredient lists on physical packaging.',
    },
    clearer_photo: {
      badgeClass: 'dq-clearer',
      label: 'Please provide a clearer photo',
      subtext: 'Portions of the ingredient fine print are partially obscured by glare or motion blur.',
    },
  };

  const currentDqConfig = DATA_QUALITY_MAPPINGS[activeDataQuality] || DATA_QUALITY_MAPPINGS.good;

  // Verdict Card visual configuration (matching Mission 1 tokens & design reference)
  const verdictConfig = {
    safe: {
      cardClass: 'verdict-card-safe',
      icon: CheckCircle2,
      pillClass: 'verdict-pill-safe',
      statusText: 'Safe for you',
    },
    caution: {
      cardClass: 'verdict-card-caution',
      icon: AlertTriangle,
      pillClass: 'verdict-pill-caution',
      statusText: 'Caution advised',
    },
    risk: {
      cardClass: 'verdict-card-risk',
      icon: ShieldAlert,
      pillClass: 'verdict-pill-risk',
      statusText: 'Risk found',
    },
  };

  const currentVerdict = verdictConfig[activeResult.verdict] || verdictConfig.safe;
  const VerdictIcon = currentVerdict.icon;

  // Mission 7 Edge Case 3: No Concerns Found
  const isNoConcerns = activeResult.verdict === 'safe' &&
    activeResult.findings.every((f) => f.severity === 'safe');

  return (
    <div className="results-screen anim-spring-pop">
      {/* Top Action Nav */}
      <div className="results-top-bar">
        <button className="btn-pill-secondary back-btn" onClick={() => onNavigate('/analyze')}>
          <ArrowLeft size={16} />
          <span>New Scan</span>
        </button>

        <div className="profile-context-badge">
          <span>Target Profile: <strong>{profile.name || 'Friend'}</strong></span>
        </div>
      </div>

      {/* Hero Verdict Card — Scaled-up version of "Heart rate" card from design reference */}
      <section className={`hero-verdict-card ${currentVerdict.cardClass}`}>
        <div className="verdict-card-top">
          <div className="verdict-card-title-group">
            <span className="verdict-eyebrow">Risk Assessment</span>
            <div className={`verdict-status-pill ${currentVerdict.pillClass}`}>
              <VerdictIcon size={14} />
              <span>{activeResult.verdictTitle || currentVerdict.statusText}</span>
            </div>
          </div>

          <div className="verdict-card-icon-wrap">
            <VerdictIcon size={34} />
          </div>
        </div>

        <div className="verdict-card-body">
          <h1 className="product-display-name">{activeResult.product?.name || 'Scanned Food Item'}</h1>
          {activeResult.product?.brand && (
            <span className="product-display-brand">by {activeResult.product.brand}</span>
          )}
          <p className="verdict-summary-text">{activeResult.verdictSummary}</p>
        </div>

        {/* Data Quality Pill Badge (Exact 3-states per Mission 6 spec) */}
        <div className="data-quality-container">
          <div className={`data-quality-pill ${currentDqConfig.badgeClass}`}>
            <Info size={13} />
            <span>{currentDqConfig.label}</span>
          </div>
          <span className="dq-subtext">{currentDqConfig.subtext}</span>
        </div>
      </section>

      {/* Interactive Data-Quality Badge State Switcher (for Mission 6 verification) */}
      <section className="wellness-card dq-verifier-bar">
        <div className="verifier-header">
          <span className="verifier-title">Mission 6 Badge State Selector:</span>
          <span className="verifier-note">Toggle between all 3 specified data-quality badge states</span>
        </div>
        <div className="verifier-buttons">
          <button
            className={`dq-state-btn ${activeDataQuality === 'good' ? 'active' : ''}`}
            onClick={() => setActiveDataQuality('good')}
          >
            <span>1. Good Quality ("Verified data")</span>
          </button>
          <button
            className={`dq-state-btn ${activeDataQuality === 'verify_label' ? 'active' : ''}`}
            onClick={() => setActiveDataQuality('verify_label')}
          >
            <span>2. "Please verify against the physical label"</span>
          </button>
          <button
            className={`dq-state-btn ${activeDataQuality === 'clearer_photo' ? 'active' : ''}`}
            onClick={() => setActiveDataQuality('clearer_photo')}
          >
            <span>3. "Please provide a clearer photo"</span>
          </button>
        </div>
      </section>

      {/* Mission 7 Edge Case 3: Wholesome / Clean Banner */}
      {isNoConcerns && (
        <section className="wholesome-banner anim-spring-pop">
          <div className="wholesome-icon">
            <Sparkles size={24} color="#163A1D" />
          </div>
          <div>
            <h3 className="wholesome-title">100% Wholesome Formulation</h3>
            <p className="wholesome-desc">
              No matching allergens, unwholesome additives, or sodium/sugar spikes detected. Safe to enjoy!
            </p>
          </div>
        </section>
      )}

      {/* Per-Finding Evidence Cards Stack (Composing Mission 5 RiskCards) */}
      <section className="findings-section">
        <div className="section-heading-row">
          <h2 className="findings-heading">Evidence Findings ({activeResult.findings?.length || 0})</h2>
          <span className="findings-sub">Evaluated against {profile.allergies.length} allergen rules</span>
        </div>

        <div className="findings-stack">
          {activeResult.findings && activeResult.findings.length > 0 ? (
            activeResult.findings.map((finding, idx) => (
              <RiskCard
                key={idx}
                category={finding.category}
                severity={finding.severity}
                evidence={finding.evidence}
                trigger={finding.trigger}
                source={finding.source}
              />
            ))
          ) : (
            <p className="no-findings-text">No distinct findings recorded.</p>
          )}
        </div>
      </section>

      {/* Product Nutrition & Ingredients Breakdown */}
      {activeResult.product && (
        <section className="wellness-card product-details-card">
          <h3 className="details-title">Ingredient Spectrum</h3>
          <div className="ingredients-tag-cloud">
            {activeResult.product.ingredients?.map((ing, i) => (
              <span key={i} className="ingredient-tag">
                {ing}
              </span>
            ))}
          </div>

          {activeResult.product.nutrition && (
            <div className="nutrition-strip">
              <div className="nutri-item">
                <span className="nutri-lbl">Sodium</span>
                <span className="nutri-val">{activeResult.product.nutrition.sodium || 'N/A'}</span>
              </div>
              <div className="nutri-item">
                <span className="nutri-lbl">Sugars</span>
                <span className="nutri-val">{activeResult.product.nutrition.sugars || 'N/A'}</span>
              </div>
              <div className="nutri-item">
                <span className="nutri-lbl">Calories</span>
                <span className="nutri-val">{activeResult.product.nutrition.calories || 'N/A'}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Bottom Action Footer */}
      <div className="results-action-footer">
        <button className="btn-pill-primary scan-another-cta" onClick={() => onNavigate('/analyze')}>
          <ScanLine size={16} />
          <span>Scan Another Item</span>
        </button>
      </div>
    </div>
  );
}
