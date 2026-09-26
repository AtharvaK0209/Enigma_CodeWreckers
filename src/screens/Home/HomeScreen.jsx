import React from 'react';
import { ScanLine, Camera, ShieldCheck, ArrowRight, HeartPulse, Sparkles, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import './HomeScreen.css';

export default function HomeScreen({ onNavigate }) {
  const { profile } = useProfile();
  const userName = profile.name || 'Friend';
  const allergyCount = profile.allergies.length;
  const conditionCount = profile.conditions.length;

  return (
    <div className="home-screen anim-spring-pop">
      {/* Welcome & Overview Header */}
      <section className="home-header">
        <div className="home-greeting">
          <div className="greeting-sub">Wellness & Safety Dashboard</div>
          <h1 className="greeting-title">Welcome back, {userName}</h1>
        </div>
        <div className="shield-avatar" onClick={() => onNavigate('/profile')}>
          <ShieldCheck size={24} color="#181816" />
        </div>
      </section>

      {/* Hero Highlight Card - Health Overview Reference Style (Lime surface with dark pill) */}
      <section className="hero-verdict-preview">
        <div className="highlight-metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Protection Status</span>
            <span className="metric-pill">Active Shield</span>
          </div>

          <div className="metric-body">
            <div className="metric-icon-bubble">
              <HeartPulse size={28} color="#153C19" />
            </div>
            <div className="metric-value-block">
              <h2 className="metric-headline">
                {allergyCount > 0 ? `${allergyCount} Allergen Rules Monitored` : 'Baseline Mode'}
              </h2>
              <p className="metric-subtext">
                {allergyCount > 0
                  ? `Protecting against ${profile.allergies.map(a => a.replace('_', ' ')).join(', ')}`
                  : 'Configure allergies in your profile to trigger safety alerts'}
              </p>
            </div>
          </div>

          <div className="metric-footer">
            <button className="btn-pill-primary" onClick={() => onNavigate('/analyze')}>
              <ScanLine size={16} />
              <span>Start Food Scan</span>
            </button>
            <button className="btn-pill-secondary" onClick={() => onNavigate('/profile')}>
              <span>Edit Profile</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Grid Cards - Wellness & My Health Reference */}
      <section className="feature-grid">
        {/* Card 1: Instant Barcode Scanner */}
        <div className="wellness-card feature-card" onClick={() => onNavigate('/analyze')}>
          <div className="feature-icon-badge barcode-icon">
            <ScanLine size={24} color="#111111" />
          </div>
          <div className="feature-card-content">
            <h3 className="feature-card-title">Barcode Scanner</h3>
            <p className="feature-card-desc">
              Point your camera at any packaged food barcode for instant safety assessment.
            </p>
          </div>
          <div className="feature-arrow">
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Card 2: Multimodal Image OCR */}
        <div className="wellness-card feature-card" onClick={() => onNavigate('/analyze')}>
          <div className="feature-icon-badge photo-icon">
            <Camera size={24} color="#111111" />
          </div>
          <div className="feature-card-content">
            <h3 className="feature-card-title">Label Photo OCR</h3>
            <p className="feature-card-desc">
              Snap a picture of the ingredient list or nutrition panel to detect hidden cross-contaminants.
            </p>
          </div>
          <div className="feature-arrow">
            <ArrowRight size={16} />
          </div>
        </div>
      </section>

      {/* Traffic-Light Legend Guide */}
      <section className="wellness-card verdict-legend-card">
        <h3 className="legend-title">How NutriLens Protects You</h3>
        <p className="legend-subtitle">
          Every product is evaluated against your personalized health baseline across 3 distinct verdict tiers:
        </p>

        <div className="verdict-tier-row">
          <div className="tier-badge safe-tier">
            <CheckCircle2 size={16} />
            <span>Safe for you</span>
          </div>
          <span className="tier-desc">Zero triggers found across ingredients, additives, and allergen declarations.</span>
        </div>

        <div className="verdict-tier-row">
          <div className="tier-badge caution-tier">
            <AlertTriangle size={16} />
            <span>Caution advised</span>
          </div>
          <span className="tier-desc">Cross-contact facility warnings, high sodium, or elevated sugars flagged.</span>
        </div>

        <div className="verdict-tier-row">
          <div className="tier-badge risk-tier">
            <ShieldAlert size={16} />
            <span>Risk found</span>
          </div>
          <span className="tier-desc">Explicit direct match with a severe registered allergen in your profile.</span>
        </div>
      </section>
    </div>
  );
}
