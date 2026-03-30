import { InputHTMLAttributes, ReactNode, FocusEvent, useCallback } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { generateId } from '../utils';
import { ComponentBaseProps } from '../types';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>, ComponentBaseProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  success?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  required,
  icon,
  iconPosition = 'right',
  success = false,
  style,
  onFocus,
  ...props
}: InputProps) {
  const inputId = id || generateId('input');

  const handleFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
    if (props.type === 'number' && e.target.value === '0') {
      e.target.select();
    }
    onFocus?.(e);
  }, [props.type, onFocus]);

  const containerClasses = [
    'input-container',
    fullWidth ? 'input-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'input-field',
    error ? 'input-field-error' : '',
    success ? 'input-field-success' : '',
    icon && iconPosition === 'left' ? 'input-has-icon-left' : '',
    (icon && iconPosition === 'right') || error || success ? 'input-has-icon-right' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} style={fullWidth ? { width: '100%' } : undefined}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required-mark"> *</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={inputId}
          className={inputClasses}
          required={required}
          style={style}
          onFocus={handleFocus}
          {...props}
        />
        {icon && iconPosition === 'left' && (
          <div className="input-icon input-icon-left">
            {icon}
          </div>
        )}
        {(icon && iconPosition === 'right') || error || success ? (
          <div className="input-icon input-icon-right">
            {error ? (
              <AlertCircle size={18} color="var(--danger)" />
            ) : success ? (
              <CheckCircle size={18} color="var(--success)" />
            ) : icon ? (
              icon
            ) : null}
          </div>
        ) : null}
      </div>
      {error && (
        <span className="input-error-text">{error}</span>
      )}
      {!error && helperText && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
}
