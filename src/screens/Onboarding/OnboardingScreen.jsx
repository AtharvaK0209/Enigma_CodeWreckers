import React, { useState } from 'react';
import {
  Nut,
  Milk,
  Egg,
  Wheat,
  Trees,
  Bean,
  Fish,
  Shrimp,
  Sparkles,
  HeartPulse,
  Activity,
  ShieldAlert,
  Sparkle,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  ShieldCheck,
  Ban,
  User,
  Calendar,
  X
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { THEME } from '../../styles/tokens';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import IconTile from '../../components/common/IconTile';
import './OnboardingScreen.css';

// Allergen Icon Map
const ALLERGEN_ICONS = {
  Nut,
  Milk,
  Egg,
  Wheat,
  Trees,
  Bean,
  Fish,
  Shrimp,
  Sparkles,
};

// Condition Icon Map
const CONDITION_ICONS = {
  HeartPulse,
  Activity,
  ShieldAlert,
  Sparkle,
};

export default function OnboardingScreen({ onNavigate, initialStep = 0 }) {
  const {
    profile,
    setName,
    setAge,
    toggleAllergy,
    addCustomAllergen,
    removeCustomAllergen,
    toggleCondition,
    completeOnboarding,
  } = useProfile();

  const urlParams = new URLSearchParams(window.location.search);
  const paramStep = urlParams.get('step');
  const paramOther = urlParams.get('other');

  const [step, setStep] = useState(() => {
    if (paramStep !== null) return parseInt(paramStep, 10);
    return initialStep;
  });
  const [customInput, setCustomInput] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(paramOther === '1' || paramOther === 'true');

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      completeOnboarding();
      onNavigate('/');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      addCustomAllergen(customInput.trim());
      setCustomInput('');
      setShowOtherInput(false);
    }
  };

  return (
    <div className="onboarding-flow-screen anim-spring-pop">
      {/* Progress Stepper (Steps 1 through 4) */}
      {step > 0 && (
        <header className="onboarding-progress-bar">
          <div className="progress-top-row">
            <button
              type="button"
              className="step-back-btn"
              onClick={handleBack}
              aria-label="Previous Step"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <span className="step-counter">Step {step} of 4</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </header>
      )}

      {/* ======================================================== */}
      {/* STEP 0: Welcome / Landing Page                          */}
      {/* ======================================================== */}
      {step === 0 && (
        <section className="onboarding-step step-welcome">
          <div className="welcome-hero-card">
            <div className="welcome-brand-badge">
              <div className="pulse-dot"></div>
              <span>NutriLens SafeEats</span>
            </div>

            <h1 className="welcome-main-title">
              Safe choices, made simple.
            </h1>

            <p className="welcome-main-subtext">
              Set your personal allergy and health boundaries once. Scan any packaged food
              barcode or photograph the label for instant, plain-language risk evaluations.
            </p>

            <div className="welcome-feature-pills">
              <span className="feature-chip">🛡️ 9 Major Allergens</span>
              <span className="feature-chip">❤️ Heart & Glucose Checks</span>
              <span className="feature-chip">📷 Instant Barcode & OCR</span>
            </div>

            <div className="welcome-actions">
              <PillButton
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={handleNext}
                fullWidth
              >
                Get Started
              </PillButton>
              <span className="welcome-privacy-note">
                No account required — profile data lives privately on your device.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* STEP 1: Name + Age Intake                                */}
      {/* ======================================================== */}
      {step === 1 && (
        <section className="onboarding-step step-name-age">
          <div className="step-header">
            <span className="step-eyebrow">Personal Details</span>
            <h1 className="step-heading">What should we call you?</h1>
            <p className="step-sub">
              Your name personalizes your food warnings and dashboard greetings.
            </p>
          </div>

          <Card className="intake-form-card">
            <div className="form-field-group">
              <label className="field-lbl">Your Name</label>
              <div className="input-with-icon">
                <User size={18} className="field-glyph" />
                <input
                  type="text"
                  className="modern-text-input"
                  placeholder="e.g. Yunus, Alex, Sam..."
                  value={profile.name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-lbl">Age (Optional)</label>
              <div className="input-with-icon">
                <Calendar size={18} className="field-glyph" />
                <input
                  type="number"
                  className="modern-text-input"
                  placeholder="e.g. 24"
                  value={profile.age || ''}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="120"
                />
              </div>
              <span className="field-hint">
                Helps refine daily sodium and sugar thresholds.
              </span>
            </div>
          </Card>

          <div className="step-footer-actions">
            <PillButton
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={handleNext}
              fullWidth
            >
              Continue to Allergens
            </PillButton>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* STEP 2: 9 Major Allergens + Other Custom Intake          */}
      {/* ======================================================== */}
      {step === 2 && (
        <section className="onboarding-step step-allergens">
          <div className="step-header">
            <span className="step-eyebrow">Allergen Safety</span>
            <h1 className="step-heading">Any food allergies?</h1>
            <p className="step-sub">
              Tap any ingredients that trigger allergic reactions. NutriLens will flag these
              with high-priority warnings.
            </p>
          </div>

          <div className="allergens-tiles-grid">
            {THEME.allergens.map((alg) => {
              const Icon = ALLERGEN_ICONS[alg.icon] || Sparkles;
              const isSelected = profile.allergies.includes(alg.id);
              return (
                <IconTile
                  key={alg.id}
                  icon={Icon}
                  label={alg.label}
                  desc={alg.desc}
                  selected={isSelected}
                  selectionTone="risk"
                  onToggle={() => toggleAllergy(alg.id)}
                />
              );
            })}

            {/* Custom / User-added Allergens */}
            {profile.customAllergens.map((custom) => {
              const isSelected = profile.allergies.includes(custom.id);
              return (
                <div key={custom.id} className="custom-tile-wrapper">
                  <IconTile
                    icon={Sparkles}
                    label={`Custom: ${custom.label}`}
                    desc="User-defined custom allergen"
                    selected={isSelected}
                    limitedCoverage={true}
                    limitedNote={custom.limitedNote}
                    selectionTone="risk"
                    onToggle={() => toggleAllergy(custom.id)}
                  />
                  <button
                    type="button"
                    className="remove-custom-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomAllergen(custom.id);
                    }}
                    title="Remove custom allergen"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}

            {/* "Other" Option Tile */}
            <div
              className={`nutri-icon-tile tile-other-trigger ${showOtherInput ? 'other-active' : ''}`}
              onClick={() => setShowOtherInput(true)}
              role="button"
              tabIndex={0}
            >
              <div className="tile-top-row">
                <div className="tile-icon-bubble">
                  <Plus size={22} />
                </div>
                <span className="limited-coverage-badge">Custom</span>
              </div>
              <div className="tile-body">
                <h3 className="tile-label">Other Allergen</h3>
                <p className="tile-desc">Add an ingredient not listed above (e.g. Mustard, Kiwi)</p>
              </div>
            </div>
          </div>

          {/* Inline Text Entry for "Other" Allergen with Honest Limitation Notice */}
          {showOtherInput && (
            <Card className="custom-allergen-drawer anim-spring-pop">
              <div className="drawer-header">
                <h3 className="drawer-title">Add Custom Allergen</h3>
                <button
                  type="button"
                  className="close-drawer-btn"
                  onClick={() => setShowOtherInput(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCustom} className="custom-input-form">
                <input
                  type="text"
                  className="custom-text-field"
                  placeholder="e.g. Strawberries, Celery, Mustard..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  autoFocus
                />
                <PillButton type="submit" variant="primary" size="md">
                  Add
                </PillButton>
              </form>

              {/* Honest trust notice required by Mission 5 */}
              <div className="trust-coverage-notice">
                <span className="notice-icon">⚠️</span>
                <p className="notice-text">
                  <strong>Limited coverage notice:</strong> Custom allergens use keyword matching,
                  which may not catch complex chemical derivatives or uncommon scientific names.
                </p>
              </div>
            </Card>
          )}

          <div className="step-footer-actions">
            <PillButton
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={handleNext}
              fullWidth
            >
              Continue to Conditions
            </PillButton>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* STEP 3: Health Conditions Intake                         */}
      {/* ======================================================== */}
      {step === 3 && (
        <section className="onboarding-step step-conditions">
          <div className="step-header">
            <span className="step-eyebrow">Health & Nutrition</span>
            <h1 className="step-heading">Any dietary conditions?</h1>
            <p className="step-sub">
              We monitor nutrients like sodium and sugar against established clinical guidelines.
            </p>
          </div>

          <div className="conditions-tiles-grid">
            {THEME.conditions.map((cond) => {
              const Icon = CONDITION_ICONS[cond.icon] || Activity;
              const isSelected = profile.conditions.includes(cond.id);
              return (
                <IconTile
                  key={cond.id}
                  icon={Icon}
                  label={cond.label}
                  desc={cond.desc}
                  selected={isSelected}
                  limitedCoverage={!cond.isFullySupported}
                  limitedNote={cond.limitedNote}
                  selectionTone="caution"
                  onToggle={() => toggleCondition(cond.id)}
                />
              );
            })}

            {/* "None of these" Tile */}
            <IconTile
              icon={Ban}
              label="None of these"
              desc="I do not have specific dietary condition requirements"
              selected={profile.conditions.length === 0}
              selectionTone="caution"
              onToggle={() => toggleCondition('none')}
            />
          </div>

          <div className="step-footer-actions">
            <PillButton
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={handleNext}
              fullWidth
            >
              Review My Profile
            </PillButton>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* STEP 4: "You're All Set" Summary Screen                 */}
      {/* ======================================================== */}
      {step === 4 && (
        <section className="onboarding-step step-summary">
          <div className="summary-header">
            <div className="summary-check-bubble">
              <CheckCircle2 size={36} color="#153C19" />
            </div>
            <h1 className="summary-title">You're all set, {profile.name || 'Friend'}!</h1>
            <p className="summary-subtitle">
              Your safety profile is configured and ready to inspect foods.
            </p>
          </div>

          <Card className="summary-details-card">
            <div className="summary-section">
              <span className="summary-section-lbl">Active Allergens ({profile.allergies.length})</span>
              {profile.allergies.length > 0 ? (
                <div className="summary-chips-wrap">
                  {profile.allergies.map((algId) => {
                    const preset = THEME.allergens.find((a) => a.id === algId);
                    const custom = profile.customAllergens.find((a) => a.id === algId);
                    const label = preset?.label || custom?.label || algId;
                    const isCustom = Boolean(custom);

                    return (
                      <span key={algId} className={`summary-chip ${isCustom ? 'custom-chip' : ''}`}>
                        {label}
                        {isCustom && <span className="chip-limited-tag">Limited</span>}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="summary-none">No allergens selected</span>
              )}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-section">
              <span className="summary-section-lbl">Monitored Conditions ({profile.conditions.length})</span>
              {profile.conditions.length > 0 ? (
                <div className="summary-chips-wrap">
                  {profile.conditions.map((condId) => {
                    const cond = THEME.conditions.find((c) => c.id === condId);
                    return (
                      <span key={condId} className={`summary-chip condition-chip ${!cond?.isFullySupported ? 'limited-condition-chip' : ''}`}>
                        {cond?.label || condId}
                        {!cond?.isFullySupported && <span className="chip-limited-tag">Limited</span>}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="summary-none">No dietary conditions tracked</span>
              )}
            </div>
          </Card>

          <div className="step-footer-actions">
            <PillButton
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={handleNext}
              fullWidth
            >
              Go to Dashboard
            </PillButton>
          </div>
        </section>
      )}
    </div>
  );
}
