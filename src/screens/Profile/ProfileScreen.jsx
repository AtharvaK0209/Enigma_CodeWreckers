import React, { useState } from 'react';
import {
  Nut,
  Milk,
  Egg,
  Trees,
  Wheat,
  Bean,
  Sparkles,
  HeartPulse,
  Activity,
  Check,
  User,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { THEME } from '../../styles/tokens';
import './ProfileScreen.css';

// Icon map for dynamic lookup
const ICON_MAP = {
  Nut,
  Milk,
  Egg,
  Trees,
  Wheat,
  Bean,
  Sparkles,
  HeartPulse,
  Activity,
};

export default function ProfileScreen({ onNavigate }) {
  const { profile, setName, toggleAllergy, toggleCondition, resetProfile, setProfile } = useProfile();
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleAllergyToggle = (id) => {
    toggleAllergy(id);
    triggerToast();
  };

  const handleConditionToggle = (id) => {
    toggleCondition(id);
    triggerToast();
  };

  const triggerToast = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1800);
  };

  const applyPreset = (presetType) => {
    if (presetType === 'nuts') {
      setProfile((prev) => ({
        ...prev,
        allergies: ['peanut', 'tree_nuts'],
      }));
    } else if (presetType === 'celiac_dairy') {
      setProfile((prev) => ({
        ...prev,
        allergies: ['wheat', 'milk'],
      }));
    } else if (presetType === 'cardio_glycemic') {
      setProfile((prev) => ({
        ...prev,
        conditions: ['hypertension', 'diabetes'],
      }));
    }
    triggerToast();
  };

  return (
    <div className="profile-screen anim-spring-pop">
      {/* Top Banner / Hero */}
      <section className="profile-hero">
        <div className="hero-text-wrap">
          <div className="profile-tag">
            <ShieldCheck size={14} />
            <span>Health & Allergen Intake</span>
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
            <span>Preferences saved locally</span>
          </div>
        )}
      </section>

      {/* Field 1: User Name (Optional) */}
      <section className="wellness-card name-card">
        <div className="field-header">
          <div className="field-icon-wrap">
            <User size={20} />
          </div>
          <div>
            <h2 className="field-title">Your Preferred Name</h2>
            <p className="field-sub">Optional — used for customized greetings and reports</p>
          </div>
        </div>
        <div className="input-group">
          <input
            type="text"
            className="name-input"
            placeholder="e.g. Yunus, Alex, Taylor..."
            value={profile.name}
            onChange={handleNameChange}
            maxLength={40}
          />
        </div>
      </section>

      {/* Quick Profile Presets */}
      <section className="presets-bar">
        <span className="presets-label">Quick Presets:</span>
        <button
          className="btn-preset"
          onClick={() => applyPreset('nuts')}
        >
          🥜 Nut Allergies
        </button>
        <button
          className="btn-preset"
          onClick={() => applyPreset('celiac_dairy')}
        >
          🌾 Wheat & Dairy Free
        </button>
        <button
          className="btn-preset"
          onClick={() => applyPreset('cardio_glycemic')}
        >
          ❤️ Low Sodium & Sugar
        </button>
        <button
          className="btn-preset reset-btn"
          onClick={resetProfile}
          title="Clear all filters"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </section>

      {/* Field 2 to 8: Seven Major Allergens */}
      <section className="wellness-card allergens-section">
        <div className="section-title-wrap">
          <h2 className="section-title">Major Food Allergens</h2>
          <span className="count-pill">
            {profile.allergies.length} Selected
          </span>
        </div>
        <p className="section-desc">
          Flagged with high-priority <strong style={{ color: 'var(--verdict-risk-accent)' }}>Risk Found</strong> status whenever detected in ingredients or manufacturing advisories.
        </p>

        <div className="intake-grid">
          {THEME.allergens.map((alg) => {
            const Icon = ICON_MAP[alg.icon] || Sparkle;
            const isSelected = profile.allergies.includes(alg.id);

            return (
              <div
                key={alg.id}
                className={`intake-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleAllergyToggle(alg.id)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleAllergyToggle(alg.id);
                  }
                }}
              >
                <div className="intake-card-top">
                  <div className="intake-icon-bubble">
                    <Icon size={22} />
                  </div>
                  <div className={`checkbox-indicator ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <Check size={12} strokeWidth={3} className="check-icon-pop" />}
                  </div>
                </div>

                <div className="intake-info">
                  <span className="intake-label">{alg.label}</span>
                  <span className="intake-desc">{alg.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Field 9 & 10: Health Conditions */}
      <section className="wellness-card conditions-section">
        <div className="section-title-wrap">
          <h2 className="section-title">Dietary Health Conditions</h2>
          <span className="count-pill">
            {profile.conditions.length} Monitored
          </span>
        </div>
        <p className="section-desc">
          Evaluates nutritional density thresholds and flags <strong style={{ color: 'var(--verdict-caution-accent)' }}>Caution</strong> for high sodium or glycemic spikes.
        </p>

        <div className="intake-grid conditions-grid">
          {THEME.conditions.map((cond) => {
            const Icon = ICON_MAP[cond.icon] || Activity;
            const isSelected = profile.conditions.includes(cond.id);

            return (
              <div
                key={cond.id}
                className={`intake-card condition-item ${isSelected ? 'selected-condition' : ''}`}
                onClick={() => handleConditionToggle(cond.id)}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleConditionToggle(cond.id);
                  }
                }}
              >
                <div className="intake-card-top">
                  <div className="intake-icon-bubble">
                    <Icon size={22} />
                  </div>
                  <div className={`checkbox-indicator ${isSelected ? 'checked-condition' : ''}`}>
                    {isSelected && <Check size={12} strokeWidth={3} className="check-icon-pop" />}
                  </div>
                </div>

                <div className="intake-info">
                  <span className="intake-label">{cond.label}</span>
                  <span className="intake-desc">{cond.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating / Bottom Action Bar */}
      <section className="profile-action-bar">
        <button
          className="btn-pill-primary continue-btn"
          onClick={() => onNavigate('/analyze')}
        >
          <span>Ready to Scan Food</span>
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}
