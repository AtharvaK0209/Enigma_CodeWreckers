import React from 'react';
import './PillButton.css';

/**
 * Shared PillButton primitive implementing the black pill and secondary pill CTA styles
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {React.ElementType} [props.icon]
 * @param {React.ElementType} [props.iconRight]
 * @param {boolean} [props.fullWidth=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {string} [props.className='']
 * @param {Function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export default function PillButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  onClick,
  children,
  ...rest
}) {
  const btnClasses = [
    'nutri-pill-btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={btnClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {Icon && !loading && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="btn-icon" />}
      {loading && <span className="btn-spinner" />}
      {children && <span className="btn-text">{children}</span>}
      {IconRight && !loading && <IconRight size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} className="btn-icon-right" />}
    </button>
  );
}
