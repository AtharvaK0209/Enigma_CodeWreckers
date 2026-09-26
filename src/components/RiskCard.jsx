import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, BookOpen, Zap } from 'lucide-react';
import './RiskCard.css';

/**
 * Reusable RiskCard component representing a single RiskFinding.
 * Strict compliance with agreed contract:
 * @param {Object} props
 * @param {string} props.category - Category name (e.g. "Allergen Alert", "Hypertension Concern")
 * @param {'safe' | 'caution' | 'risk'} props.severity - Severity level
 * @param {string} props.evidence - Core explanation text
 * @param {string | null} [props.trigger] - Specific ingredient or metric that caused the flag
 * @param {string | null} [props.source] - Health regulation or standard reference
 */
export default function RiskCard({ category, severity = 'safe', evidence, trigger, source }) {
  const normalizedSeverity = ['safe', 'caution', 'risk'].includes(severity) ? severity : 'safe';

  const severityConfig = {
    safe: {
      icon: CheckCircle2,
      label: 'Verified Safe',
      className: 'severity-safe',
    },
    caution: {
      icon: AlertTriangle,
      label: 'Advisory Warning',
      className: 'severity-caution',
    },
    risk: {
      icon: ShieldAlert,
      label: 'Severe Risk Trigger',
      className: 'severity-risk',
    },
  };

  const currentConfig = severityConfig[normalizedSeverity];
  const SeverityIcon = currentConfig.icon;

  return (
    <article className={`risk-card ${currentConfig.className}`} role="region" aria-label={`${category} finding`}>
      <div className="risk-card-left-strip"></div>

      <div className="risk-card-content">
        <header className="risk-card-header">
          <div className="category-group">
            <span className="category-title">{category || 'Safety Finding'}</span>
          </div>

          <div className="severity-pill" aria-label={`Severity: ${normalizedSeverity}`}>
            <SeverityIcon size={14} className="severity-icon" aria-hidden="true" />
            <span>{currentConfig.label}</span>
          </div>
        </header>

        <p className="risk-evidence">{evidence}</p>

        {/* Secondary Details: Trigger & Source (Optional/Nullable) */}
        {(trigger || source) && (
          <footer className="risk-card-footer">
            {trigger && (
              <div className="meta-item trigger-tag" title="Specific flagged trigger">
                <Zap size={12} className="meta-icon" />
                <span className="meta-label">Trigger:</span>
                <span className="meta-value">{trigger}</span>
              </div>
            )}

            {source && (
              <div className="meta-item source-tag" title="Standard reference">
                <BookOpen size={12} className="meta-icon" />
                <span className="meta-label">Ref:</span>
                <span className="meta-value">{source}</span>
              </div>
            )}
          </footer>
        )}
      </div>
    </article>
  );
}
