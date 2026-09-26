import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, BookOpen, Sparkles } from 'lucide-react';
import './RiskCard.css';

/**
 * Helper to translate internal category or triggers into plain-language human sentences
 */
function getPlainLanguageHeadline(category, trigger, severity) {
  if (trigger) {
    if (trigger.toLowerCase().includes('peanut')) return 'Contains peanut';
    if (trigger.toLowerCase().includes('hazelnut') || trigger.toLowerCase().includes('tree nut') || trigger.toLowerCase().includes('almond')) return 'Contains tree nuts';
    if (trigger.toLowerCase().includes('milk') || trigger.toLowerCase().includes('dairy') || trigger.toLowerCase().includes('whey')) return 'Contains milk & dairy';
    if (trigger.toLowerCase().includes('wheat') || trigger.toLowerCase().includes('gluten')) return 'Contains wheat & gluten';
    if (trigger.toLowerCase().includes('soy')) return 'Contains soy';
    if (trigger.toLowerCase().includes('egg')) return 'Contains eggs';
    if (trigger.toLowerCase().includes('sesame') || trigger.toLowerCase().includes('tahini')) return 'Contains sesame';
    if (trigger.toLowerCase().includes('sodium') || trigger.toLowerCase().includes('caffeine')) return 'High sodium or stimulant level';
    if (trigger.toLowerCase().includes('sugar') || trigger.toLowerCase().includes('fructose') || trigger.toLowerCase().includes('syrup')) return 'High added sugar concentration';
  }

  if (category) {
    if (category.toLowerCase().includes('allergen')) return severity === 'risk' ? 'Contains restricted allergen' : 'Allergen check';
    if (category.toLowerCase().includes('cross-contact') || category.toLowerCase().includes('facility')) return 'May contain trace allergens (shared facility)';
    if (category.toLowerCase().includes('hypertension') || category.toLowerCase().includes('sodium')) return 'Elevated sodium for blood pressure';
    if (category.toLowerCase().includes('diabetes') || category.toLowerCase().includes('glycemic')) return 'Added sugars may spike blood glucose';
    if (category.toLowerCase().includes('wholesome') || category.toLowerCase().includes('safe')) return 'Clean ingredient match';
  }

  return severity === 'risk' ? 'Restricted ingredient flagged' : severity === 'caution' ? 'Ingredient note to check' : 'Verified safe ingredient';
}

/**
 * Formats scientific / label names according to Mission 4:
 * Plain-English name first, scientific/label name second in parentheses.
 */
function formatIngredientNaming(evidence, trigger) {
  if (!trigger) return { primarySentence: evidence, scientificClarification: null };

  const lowerTrigger = trigger.toLowerCase();

  // Peanut scientific pairing
  if (lowerTrigger.includes('peanut')) {
    return {
      primarySentence: evidence,
      scientificClarification: 'Peanut ingredients (declared on packaging as Arachis hypogaea or peanut derivatives)',
    };
  }

  // Hazelnut / Tree Nut pairing
  if (lowerTrigger.includes('hazelnut')) {
    return {
      primarySentence: evidence,
      scientificClarification: 'Hazelnuts (declared on packaging as Corylus avellana botanical nut extract)',
    };
  }

  // Milk / Whey pairing
  if (lowerTrigger.includes('milk') || lowerTrigger.includes('whey') || lowerTrigger.includes('casein')) {
    return {
      primarySentence: evidence,
      scientificClarification: 'Bovine dairy proteins (declared on label as skimmed milk powder / whey fraction)',
    };
  }

  // Wheat / Gluten pairing
  if (lowerTrigger.includes('wheat') || lowerTrigger.includes('gluten')) {
    return {
      primarySentence: evidence,
      scientificClarification: 'Wheat cereal proteins (declared on label as Triticum aestivum starch & flour)',
    };
  }

  // Soy lecithin pairing
  if (lowerTrigger.includes('soy')) {
    return {
      primarySentence: evidence,
      scientificClarification: 'Soybean emulsifier (declared on label as Glycine max phospholipid lecithin)',
    };
  }

  // Default pairing
  return {
    primarySentence: evidence,
    scientificClarification: `${trigger} (as listed in product ingredient statement)`,
  };
}

/**
 * Mission 4: Plain-Language RiskCard
 * - Headline is what it means to the user (e.g. "Contains peanut")
 * - Plain name first, scientific name second in parentheses
 * - No internal labels ("severity: high", "trigger: ...", "category: ...")
 * - Real source behind an expandable "See where this info came from" tap
 * - Color AND distinct icon carry accessibility meaning
 */
export default function RiskCard({
  category,
  severity = 'safe',
  evidence,
  trigger,
  source,
  headline: customHeadline,
}) {
  const [isSourceExpanded, setIsSourceExpanded] = useState(false);
  const normalizedSeverity = ['safe', 'caution', 'risk'].includes(severity) ? severity : 'safe';

  const headlineText = customHeadline || getPlainLanguageHeadline(category, trigger, normalizedSeverity);
  const { primarySentence, scientificClarification } = formatIngredientNaming(evidence, trigger);

  const severityVisuals = {
    safe: {
      icon: CheckCircle2,
      cardClass: 'risk-card-safe',
      iconAriaLabel: 'Verified safe indicator',
    },
    caution: {
      icon: AlertTriangle,
      cardClass: 'risk-card-caution',
      iconAriaLabel: 'Caution advisory indicator',
    },
    risk: {
      icon: ShieldAlert,
      cardClass: 'risk-card-risk',
      iconAriaLabel: 'Health risk indicator',
    },
  };

  const currentVisual = severityVisuals[normalizedSeverity];
  const VisualIcon = currentVisual.icon;

  return (
    <article className={`plain-risk-card ${currentVisual.cardClass}`}>
      <div className="card-accent-indicator" aria-hidden="true"></div>

      <div className="card-inner-flow">
        {/* Card Header with Icon + Plain English Headline */}
        <header className="card-plain-header">
          <div className="plain-icon-wrapper" aria-label={currentVisual.iconAriaLabel}>
            <VisualIcon size={20} strokeWidth={2.4} />
          </div>
          <h3 className="plain-headline">{headlineText}</h3>
        </header>

        {/* Plain Language Sentence Explanation */}
        <p className="plain-sentence-body">{primarySentence}</p>

        {/* Plain-English name first, scientific name second in parentheses */}
        {scientificClarification && (
          <div className="scientific-clarification-note">
            <span className="scientific-label">Identified on label:</span>
            <span className="scientific-text">{scientificClarification}</span>
          </div>
        )}

        {/* Source info tucked behind "See where this info came from" tap */}
        {source && (
          <div className="source-reveal-container">
            <button
              type="button"
              className="source-toggle-btn"
              onClick={() => setIsSourceExpanded(!isSourceExpanded)}
              aria-expanded={isSourceExpanded}
            >
              <BookOpen size={13} />
              <span>{isSourceExpanded ? 'Hide info source' : 'See where this info came from'}</span>
              {isSourceExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isSourceExpanded && (
              <div className="source-expanded-drawer anim-spring-pop">
                <span className="source-ref-label">Medical Reference & Standard:</span>
                <p className="source-ref-text">{source}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
