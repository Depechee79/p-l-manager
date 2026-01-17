import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  className?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  fullWidth = false,
  className = '',
  error,
  disabled = false,
  required = false,
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
    'input-container',
    fullWidth ? 'input-full-width' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      ref={containerRef}
      style={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto'
      }}
    >
      {label && (
        <label className="input-label">
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
              : '1px solid transparent',
          borderRadius: 'var(--radius)',
          padding: '0 16px',
          boxShadow: isOpen
            ? '0 0 0 2px rgba(225, 29, 72, 0.1)'
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
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        <span style={{
          color: selectedOption ? 'var(--text-main)' : 'var(--text-light)',
          fontSize: '15px',
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
            marginLeft: '8px',
          }}
        />
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '8px',
        }}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                color: option.value === value ? 'var(--accent)' : 'var(--text-main)',
                background: option.value === value
                  ? 'var(--surface-muted)'
                  : 'transparent',
                fontWeight: option.value === value ? '600' : '500',
                fontSize: '14px',
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
          fontSize: '12px',
          marginTop: '6px',
          display: 'block'
        }}>
          {error}
        </span>
      )}
    </div>
  );
};
