import React from 'react';
import {
  ScanLine,
  Search,
  ShieldCheck,
  HeartPulse,
  Clock,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  LogOut,
  Edit2
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { useAnalysis } from '../../context/AnalysisContext';
import { THEME } from '../../styles/tokens';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import './HomeScreen.css';

export default function HomeScreen({ onNavigate }) {
  const { profile, recentChecks, signOut } = useProfile();
  const { setCurrentResult } = useAnalysis();

  const userName = profile.name || 'Yunus';

  // Dynamic time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${userName}.`;
    if (hour < 18) return `Good afternoon, ${userName}.`;
    return `Good evening, ${userName}.`;
  };

  // Formatted allergy and condition labels
  const allergyLabels = (profile.allergies || []).map((a) => {
    const preset = THEME.allergens.find((p) => p.id === a);
    const custom = profile.customAllergens?.find((c) => c.id === a);
    return preset?.label || custom?.label || a;
  });

  const conditionLabels = (profile.conditions || []).map((c) => {
    const preset = THEME.conditions.find((p) => p.id === c);
    return preset?.label || c;
  });

  const handleRecentClick = (item) => {
    // When a user clicks a recent check, construct or pass result and view /results
    const simulatedResult = {
      verdict: item.verdict,
      verdictTitle:
        item.verdict === 'risk'
          ? 'This product may not be safe for you'
          : item.verdict === 'caution'
          ? 'A few things to check'
          : 'Looks safe for you',
      verdictSummary:
        item.verdict === 'risk'
          ? 'Direct conflicts found with your saved allergy and dietary profile.'
          : item.verdict === 'caution'
          ? 'Check ingredient declarations and recommended thresholds.'
          : 'All detected ingredients are clear of your personal restrictions.',
      dataQuality: 'good',
      product: {
        name: item.name,
        brand: item.brand,
        image: item.image,
        barcode: item.barcode || '8000500310427',
      },
      findings: [
        {
          headline: item.verdict === 'risk' ? 'Restricted ingredient flagged' : 'Verified formulation check',
          severity: item.verdict,
          evidence: `Analysis matching your personalized profile rules.`,
          trigger: item.name,
          source: 'NutriLens Safety Engine',
        },
      ],
    };
    setCurrentResult(simulatedResult);
    onNavigate('/results');
  };

  return (
    <div className="home-screen anim-spring-pop">
      {/* 1. Top Greeting Header */}
      <section className="home-header-block">
        <div className="home-greeting-text">
          <h1 className="home-greeting-name">{getGreeting()}</h1>
          <p className="home-greeting-sub">What would you like to check today?</p>
        </div>
        <div className="home-header-actions">
          <button
            type="button"
            className="user-profile-badge"
            onClick={() => onNavigate('/profile')}
            title="Edit Profile"
          >
            <ShieldCheck size={20} color="#171715" />
          </button>
          <button
            type="button"
            className="sign-out-badge"
            onClick={() => {
              signOut();
              onNavigate('/');
            }}
            title="Sign Out"
          >
            <LogOut size={17} color="#6B6862" />
          </button>
        </div>
      </section>

      {/* 2. Profile Summary Card */}
      <section className="dashboard-profile-summary-section">
        <Card className="profile-summary-card">
          <div className="profile-summary-top">
            <div className="profile-summary-title-wrap">
              <ShieldCheck size={18} className="profile-shield-icon" />
              <h2 className="profile-summary-heading">Your Profile</h2>
            </div>
            <button
              type="button"
              className="edit-profile-link-btn"
              onClick={() => onNavigate('/onboarding?step=1')}
            >
              <span>Edit Profile</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="profile-rules-breakdown">
            <div className="profile-rule-row">
              <span className="rule-type-label">Allergies:</span>
              <span className="rule-values-text">
                {allergyLabels.length > 0 ? allergyLabels.join(' • ') : 'None selected'}
              </span>
            </div>

            <div className="profile-rule-row">
              <span className="rule-type-label">Conditions:</span>
              <span className="rule-values-text">
                {conditionLabels.length > 0 ? conditionLabels.join(' • ') : 'None of these'}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Main Action Cards: Dominant & Prominent */}
      <section className="home-main-actions-section">
        <div className="main-actions-grid">
          {/* Action 1: Scan a Product */}
          <Card
            interactive
            className="dominant-action-card scan-card"
            onClick={() => onNavigate('/scan')}
          >
            <div className="action-card-top-row">
              <div className="action-glyph-bubble scan-bubble">
                <ScanLine size={28} />
              </div>
              <span className="action-pill-tag">Camera & Barcode</span>
            </div>
            <div className="action-text-content">
              <h3 className="action-card-title">Scan a Product</h3>
              <p className="action-card-desc">Scan a barcode or product label</p>
            </div>
            <PillButton
              variant="primary"
              size="md"
              iconRight={ArrowRight}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('/scan');
              }}
            >
              Scan Product →
            </PillButton>
          </Card>

          {/* Action 2: Search Food */}
          <Card
            interactive
            className="dominant-action-card search-card"
            onClick={() => onNavigate('/search')}
          >
            <div className="action-card-top-row">
              <div className="action-glyph-bubble search-bubble">
                <Search size={28} />
              </div>
              <span className="action-pill-tag">Direct Catalog</span>
            </div>
            <div className="action-text-content">
              <h3 className="action-card-title">Search Food</h3>
              <p className="action-card-desc">Find a product without scanning</p>
            </div>
            <PillButton
              variant="secondary"
              size="md"
              iconRight={ArrowRight}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('/search');
              }}
            >
              Search Food →
            </PillButton>
          </Card>
        </div>
      </section>

      {/* 4. Recent Checks Section */}
      <section className="recent-history-section">
        <div className="history-header">
          <Clock size={16} />
          <h2 className="history-title">Recent Checks</h2>
        </div>

        {recentChecks && recentChecks.length > 0 ? (
          <div className="recent-checks-list">
            {recentChecks.map((item) => {
              const isRisk = item.verdict === 'risk';
              const isCaution = item.verdict === 'caution';
              const statusDotClass = isRisk ? 'dot-risk' : isCaution ? 'dot-caution' : 'dot-safe';
              const statusEmoji = isRisk ? '🔴' : isCaution ? '🟡' : '🟢';

              return (
                <Card
                  key={item.id}
                  interactive
                  className="recent-check-item-card"
                  onClick={() => handleRecentClick(item)}
                >
                  <div className="recent-item-left">
                    <span className="status-indicator-emoji">{statusEmoji}</span>
                    <div className="recent-item-text">
                      <div className="recent-item-title-row">
                        <h4 className="recent-item-name">{item.name}</h4>
                        <span className="recent-item-brand">{item.brand}</span>
                      </div>
                      <span className={`recent-status-desc ${statusDotClass}`}>
                        {item.statusText}
                      </span>
                    </div>
                  </div>

                  <div className="recent-item-right">
                    <span className="recent-timestamp">{item.timestamp}</span>
                    <ArrowRight size={14} className="recent-arrow" />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="history-empty-card">
            <p className="empty-history-sub">
              Your recent food checks will appear here.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
