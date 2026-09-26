import React from 'react';
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
  Check,
  X,
} from 'lucide-react';
import { THEME } from '../../styles/tokens';
import './AllergenGrid.css';

export const ALLERGEN_ICONS = {
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

/**
 * AllergenGrid Component (Reused between Onboarding and Clarify screen)
 */
export default function AllergenGrid({
  selectedAllergens = [],
  onToggleAllergen,
  customAllergens = [],
  onRemoveCustomAllergen,
}) {
  return (
    <div className="allergens-tiles-grid">
      {THEME.allergens.map((alg) => {
        const Icon = ALLERGEN_ICONS[alg.icon] || Sparkles;
        const isSelected = selectedAllergens.includes(alg.id);

        return (
          <div
            key={alg.id}
            className={`onboarding-large-tile ${isSelected ? 'selected-tile' : ''}`}
            onClick={() => onToggleAllergen && onToggleAllergen(alg.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleAllergen && onToggleAllergen(alg.id);
              }
            }}
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
      {customAllergens &&
        customAllergens.map((custom) => {
          const isSelected = selectedAllergens.includes(custom.id);

          return (
            <div
              key={custom.id}
              className={`onboarding-large-tile custom-added-tile ${isSelected ? 'selected-tile' : ''}`}
              onClick={() => onToggleAllergen && onToggleAllergen(custom.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleAllergen && onToggleAllergen(custom.id);
                }
              }}
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
              {onRemoveCustomAllergen && (
                <button
                  type="button"
                  className="delete-custom-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomAllergen(custom.id);
                  }}
                  title="Remove custom allergen"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}
