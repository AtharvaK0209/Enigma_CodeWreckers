import React from 'react';
import { Check, Info } from 'lucide-react';
import './IconTile.css';

/**
 * Shared IconTile component for allergen and condition intake cards.
 * Implements the mobile wellness reference grid style, with checkmark pop
 * and the formal "Limited coverage" visual treatment for honest disclosure.
 * 
 * @param {Object} props
 * @param {React.ElementType} props.icon - SVG icon component
 * @param {string} props.label - Main headline (e.g. "Peanuts", "CKD")
 * @param {string} [props.desc] - Explanatory subtext
 * @param {boolean} [props.selected=false] - Whether tile is currently checked
 * @param {boolean} [props.limitedCoverage=false] - Whether item has limited risk-engine coverage
 * @param {string} [props.limitedNote] - Clarifying note regarding coverage limitations
 * @param {'risk' | 'caution'} [props.selectionTone='risk'] - Visual accent family on selection
 * @param {Function} props.onToggle - Toggle click handler
 * @param {string} [props.className='']
 */
export default function IconTile({
  icon: Icon,
  label,
  desc,
  selected = false,
  limitedCoverage = false,
  limitedNote,
  selectionTone = 'risk',
  onToggle,
  className = '',
}) {
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle && onToggle();
    }
  };

  const tileClasses = [
    'nutri-icon-tile',
    selected ? `tile-selected-${selectionTone}` : '',
    limitedCoverage ? 'tile-limited-coverage' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={tileClasses}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="tile-top-row">
        <div className="tile-icon-bubble">
          {Icon && <Icon size={22} />}
        </div>

        <div className="tile-indicator-group">
          {limitedCoverage && (
            <span className="limited-coverage-badge" title="Data or rules are partially available for this item">
              Limited coverage
            </span>
          )}
          <div className={`tile-check-circle ${selected ? 'is-checked' : ''}`}>
            {selected && <Check size={12} strokeWidth={3} className="check-icon-anim" />}
          </div>
        </div>
      </div>

      <div className="tile-body">
        <h3 className="tile-label">{label}</h3>
        {desc && <p className="tile-desc">{desc}</p>}
      </div>

      {limitedCoverage && limitedNote && selected && (
        <div className="tile-limited-note anim-spring-pop">
          <Info size={12} className="note-icon" />
          <span>{limitedNote}</span>
        </div>
      )}
    </div>
  );
}
