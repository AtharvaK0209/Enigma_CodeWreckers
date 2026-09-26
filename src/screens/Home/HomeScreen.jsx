import React from 'react';
import {
  ScanLine,
  Search,
  ShieldCheck,
  HeartPulse,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { THEME } from '../../styles/tokens';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import { useAnalysis } from '../../context/AnalysisContext';
import './HomeScreen.css';

export default function HomeScreen({ onNavigate }) {
  const { profile, recentChecks } = useProfile();
  const { setCurrentResult } = useAnalysis();
  const userName = profile.name || 'Friend';

  // Count active allergen & condition rules
  const activeAllergens = profile.allergies || [];
  const activeConditions = profile.conditions || [];
  const totalRulesCount = activeAllergens.length + activeConditions.length;

  // Check for any custom allergens or limited conditions
  const hasCustom = profile.customAllergens && profile.customAllergens.length > 0;
  const hasLimitedCondition = activeConditions.some((c) => c === 'ckd' || c === 'pcos');

  const handleRecentClick = (item) => {
    setCurrentResult({
      verdict: item.verdict,
      verdictTitle: item.verdictTitle || (item.verdict === 'safe' ? 'Looks safe for you' : 'This product may not be safe for you'),
      verdictSummary: item.verdictSummary || item.statusText || 'Evaluated against your profile.',
      dataQuality: item.dataQuality || 'good',
      product: {
        id: item.productId || item.barcode || item.id,
        name: item.name,
        brand: item.brand,
        image: item.image,
        barcode: item.barcode,
      },
      findings: item.findings || [],
    });
    onNavigate('/results');
  };

  return (
    <div className="home-screen anim-spring-pop">
      {/* Top Greeting Section */}
      <section className="home-header-block">
        <div className="home-greeting-text">
          <span className="home-eyebrow">Food Safety Dashboard</span>
          <h1 className="home-greeting-name">Welcome back, {userName}</h1>
        </div>
        <button
          type="button"
          className="user-profile-badge"
          onClick={() => onNavigate('/profile')}
          title="Edit Profile"
        >
          <ShieldCheck size={22} color="#171715" />
        </button>
      </section>

      {/* Hero Highlight Card — Profile Protection Overview */}
      <section className="home-overview-hero">
        <Card variant="safe" className="protection-hero-card">
          <div className="hero-top-status">
            <span className="hero-status-kicker">Active Safety Protection</span>
            <span className="hero-status-pill">Active Shield</span>
          </div>

          <div className="hero-main-content">
            <div className="hero-icon-bubble">
              <HeartPulse size={26} color="#14381B" />
            </div>
            <div className="hero-text-block">
              <h2 className="hero-rules-headline">
                {totalRulesCount > 0 ? `${totalRulesCount} Rules Monitored` : 'Baseline Mode'}
              </h2>
              <p className="hero-rules-summary">
                {activeAllergens.length > 0
                  ? `Filtering against ${activeAllergens.map((a) => {
                      const preset = THEME.allergens.find((p) => p.id === a);
                      const custom = profile.customAllergens?.find((c) => c.id === a);
                      return preset?.label || custom?.label || a;
                    }).join(', ')}`
                  : 'No specific allergens set. Configure your profile to trigger safety alerts.'}
              </p>
            </div>
          </div>

          {/* Honest Coverage Notice if custom allergens or CKD/PCOS are active */}
          {(hasCustom || hasLimitedCondition) && (
            <div className="hero-limited-disclaimer">
              <Info size={13} className="disclaimer-icon" />
              <span>
                Note: Profile includes custom allergens or health conditions with partial data availability.
              </span>
            </div>
          )}

          <div className="hero-actions-row">
            <PillButton
              variant="primary"
              size="md"
              icon={ScanLine}
              onClick={() => onNavigate('/analyze')}
            >
              Scan a Product
            </PillButton>
            <PillButton
              variant="secondary"
              size="md"
              icon={Search}
              onClick={() => onNavigate('/search')}
            >
              Search a Food
            </PillButton>
          </div>
        </Card>
      </section>

      {/* Primary Action Tiles */}
      <section className="home-actions-grid">
        <Card
          interactive
          className="action-tile-card"
          onClick={() => onNavigate('/analyze')}
        >
          <div className="tile-icon-box scan-box">
            <ScanLine size={24} />
          </div>
          <div className="tile-content">
            <h3 className="tile-title">Scan Barcode / Label</h3>
            <p className="tile-sub">Point your camera or upload a photo to verify ingredients instantly.</p>
          </div>
          <ArrowRight size={16} className="tile-arrow" />
        </Card>

        <Card
          interactive
          className="action-tile-card"
          onClick={() => onNavigate('/search')}
        >
          <div className="tile-icon-box search-box">
            <Search size={24} />
          </div>
          <div className="tile-content">
            <h3 className="tile-title">Search Food by Name</h3>
            <p className="tile-sub">Look up snacks, sauces, and packaged products in our safety catalog.</p>
          </div>
          <ArrowRight size={16} className="tile-arrow" />
        </Card>
      </section>

      {/* Recent Checks Section */}
      <section className="recent-history-section">
        <div className="history-header">
          <Clock size={16} />
          <h2 className="history-title">Recent Checks</h2>
        </div>

        {recentChecks && recentChecks.length > 0 ? (
          <div className="recent-checks-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentChecks.map((item) => {
              const isRisk = item.verdict === 'risk';
              const isCaution = item.verdict === 'caution';
              const statusEmoji = isRisk ? '🔴' : isCaution ? '🟡' : '🟢';

              return (
                <Card
                  key={item._id || item.id}
                  interactive
                  className="recent-check-item-card"
                  onClick={() => handleRecentClick(item)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '18px' }}>{statusEmoji}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h4>
                          {item.brand && (
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.brand}</span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: isRisk ? '#DC2626' : isCaution ? '#D97706' : '#16A34A', fontWeight: 600 }}>
                          {item.statusText || (isRisk ? 'Potential concern' : isCaution ? 'Review recommended' : 'No relevant concerns found')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)' }}>
                      <span style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{item.timestamp || 'Recent'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="history-empty-card">
            <div className="history-empty-icon">
              <ScanLine size={28} />
            </div>
            <h4 className="empty-history-heading">No items checked yet</h4>
            <p className="empty-history-sub">
              Your scanned products and search history will be saved right here for quick re-checking.
            </p>
            <PillButton
              variant="outline"
              size="sm"
              icon={ScanLine}
              onClick={() => onNavigate('/analyze')}
            >
              Scan your first item
            </PillButton>
          </Card>
        )}
      </section>
    </div>
  );
}
