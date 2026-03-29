/**
 * Button - Consolidated design system button
 *
 * Tailwind-based button with token-driven styling.
 * Supports multiple variants, sizes, icons, and loading state.
 *
 * Consolidates the former Button (BEM) and ButtonV2 (Tailwind) into one component.
 */
import React from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'info' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Icon to show (positioned via iconPosition) */
  icon?: ReactNode;
  /** Icon position relative to label */
  iconPosition?: 'left' | 'right';
  /** Icon-only button (no text) */
  iconOnly?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  children?: ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 text-xs px-3 gap-1.5',
  md: 'h-[var(--app-interactive-h)] text-[var(--app-interactive-font-size)] px-4 gap-2',
  lg: 'h-11 text-base px-6 gap-2.5',
};

const sizeIconOnlyClasses: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 p-0',
  md: 'h-[var(--app-interactive-h)] w-[var(--app-interactive-h)] p-0',
  lg: 'h-11 w-11 p-0',
};

const variantClasses: Record<ButtonVariant, { base: string; hover: string }> = {
  primary: {
    base: 'bg-accent text-white border-transparent shadow-[var(--btn-shadow-primary)]',
    hover: 'hover:bg-accent-hover hover:shadow-[var(--btn-shadow-primary-hover)]',
  },
  secondary: {
    base: 'bg-surface text-text-secondary border border-border shadow-[var(--btn-shadow)]',
    hover: 'hover:bg-surface-muted hover:border-border-focus hover:shadow-[var(--btn-shadow-hover)]',
  },
  ghost: {
    base: 'bg-surface-muted text-text-secondary border-transparent shadow-[var(--btn-shadow)]',
    hover: 'hover:bg-border hover:shadow-[var(--btn-shadow-hover)]',
  },
  danger: {
    base: 'bg-[var(--danger)] text-white border-transparent',
    hover: 'hover:bg-[var(--danger-hover,#b91c1c)]',
  },
  success: {
    base: 'bg-[var(--success)] text-white border-transparent',
    hover: 'hover:bg-[var(--success-hover,#059669)]',
  },
  warning: {
    base: 'bg-[var(--warning)] text-white border-transparent',
    hover: 'hover:bg-[var(--warning-hover,#d97706)]',
  },
  info: {
    base: 'bg-[var(--info)] text-white border-transparent',
    hover: 'hover:bg-[var(--info-hover,#1d4ed8)]',
  },
  outline: {
    base: 'bg-transparent text-text-main border border-border',
    hover: 'hover:bg-surface-muted',
  },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconOnly = false,
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const dimensionClasses = iconOnly
    ? sizeIconOnlyClasses[size]
    : sizeClasses[size];

  const variantStyle = variantClasses[variant];

  const classes = [
    'inline-flex items-center justify-center',
    'rounded-[var(--app-interactive-radius)]',
    'font-semibold',
    'transition-all duration-150 ease-in-out',
    dimensionClasses,
    variantStyle.base,
    isDisabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${variantStyle.hover}`,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={classes}
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="flex items-center text-base">
              {icon}
            </span>
          )}
          {!iconOnly && children}
          {icon && iconPosition === 'right' && (
            <span className="flex items-center text-base">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
};
