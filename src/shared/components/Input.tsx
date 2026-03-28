import { InputHTMLAttributes, ReactNode } from 'react';
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

export const Input = ({
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
  ...props
}: InputProps) => {
  const inputId = id || generateId('input');
  const fullWidthClass = fullWidth ? 'input-full-width' : '';

  const containerClasses = ['input-container', fullWidthClass, className]
    .filter(Boolean)
    .join(' ');

  const inputStyle: React.CSSProperties = {
    ...style,
    paddingLeft: icon && iconPosition === 'left' ? '40px' : style?.paddingLeft || '12px',
    paddingRight: icon && iconPosition === 'right' ? '40px' : style?.paddingRight || '12px',
  };

  return (
    <div className={containerClasses} style={{ width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label
          htmlFor={inputId}
          className="input-label"
        >
          {label}
          {required && <span style={{ color: 'var(--danger)' }}> *</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          className="input-field"
          required={required}
          style={{
            ...inputStyle,
            backgroundColor: error ? 'var(--danger-bg)' : success ? 'var(--success-bg)' : 'var(--surface-muted)',
            border: error
              ? '1px solid var(--danger)'
              : success
                ? '1px solid var(--success)'
                : '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-main)',
            fontSize: 'var(--font-size-sm)', // 12px - Unified scale
            fontFamily: 'var(--font-body)',
            height: 'var(--height-input)',
            boxSizing: 'border-box',
            transition: 'all 200ms ease',
          }}
          {...props}
        />
        {icon && iconPosition === 'left' && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </div>
        )}
        {(icon && iconPosition === 'right') || error || success ? (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {error ? (
              <AlertCircle size={18} color="var(--danger)" />
            ) : success ? (
              <CheckCircle size={18} color="var(--success)" />
            ) : icon ? (
              <div style={{ color: 'var(--text-secondary)' }}>{icon}</div>
            ) : null}
          </div>
        ) : null}
      </div>
      {error && (
        <span style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--danger)',
          marginTop: 'var(--spacing-xs)',
          display: 'block'
        }}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-secondary)',
          marginTop: 'var(--spacing-xs)',
          display: 'block'
        }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
