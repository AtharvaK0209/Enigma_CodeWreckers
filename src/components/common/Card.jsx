import React from 'react';
import './Card.css';

/**
 * Shared Card primitive implementing the NutriLens design reference:
 * Pure white, generous 18-24px rounded corners, whisper-soft shadow, zero hard borders.
 * 
 * @param {Object} props
 * @param {'default' | 'elevated' | 'safe' | 'caution' | 'risk' | 'muted'} [props.variant='default']
 * @param {boolean} [props.interactive=false]
 * @param {string} [props.className='']
 * @param {Function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export default function Card({
  variant = 'default',
  interactive = false,
  className = '',
  onClick,
  children,
  ...rest
}) {
  const variantClass = `card-variant-${variant}`;
  const interactiveClass = interactive ? 'card-interactive' : '';

  return (
    <div
      className={`nutri-card ${variantClass} ${interactiveClass} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(e);
        }
      } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
