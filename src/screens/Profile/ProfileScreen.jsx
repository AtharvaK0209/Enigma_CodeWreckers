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
  User,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { THEME } from '../../styles/tokens';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import IconTile from '../../components/common/IconTile';
import './ProfileScreen.css';

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

const CONDITION_ICONS = {
  HeartPulse,
  Activity,
  ShieldAlert,
  Sparkle,
};

export default function ProfileScreen({ onNavigate }) {
  const {
    profile,
    setName,
    setAge,
    toggleAllergy,
    addCustomAllergen,
    removeCustomAllergen,
    toggleCondition,
    resetProfile,
  } = useProfile();

  const [customInput, setCustomInput] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const triggerToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1600);
  };

  const handleAllergyToggle = (id) => {
    toggleAllergy(id);
    triggerToast();
  };

  const handleConditionToggle = (id) => {
    toggleCondition(id);
    triggerToast();
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      addCustomAllergen(customInput.trim());
      setCustomInput('');
      setShowOtherInput(false);
      triggerToast();
    }
  };

  return (
    <div className="profile-screen anim-spring-pop">
      {/* Top Banner / Hero */}
      <section className="profile-hero">
        <div className="hero-text-wrap">
          <div className="profile-tag">
            <ShieldCheck size={14} />
            <span>Health & Safety Profile</span>
          </div>
          <h1 className="profile-title">Personal Safety Profile</h1>
          <p className="profile-desc">
            Define your biological boundaries. NutriLens cross-examines every ingredient and
            trace advisory against these criteria before you take a single bite.
          </p>
        </div>

        {showSavedToast && (
          <div className="saved-toast anim-spring-pop">
            <Check size={14} />
            <span>Profile updated locally</span>
          </div>
        )}
      </section>

      {/* Field 1: Name and Age */}
      <Card className="profile-identity-card">
        <div className="identity-fields-row">
          <div className="field-group flex-2">
            <label className="field-lbl">Your Name</label>
            <input
              type="text"
              className="text-input"
              placeholder="e.g. Yunus"
              value={profile.name}
              onChange={(e) => { setName(e.target.value); triggerToast(); }}
              maxLength={40}
            />
          </div>

          <div className="field-group flex-1">
            <label className="field-lbl">Age</label>
            <input
              type="number"
              className="text-input"
              placeholder="e.g. 24"
              value={profile.age || ''}
              onChange={(e) => { setAge(e.target.value); triggerToast(); }}
              min="1"
              max="120"
            />
          </div>
        </div>

        <div className="onboarding-relaunch-row">
          <PillButton
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('/onboarding')}
          >
            Launch Step-by-Step Onboarding Flow
          </PillButton>
          <PillButton
            variant="ghost"
            size="sm"
            onClick={resetProfile}
          >
            Reset All
          </PillButton>
        </div>
      </Card>

      {/* Field 2: 9 Major Allergens + Custom */}
      <section className="profile-intake-section">
        <div className="section-title-wrap">
          <h2 className="section-title">Major Food Allergens</h2>
          <span className="count-pill">{profile.allergies.length} Selected</span>
        </div>
        <p className="section-desc">
          Flagged with high-priority warnings whenever detected in ingredients or manufacturing advisories.
        </p>

        <div className="profile-tiles-grid">
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
                onToggle={() => handleAllergyToggle(alg.id)}
              />
            );
          })}

          {/* User-defined custom allergens */}
          {profile.customAllergens.map((custom) => {
            const isSelected = profile.allergies.includes(custom.id);
            return (
              <div key={custom.id} className="custom-tile-wrapper">
                <IconTile
                  icon={Sparkles}
                  label={`Custom: ${custom.label}`}
                  desc="Custom keyword allergen"
                  selected={isSelected}
                  limitedCoverage={true}
                  limitedNote={custom.limitedNote}
                  selectionTone="risk"
                  onToggle={() => handleAllergyToggle(custom.id)}
                />
                <button
                  type="button"
                  className="remove-custom-btn"
                  onClick={() => removeCustomAllergen(custom.id)}
                  title="Remove custom allergen"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* Add Other Custom Allergen */}
          <div
            className="nutri-icon-tile tile-other-trigger"
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
              <h3 className="tile-label">Add Custom Allergen</h3>
              <p className="tile-desc">Add a specific ingredient (e.g. Mustard, Kiwi)</p>
            </div>
          </div>
        </div>

        {/* Custom Allergen Drawer */}
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

            <div className="trust-coverage-notice">
              <span className="notice-icon">⚠️</span>
              <p className="notice-text">
                <strong>Limited coverage notice:</strong> Custom allergens use keyword matching,
                which may not catch every chemical derivative or scientific name.
              </p>
            </div>
          </Card>
        )}
      </section>

      {/* Field 3: Health Conditions with Honesty about Coverage */}
      <section className="profile-intake-section">
        <div className="section-title-wrap">
          <h2 className="section-title">Dietary Health Conditions</h2>
          <span className="count-pill">{profile.conditions.length} Monitored</span>
        </div>
        <p className="section-desc">
          Evaluates nutrient density thresholds against clinical guidelines.
        </p>

        <div className="profile-tiles-grid">
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
                onToggle={() => handleConditionToggle(cond.id)}
              />
            );
          })}
        </div>
      </section>

      {/* Action Footer */}
      <div className="profile-footer-cta">
        <PillButton
          variant="primary"
          size="lg"
          iconRight={ArrowRight}
          onClick={() => onNavigate('/analyze')}
          fullWidth
        >
          Ready to Scan Food
        </PillButton>
      </div>
    </div>
  );
}
