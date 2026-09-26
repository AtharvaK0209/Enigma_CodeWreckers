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
  Check,
  CheckCircle2,
  ShieldCheck,
  Ban,
  User,
  Calendar,
  X,
  Edit2
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { THEME } from '../../styles/tokens';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
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

export default function OnboardingScreen({ onNavigate, initialStep = 1 }) {
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
    if (paramStep !== null) {
      const parsed = parseInt(paramStep, 10);
      return parsed >= 1 && parsed <= 4 ? parsed : 1;
    }
    return initialStep;
  });

  const [customInput, setCustomInput] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(paramOther === '1' || paramOther === 'true');
  const [validationError, setValidationError] = useState('');

  const handleNext = () => {
    setValidationError('');
    if (step === 1) {
      if (!profile.name?.trim()) {
        setValidationError('Please enter your name to continue.');
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 3) {
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 4) {
      completeOnboarding();
      onNavigate('/dashboard');
    }
  };

  const handleBack = () => {
    setValidationError('');
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNavigate('/');
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
      {/* Top Header with Progress Indicator (Steps 1 to 4) */}
      <header className="onboarding-progress-bar">
        <div className="progress-top-row">
          <button
            type="button"
            className="step-back-btn"
            onClick={handleBack}
            aria-label="Previous Step"
          >
            <ArrowLeft size={16} />
            <span>{step === 1 ? 'Home' : 'Back'}</span>
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

      {/* ======================================================== */}
      {/* STEP 1: Basic Information                                */}
      {/* ======================================================== */}
      {step === 1 && (
        <section className="onboarding-step step-name-age anim-spring-pop">
          <div className="step-header">
            <span className="step-eyebrow">Personal Information</span>
            <h1 className="step-heading">Let's personalize NutriLens.</h1>
            <p className="step-sub">
              Tell us a little about yourself so we can make your food insights more relevant.
            </p>
          </div>

          <Card className="intake-form-card">
            {validationError && (
              <div className="validation-error-msg">
                <span>{validationError}</span>
              </div>
            )}

            <div className="form-field-group">
              <label className="field-lbl">Name</label>
              <div className="input-with-icon">
                <User size={18} className="field-glyph" />
                <input
                  type="text"
                  className="modern-text-input"
                  placeholder="Enter your name"
                  value={profile.name || ''}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-lbl">Age</label>
              <div className="input-with-icon">
                <Calendar size={18} className="field-glyph" />
                <input
                  type="number"
                  className="modern-text-input"
                  placeholder="Enter your age"
                  value={profile.age || ''}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="120"
                />
              </div>
              <span className="field-hint">
                Helps calibrate daily sodium and added sugar benchmarks.
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
              Continue →
            </PillButton>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* STEP 2: Food Allergies                                   */}
      {/* ======================================================== */}
      {step === 2 && (
        <section className="onboarding-step step-allergens anim-spring-pop">
          <div className="step-header">
            <span className="step-eyebrow">Allergen Protection</span>
            <h1 className="step-heading">What should we watch out for?</h1>
            <p className="step-sub">
              Select any food allergens that are relevant to you.
            </p>
          </div>

          <div className="allergens-tiles-grid">
            {THEME.allergens.map((alg) => {
              const Icon = ALLERGEN_ICONS[alg.icon] || Sparkles;
              const isSelected = profile.allergies.includes(alg.id);
              return (
                <div
                  key={alg.id}
                  className={`onboarding-large-tile ${isSelected ? 'selected-tile' : ''}`}
                  onClick={() => toggleAllergy(alg.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="tile-top-row">
                    <div className="tile-icon-bubble">
                      <Icon size={24} />
                    </div>
                    {isSelected && (
                      <span className="tile-selected-badge">
                        <Check size={12} strokeWidth={3} /> Selected
                      </span>
                    )}
                  </div>
                  <div className="tile-text-wrap">
                    <h3 className="tile-main-label">{alg.label}</h3>
                    <p className="tile-detail-desc">{alg.desc}</p>
                  </div>
                </div>
              );
            })}

            {/* Custom User-Added Allergens */}
            {profile.customAllergens?.map((custom) => {
              const isSelected = profile.allergies.includes(custom.id);
              return (
                <div
                  key={custom.id}
                  className={`onboarding-large-tile custom-added-tile ${isSelected ? 'selected-tile' : ''}`}
                  onClick={() => toggleAllergy(custom.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="tile-top-row">
                    <div className="tile-icon-bubble">
                      <Sparkles size={24} />
                    </div>
                    <div className="custom-tile-badges">
                      <span className="limited-cov-tag">Limited coverage</span>
                      {isSelected && (
                        <span className="tile-selected-badge">
                          <Check size={12} strokeWidth={3} /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="tile-text-wrap">
                    <h3 className="tile-main-label">{custom.label}</h3>
                    <p className="tile-detail-desc">Custom keyword monitoring</p>
                  </div>
                  <button
                    type="button"
                    className="delete-custom-tag"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomAllergen(custom.id);
                    }}
                    title="Remove custom allergen"
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}

            {/* "Don't see yours? Add another allergen" Card */}
            <div
              className={`onboarding-large-tile add-other-card ${showOtherInput ? 'other-drawer-open' : ''}`}
              onClick={() => setShowOtherInput(true)}
              role="button"
              tabIndex={0}
            >
              <div className="tile-top-row">
                <div className="tile-icon-bubble add-bubble">
                  <Plus size={24} />
                </div>
                <span className="add-other-tag">Custom</span>
              </div>
              <div className="tile-text-wrap">
                <h3 className="tile-main-label">Don't see yours?</h3>
                <p className="tile-detail-desc">Add another allergen (e.g. Mustard, Kiwi, Celery)</p>
              </div>
            </div>
          </div>

          {/* Revealable Custom Allergen Input Drawer */}
          {showOtherInput && (
            <Card className="custom-entry-drawer anim-spring-pop">
              <div className="drawer-top-bar">
                <h3 className="drawer-title">Add custom food allergen</h3>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setShowOtherInput(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddCustom} className="custom-entry-form">
                <input
                  type="text"
                  className="custom-allergen-input"
                  placeholder="Enter allergen name..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  autoFocus
                />
                <PillButton type="submit" variant="primary" size="md">
                  Add Allergen
                </PillButton>
              </form>

              {/* Required honest coverage limitation note */}
              <div className="honest-coverage-callout">
                <span className="callout-icon">⚠️</span>
                <p className="callout-text">
                  <strong>Automated coverage may be limited:</strong> Custom allergens use keyword matching, which may not recognize complex scientific designations or uncommon derivative compounds.
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
              Continue →
            </PillButton>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* STEP 3: Dietary Conditions                               */}
      {/* ======================================================== */}
      {step === 3 && (
        <section className="onboarding-step step-conditions anim-spring-pop">
          <div className="step-header">
            <span className="step-eyebrow">Health Guidelines</span>
            <h1 className="step-heading">Any dietary conditions we should consider?</h1>
            <p className="step-sub">
              Choose the conditions you'd like NutriLens to consider when interpreting food information.
            </p>
          </div>

          <div className="conditions-tiles-grid">
            {THEME.conditions.map((cond) => {
              const Icon = CONDITION_ICONS[cond.icon] || Activity;
              const isSelected = profile.conditions.includes(cond.id);
              const isLimited = !cond.isFullySupported;

              return (
                <div
                  key={cond.id}
                  className={`onboarding-large-tile ${isSelected ? 'selected-tile condition-selected' : ''} ${isLimited ? 'limited-condition-tile' : ''}`}
                  onClick={() => toggleCondition(cond.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="tile-top-row">
                    <div className="tile-icon-bubble">
                      <Icon size={24} />
                    </div>
                    <div className="condition-badges-row">
                      {isLimited && (
                        <span className="limited-cov-tag">Limited coverage</span>
                      )}
                      {isSelected && (
                        <span className="tile-selected-badge">
                          <Check size={12} strokeWidth={3} /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="tile-text-wrap">
                    <h3 className="tile-main-label">{cond.label}</h3>
                    <p className="tile-detail-desc">{cond.desc}</p>
                    {isLimited && cond.limitedNote && (
                      <p className="tile-limited-explanation">{cond.limitedNote}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* "None of these" Card */}
            <div
              className={`onboarding-large-tile ${profile.conditions.length === 0 ? 'selected-tile' : ''}`}
              onClick={() => toggleCondition('none')}
              role="button"
              tabIndex={0}
            >
              <div className="tile-top-row">
                <div className="tile-icon-bubble">
                  <Ban size={24} />
                </div>
                {profile.conditions.length === 0 && (
                  <span className="tile-selected-badge">
                    <Check size={12} strokeWidth={3} /> Selected
                  </span>
                )}
              </div>
              <div className="tile-text-wrap">
                <h3 className="tile-main-label">None of these</h3>
                <p className="tile-detail-desc">I do not have specific clinical dietary requirements.</p>
              </div>
            </div>
          </div>

          <div className="step-footer-actions">
            <PillButton
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={handleNext}
              fullWidth
            >
              Continue →
            </PillButton>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* STEP 4: Review Profile                                   */}
      {/* ======================================================== */}
      {step === 4 && (
        <section className="onboarding-step step-summary anim-spring-pop">
          <div className="step-header">
            <span className="step-eyebrow">Review & Confirm</span>
            <h1 className="step-heading">Your NutriLens profile</h1>
            <p className="step-sub">
              Your profile powers personalized food insights.
            </p>
          </div>

          <Card className="review-profile-card">
            {/* About You Section */}
            <div className="review-row">
              <div className="review-row-header">
                <div className="review-title-group">
                  <User size={18} className="review-section-glyph" />
                  <h3 className="review-section-title">About You</h3>
                </div>
                <button
                  type="button"
                  className="review-edit-btn"
                  onClick={() => setStep(1)}
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>
              <div className="review-values-group">
                <div className="review-item">
                  <span className="review-kicker">Name:</span>
                  <span className="review-val">{profile.name || 'Friend'}</span>
                </div>
                {profile.age && (
                  <div className="review-item">
                    <span className="review-kicker">Age:</span>
                    <span className="review-val">{profile.age}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="review-divider"></div>

            {/* Allergies Section */}
            <div className="review-row">
              <div className="review-row-header">
                <div className="review-title-group">
                  <ShieldAlert size={18} className="review-section-glyph" />
                  <h3 className="review-section-title">Allergies</h3>
                </div>
                <button
                  type="button"
                  className="review-edit-btn"
                  onClick={() => setStep(2)}
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>
              <div className="review-chips-cloud">
                {profile.allergies.length > 0 ? (
                  profile.allergies.map((algId) => {
                    const preset = THEME.allergens.find((a) => a.id === algId);
                    const custom = profile.customAllergens?.find((c) => c.id === algId);
                    const label = preset?.label || custom?.label || algId;
                    const isCustom = Boolean(custom);

                    return (
                      <span key={algId} className={`review-tag-chip ${isCustom ? 'custom-tag' : ''}`}>
                        {label}
                        {isCustom && <span className="chip-mini-badge">Limited</span>}
                      </span>
                    );
                  })
                ) : (
                  <span className="review-empty-note">No allergies selected</span>
                )}
              </div>
            </div>

            <div className="review-divider"></div>

            {/* Dietary Conditions Section */}
            <div className="review-row">
              <div className="review-row-header">
                <div className="review-title-group">
                  <HeartPulse size={18} className="review-section-glyph" />
                  <h3 className="review-section-title">Dietary Conditions</h3>
                </div>
                <button
                  type="button"
                  className="review-edit-btn"
                  onClick={() => setStep(3)}
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>
              <div className="review-chips-cloud">
                {profile.conditions.length > 0 ? (
                  profile.conditions.map((condId) => {
                    const cond = THEME.conditions.find((c) => c.id === condId);
                    const isLimited = !cond?.isFullySupported;
                    return (
                      <span
                        key={condId}
                        className={`review-tag-chip condition-tag ${isLimited ? 'limited-condition-tag' : ''}`}
                      >
                        {cond?.label || condId}
                        {isLimited && <span className="chip-mini-badge">Limited</span>}
                      </span>
                    );
                  })
                ) : (
                  <span className="review-empty-note">None of these (No condition restrictions)</span>
                )}
              </div>
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
              Finish Setup →
            </PillButton>
          </div>
        </section>
      )}
    </div>
  );
}
