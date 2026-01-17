import { useRef } from 'react';
import { Clock } from 'lucide-react';

export interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  step?: number;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
  fullWidth = false,
  className = '',
  disabled = false,
  step = 60,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!disabled && inputRef.current) {
      e.preventDefault();
      e.stopPropagation();
      // Trigger native time picker
      setTimeout(() => {
        inputRef.current?.showPicker?.();
      }, 10);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!disabled) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        inputRef.current?.showPicker?.();
      }, 10);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
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
        <label className="input-label" htmlFor={`timepicker-${label}`}>
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
          id={`timepicker-${label}`}
          type="time"
          value={value}
          onChange={handleTimeChange}
          onClick={handleInputClick}
          onFocus={handleInputFocus}
          required={required}
          disabled={disabled}
          step={step}
          readOnly
          className="input-field time-picker-input"
          style={{
            width: '100%',
            padding: '10px 40px 10px 14px',
            height: 'var(--height-input)',
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
          <Clock size={18} />
        </div>
      </div>

      {error && (
        <span style={{
          fontSize: '12px',
          color: 'var(--danger)',
          marginTop: '6px',
          display: 'block'
        }}>
          {error}
        </span>
      )}

      <style>{`
        .time-picker-input::-webkit-calendar-picker-indicator {
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 2;
        }
        
        .time-picker-input::-webkit-datetime-edit {
          padding: 0;
          color: var(--text-main);
        }
        
        .time-picker-input::-webkit-datetime-edit-fields-wrapper {
          padding: 0;
        }
        
        .time-picker-input::-webkit-datetime-edit-text {
          color: var(--text-secondary);
          padding: 0 2px;
        }
        
        .time-picker-input::-webkit-datetime-edit-hour-field,
        .time-picker-input::-webkit-datetime-edit-minute-field {
          color: var(--text-main);
          padding: 0 2px;
        }
        
        .time-picker-input:focus {
          outline: none;
          background-color: var(--surface);
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1);
        }
        
        .time-picker-input:hover:not(:disabled) {
          background-color: var(--surface);
          border-color: var(--border-focus);
        }
      `}</style>
    </div>
  );
};
