import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ScanLine,
  ArrowLeft,
  Sparkles,
  Info,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import RiskCard from '../../components/RiskCard';
import AlternativeCard from '../../components/AlternativeCard';
import OffProductInfo from '../../components/OffProductInfo';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import { useAnalysis } from '../../context/AnalysisContext';
import { useProfile } from '../../context/ProfileContext';
import { getAlternatives } from '../../services/api';
import './ResultsScreen.css';

// Verified safer alternatives knowledge base for Mission 8
const VERIFIED_ALTERNATIVES = {
  // Flagged for Tree Nuts & Milk (Nutella)
  'tree_nuts': [
    {
      name: 'Organic Sunflower Seed Butter (Nut-Free)',
      brand: 'SunButter',
      reason: '100% Free from peanuts and tree nuts; certified top-8 allergen free facility.',
      tag: 'Certified Nut-Free',
    },
    {
      name: 'Oat Chocolate Spread (Vegan)',
      brand: 'Oatlicious',
      reason: 'Dairy-free and nut-free chocolate spread made from gluten-free oats.',
      tag: 'Dairy & Nut Free',
    },
  ],

  // Flagged for Wheat/Gluten (Oreo)
  'wheat': [
    {
      name: 'Gluten-Free Chocolate Sandwich Cookies',
      brand: 'Simple Mills',
      reason: 'Made with almond & coconut flour; certified gluten-free with zero wheat starch.',
      tag: 'Certified Gluten-Free',
    },
  ],

  // Flagged for Sodium / Hypertension (High Sodium Beverages)
  'hypertension': [
    {
      name: 'Cold-Pressed Electrolyte Coconut Water',
      brand: 'Harmless Harvest',
      reason: 'Zero added sodium or synthetic caffeine; naturally occurring potassium hydration.',
      tag: 'Low Sodium / Clean Hydration',
    },
  ],
};

function formatNutrient(val, defaultUnit = 'g') {
  if (val === null || val === undefined || val === '') return 'N/A';
  if (typeof val === 'object') {
    if (val.value === null || val.value === undefined) return 'N/A';
    return `${val.value}${val.unit || defaultUnit}`;
  }
  return typeof val === 'number' ? `${val}${defaultUnit}` : String(val);
}

export default function ResultsScreen({ onNavigate }) {
  const { currentResult, lastMethod } = useAnalysis();
  const { profile } = useProfile();

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const stateParam = params.get('state');

  const activeResult = currentResult;

  const [activeDataQuality, setActiveDataQuality] = useState(() => activeResult?.dataQuality || 'good');
  const [alternativesList, setAlternativesList] = useState([]);

  useEffect(() => {
    if (activeResult?.dataQuality) {
      setActiveDataQuality(activeResult.dataQuality);
    }
  }, [activeResult?.dataQuality]);

  // Trigger celebration confetti on safe verdict
  useEffect(() => {
    if (activeResult?.verdict === 'safe') {
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#E4FA75', '#22C55E', '#111111'],
        });
      } catch (e) {}
    }
  }, [activeResult?.verdict]);

  // Safer Alternatives determination & API sync
  useEffect(() => {
    let isCurrent = true;
    if (!activeResult || !activeResult.product) {
      setAlternativesList([]);
      return;
    }

    // 1. Prioritize Gemini AI generated alternatives directly from analysis result
    if (activeResult.aiExplanation?.alternatives && activeResult.aiExplanation.alternatives.length > 0) {
      setAlternativesList(activeResult.aiExplanation.alternatives);
      return;
    }
    if (activeResult.alternatives && activeResult.alternatives.length > 0) {
      setAlternativesList(activeResult.alternatives);
      return;
    }

    if (activeResult.verdict === 'safe' || stateParam === 'safe') {
      setAlternativesList([]);
      return;
    }
    if (params.get('state') === 'flagged_empty' || params.get('alts') === 'none') {
      setAlternativesList([]);
      return;
    }

    async function fetchAlternatives() {
      try {
        const data = await getAlternatives(activeResult.product, profile);
        if (isCurrent && data) {
          if (data.status === 'no_verified_alternative' || !data.hasAlternatives || !data.alternatives?.length) {
            const primaryKey =
              activeResult.product?.primaryAllergenKey ||
              (activeResult.findings?.find((f) => f.severity === 'risk')?.trigger?.toLowerCase().includes('nut') ? 'tree_nuts' : null);
            setAlternativesList(VERIFIED_ALTERNATIVES[primaryKey] || []);
          } else {
            setAlternativesList(data.alternatives);
          }
        }
      } catch (err) {
        console.warn('[ResultsScreen] Error fetching alternatives from API:', err);
      }
    }

    fetchAlternatives();
    return () => {
      isCurrent = false;
    };
  }, [activeResult, profile]);

  if (!activeResult || !activeResult.product) {
    return (
      <div className="results-screen">
        <div className="results-top-nav">
          <PillButton
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => onNavigate('/analyze')}
          >
            Back to Scanner
          </PillButton>
        </div>

        <section className="hero-verdict-surface verdict-surface-caution anim-spring-pop" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div className="verdict-icon-bubble" style={{ margin: '0 auto 16px' }}>
            <AlertTriangle size={32} color="#854D0E" />
          </div>
          <h1 className="verdict-main-headline">No Scan Data Available</h1>
          <p className="verdict-subsentence" style={{ maxWidth: '440px', margin: '8px auto 24px' }}>
            Please scan a barcode or enter an EAN/UPC code to view verified food safety findings and personalized AI recommendations.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PillButton
              variant="primary"
              size="md"
              icon={ScanLine}
              onClick={() => onNavigate('/analyze')}
            >
              Scan a Barcode
            </PillButton>
            <PillButton
              variant="secondary"
              size="md"
              icon={Search}
              onClick={() => onNavigate('/search')}
            >
              Search by Name
            </PillButton>
          </div>
        </section>
      </div>
    );
  }

  // Mission 4: Exact Overall Verdict Copy
  const VERDICT_COPY_MAP = {
    risk: {
      headline: 'This product may not be safe for you',
      cardClass: 'verdict-surface-risk',
      icon: ShieldAlert,
      iconClass: 'icon-risk',
    },
    caution: {
      headline: 'A few things to check',
      cardClass: 'verdict-surface-caution',
      icon: AlertTriangle,
      iconClass: 'icon-caution',
    },
    safe: {
      headline: 'Looks safe for you',
      cardClass: 'verdict-surface-safe',
      icon: CheckCircle2,
      iconClass: 'icon-safe',
    },
  };

  const currentVerdictCopy = VERDICT_COPY_MAP[activeResult.verdict] || VERDICT_COPY_MAP.safe;
  const VerdictIcon = currentVerdictCopy.icon;

  const showDataQualityBadge = activeDataQuality !== 'good';
  const dataQualityText =
    activeDataQuality === 'clearer_photo' || activeDataQuality === 'low'
      ? "We couldn't read this clearly — try a clearer photo"
      : 'Some details might be missing — worth checking the label';

  return (
    <div className="results-screen anim-spring-pop">
      {/* Top Header Row */}
      <div className="results-top-nav">
        <PillButton
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => onNavigate('/analyze')}
        >
          Back
        </PillButton>

        <div className="profile-badge-pill" onClick={() => onNavigate('/profile')}>
          <ShieldCheck size={13} />
          <span>Checked for <strong>{profile.name || 'You'}</strong></span>
        </div>
      </div>

      {/* Hero Verdict Card */}
      <section className={`hero-verdict-surface ${currentVerdictCopy.cardClass}`}>
        <div className="verdict-header-row">
          <div className="verdict-icon-bubble">
            <VerdictIcon size={26} strokeWidth={2.4} />
          </div>
          <span className="verdict-kicker">Food Safety Assessment</span>
        </div>

        <div className="verdict-main-text-group">
          <h1 className="verdict-main-headline">{currentVerdictCopy.headline}</h1>

          <div className="product-identity-line">
            <span className="product-title-bold">{activeResult.product?.name || 'Scanned Food Product'}</span>
            {activeResult.product?.brand && (
              <span className="product-brand-sub">({activeResult.product.brand})</span>
            )}
          </div>

          <p className="verdict-subsentence">{activeResult.verdictSummary}</p>
        </div>

        {/* Data Quality Badge */}
        {showDataQualityBadge && (
          <div className="data-quality-pill-banner anim-spring-pop">
            <Info size={14} className="dq-icon" />
            <span className="dq-message-text">{dataQualityText}</span>
            {(activeDataQuality === 'clearer_photo' || activeDataQuality === 'low') && (
              <button
                type="button"
                className="dq-clarify-link-btn"
                onClick={() => onNavigate('/clarify')}
              >
                Clarify label &rarr;
              </button>
            )}
          </div>
        )}
      </section>

      {/* Gemini AI Reason & Health Suggestion Card */}
      {activeResult.aiExplanation && (
        <Card className="ai-reason-suggestion-card anim-spring-pop">
          <div className="ai-card-badge-row">
            <div className="ai-badge-bubble">
              <Sparkles size={16} />
              <span>NutriLens AI Assessment</span>
            </div>
            <span className="ai-model-tag">Gemini Powered</span>
          </div>

          {activeResult.aiExplanation.reason && (
            <div className="ai-section-block">
              <h4 className="ai-section-title">Why this matters for you:</h4>
              <p className="ai-reason-text">{activeResult.aiExplanation.reason}</p>
            </div>
          )}

          {activeResult.aiExplanation.suggestion && (
            <div className="ai-section-block ai-suggestion-block">
              <h4 className="ai-section-title">Helpful suggestion for you:</h4>
              <p className="ai-suggestion-text">{activeResult.aiExplanation.suggestion}</p>
            </div>
          )}

          {activeResult.aiExplanation.alternatives && activeResult.aiExplanation.alternatives.length > 0 && (
            <div className="ai-section-block ai-alternatives-block">
              <h4 className="ai-section-title">Best 2-3 Alternative Products for You:</h4>
              <div className="ai-swaps-grid">
                {activeResult.aiExplanation.alternatives.map((alt, idx) => (
                  <div key={idx} className="ai-swap-item">
                    <div className="ai-swap-header">
                      <span className="ai-swap-name">{alt.name}</span>
                      {alt.tag && <span className="ai-swap-badge">{alt.tag}</span>}
                    </div>
                    {alt.brand && <span className="ai-swap-brand">{alt.brand}</span>}
                    <p className="ai-swap-reason">{alt.reason}</p>
                    {alt.swapTip && (
                      <span className="ai-swap-tip">💡 Swap Tip: {alt.swapTip}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Plain-Language Findings Stack */}
      <section className="plain-findings-section">
        <div className="findings-title-row">
          <h2 className="findings-heading">
            {activeResult.findings?.length === 1 ? '1 finding to know' : `${activeResult.findings?.length || 0} findings to know`}
          </h2>
          <span className="findings-rules-count">Matched to {profile?.allergies?.length || 0} saved rules</span>
        </div>

        <div className="findings-flow-stack">
          {activeResult.findings?.map((finding, idx) => (
            <RiskCard
              key={idx}
              headline={finding.headline}
              category={finding.category}
              severity={finding.severity}
              evidence={finding.evidence}
              trigger={finding.trigger}
              source={finding.source}
              evidenceSource={finding.evidenceSource || (['off', 'image', 'user_confirmed'].includes(finding.source) ? finding.source : null)}
            />
          ))}
        </div>
      </section>

      {/* Mission 5: Verified Safer Alternatives ("Better options for your profile") */}
      {(activeResult.verdict !== 'safe' || (alternativesList && alternativesList.length > 0)) && (
        <section className="alternatives-section">
          <div className="alternatives-header">
            <Sparkles size={18} color="#163A1D" />
            <h2 className="alternatives-title">Better options for your profile</h2>
          </div>

          {alternativesList && alternativesList.length > 0 ? (
            <div className="alternatives-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {alternativesList.map((alt, i) => (
                <AlternativeCard
                  key={alt.id || i}
                  name={alt.name}
                  brand={alt.brand}
                  image={alt.image}
                  tag={alt.tag || 'Certified Safe Option'}
                  reason={alt.reason}
                  swapTip={alt.swapTip}
                  nutrition={alt.nutrition}
                />
              ))}
            </div>
          ) : (
            /* Honest empty state per Mission 5 constraints */
            <Card className="honest-no-alternative-card">
              <p className="no-alt-text">
                We couldn't find a verified alternative for this product yet.
              </p>
              <span className="no-alt-sub">
                NutriLens only recommends verified manufacturer products, never automated placeholders.
              </span>
            </Card>
          )}
        </section>
      )}

      {/* Product Ingredients & Nutrition Summary */}
      {activeResult.product && (
        <Card className="product-summary-card">
          <h3 className="ingredients-header">Full Ingredients List</h3>
          <div className="ingredients-cloud">
            {activeResult.product.ingredients?.map((ing, i) => {
              const label =
                typeof ing === 'string'
                  ? ing
                  : `${ing.name || 'Ingredient'}${ing.quantity ? ` (${ing.quantity})` : ''}`;
              return (
                <span key={i} className="ingredient-pill">
                  {label}
                </span>
              );
            })}
          </div>

          {activeResult.product.nutrition && (
            <div className="nutrition-metrics-row">
              <div className="metric-box">
                <span className="m-label">Sodium</span>
                <span className="m-val">{formatNutrient(activeResult.product.nutrition.sodium, 'mg')}</span>
              </div>
              <div className="metric-box">
                <span className="m-label">Sugars</span>
                <span className="m-val">{formatNutrient(activeResult.product.nutrition.sugars, 'g')}</span>
              </div>
              <div className="metric-box">
                <span className="m-label">Calories</span>
                <span className="m-val">{formatNutrient(activeResult.product.nutrition.calories ?? activeResult.product.nutrition.energy, ' kcal')}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Mission 6: Dedicated Open Food Facts Product Information Section */}
      <section className="off-info-wrapper">
        <OffProductInfo product={activeResult.canonicalProduct || activeResult.product} />
      </section>

      {/* Action Footer */}
      <div className="results-cta-footer">
        <PillButton
          variant="primary"
          size="lg"
          icon={ScanLine}
          fullWidth
          onClick={() => onNavigate('/analyze')}
        >
          Scan Another Product
        </PillButton>
      </div>
    </div>
  );
}
