import React, { useState, useRef, useEffect, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { ComponentBaseProps } from '../types';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'value' | 'onChange' | 'style'>, ComponentBaseProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  id?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  fullWidth = false,
  className = '',
  id,
  error,
  disabled = false,
  required = false,
  style,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const containerClasses = [
    'select-container',
    fullWidth ? 'select-full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      ref={containerRef}
      style={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
        ...style
      }}
    >
      {label && (
        <label className="input-label" htmlFor={id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`}>
          {label}
          {required && <span style={{ color: 'var(--danger)' }}> *</span>}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: error
            ? 'var(--danger-bg)'
            : 'var(--surface-muted)',
          border: error
            ? '1px solid var(--danger)'
            : isOpen
              ? '1px solid var(--accent)'
              : '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '8px 14px',
          boxShadow: isOpen
            ? 'var(--shadow-accent-intense)'
            : 'none',
          transition: 'all 200ms ease',
          height: 'var(--height-input)',
          boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen && !error) {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !error) {
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
      >
        <span style={{
          color: selectedOption ? 'var(--text-main)' : 'var(--text-light)',
          fontSize: 'var(--font-size-base)',
          flex: 1,
          textAlign: 'left',
          fontFamily: 'var(--font-body)',
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          color="var(--text-secondary)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms ease',
            flexShrink: 0,
            marginLeft: 'var(--spacing-xs)',
          }}
        />
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 'var(--spacing-xs)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          padding: 'var(--spacing-xs)',
        }}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                color: option.value === value ? 'var(--accent)' : 'var(--text-main)',
                background: option.value === value
                  ? 'var(--surface-muted)'
                  : 'transparent',
                fontWeight: option.value === value ? '600' : '500',
                fontSize: 'var(--font-size-sm)',
                transition: 'all 150ms',
                marginBottom: '2px',
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.background = 'var(--surface-muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {error && (
        <span style={{
          color: 'var(--danger)',
          fontSize: 'var(--font-size-xs)',
          marginTop: 'var(--spacing-xs)',
          display: 'block'
        }}>
          {error}
        </span>
      )}
      {/* Hidden select for form integration if needed */}
      <select
        id={id || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ display: 'none' }}
        required={required}
        disabled={disabled}
        {...props}
      >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
};
