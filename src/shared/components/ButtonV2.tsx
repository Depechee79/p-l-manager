/**
 * ButtonV2 - Button with V2 design system
 *
 * Session 007: New design matching Almacen reference
 * Features:
 * - 36px height (--app-interactive-h)
 * - 8px border-radius
 * - Primary with shadow, secondary with border
 * - Icon-only variant
 */
import React from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

export interface ButtonV2Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Icon to show before label */
  icon?: ReactNode;
  /** Icon-only button (no text) */
  iconOnly?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  children?: ReactNode;
}

export const ButtonV2: React.FC<ButtonV2Props> = ({
  variant = 'primary',
  icon,
  iconOnly = false,
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-[var(--app-interactive-radius)]
    text-[var(--app-interactive-font-size)] font-semibold
    transition-all duration-150 ease-in-out
    ${iconOnly ? 'w-[var(--app-interactive-h)] p-0' : 'w-auto px-4'}
    h-[var(--app-interactive-h)]
    ${fullWidth ? 'w-full' : ''}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;

  const variantClasses = {
    primary: `
      bg-accent text-white border-transparent
      shadow-[var(--btn-shadow-primary)]
      ${!isDisabled && 'hover:bg-accent-hover hover:shadow-[var(--btn-shadow-primary-hover)]'}
    `,
    secondary: `
      bg-surface text-text-secondary border border-border
      shadow-[var(--btn-shadow)]
      ${!isDisabled && 'hover:bg-surface-muted hover:border-border-focus hover:shadow-[var(--btn-shadow-hover)]'}
    `,
    ghost: `
      bg-surface-muted text-text-secondary border-transparent
      shadow-[var(--btn-shadow)]
      ${!isDisabled && 'hover:bg-border hover:shadow-[var(--btn-shadow-hover)]'}
    `,
  };

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.replace(/\s+/g, ' ').trim()}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <>
          {icon && (
            <span className="flex items-center text-base">
              {icon}
            </span>
          )}
          {!iconOnly && children}
        </>
      )}
    </button>
  );
};
