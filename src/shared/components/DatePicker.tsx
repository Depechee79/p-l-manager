import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  error?: string;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  required = false,
  error,
  fullWidth = false,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!disabled && inputRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
      // Trigger native date picker
      setTimeout(() => {
        inputRef.current?.showPicker?.();
      }, 10);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!disabled) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
      setTimeout(() => {
        inputRef.current?.showPicker?.();
      }, 10);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (!disabled && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.showPicker?.();
      }, 10);
    }
  };

  const containerClasses = [
    'input-container',
    fullWidth ? 'input-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} ref={containerRef} style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label className="input-label" htmlFor={`datepicker-${label}`}>
          {label}
          {required && <span style={{ color: 'var(--danger)' }}> *</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={handleContainerClick}
      >
        <input
          ref={inputRef}
          id={`datepicker-${label}`}
          type="date"
          value={value}
          onChange={handleDateChange}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          readOnly
          className="input-field date-picker-input"
          style={{
            width: '100%',
            height: 'var(--height-input)',
            boxSizing: 'border-box',
            padding: '0 40px 0 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 200ms ease',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--font-size-base)',
            backgroundColor: error ? 'var(--danger-bg)' : 'var(--surface-muted)',
            border: error
              ? '1px solid var(--danger)'
              : '1px solid transparent',
            borderRadius: 'var(--radius)',
            color: 'var(--text-main)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: error ? 'var(--danger)' : 'var(--text-secondary)',
            zIndex: 1,
          }}
        >
          <Calendar size={18} />
        </div>
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

      <style>{`
        .date-picker-input::-webkit-calendar-picker-indicator {
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }
        
        .date-picker-input::-webkit-datetime-edit {
          padding: 0;
          color: var(--text-main);
        }
        
        .date-picker-input::-webkit-datetime-edit-fields-wrapper {
          padding: 0;
        }
        
        .date-picker-input::-webkit-datetime-edit-text {
          color: var(--text-secondary);
          padding: 0 2px;
        }
        
        .date-picker-input::-webkit-datetime-edit-month-field,
        .date-picker-input::-webkit-datetime-edit-day-field,
        .date-picker-input::-webkit-datetime-edit-year-field {
          color: var(--text-main);
          padding: 0 2px;
        }
        
        .date-picker-input:focus {
          outline: none;
          background-color: var(--surface);
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1);
        }
        
        .date-picker-input:hover:not(:disabled) {
          background-color: var(--surface);
          border-color: var(--border-focus);
        }
      `}</style>
    </div>
  );
};
