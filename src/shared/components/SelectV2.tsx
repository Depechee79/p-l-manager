/**
 * SelectV2 - Custom Select with V2 Design System
 *
 * Features:
 * - Uses CSS classes from index.css for consistent styling
 * - V2 tokens: --app-interactive-h, --app-interactive-radius
 * - Dropdown items match notification dropdown hover style
 * - Keyboard navigation support
 */
import React, { useState, useRef, useEffect, SelectHTMLAttributes } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ComponentBaseProps } from '../types';

export interface SelectV2Option {
  value: string;
  label: string;
}

export interface SelectV2Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'value' | 'onChange' | 'style'>, ComponentBaseProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectV2Option[];
  placeholder?: string;
  fullWidth?: boolean;
  id?: string;
  error?: string;
  /** Compact mode for filter inputs - smaller height */
  compact?: boolean;
}

export const SelectV2: React.FC<SelectV2Props> = ({
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
  compact = false,
  style,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const selectedIndex = options.findIndex(opt => opt.value === value);

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

  // Reset highlight when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('.select-v2-option');
      const item = items[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => Math.max(prev - 1, 0));
        }
        break;
      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
        }
        break;
    }
  };

  const containerClasses = [
    'select-v2-container',
    fullWidth ? 'select-v2-full-width' : '',
    disabled ? 'select-v2-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const triggerClasses = [
    'select-v2-trigger',
    compact ? 'select-v2-compact' : '',
    isOpen ? 'select-v2-open' : '',
    error ? 'select-v2-error' : '',
  ].filter(Boolean).join(' ');

  const selectId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <div
      className={containerClasses}
      ref={containerRef}
      style={style}
    >
      {label && (
        <label className="select-v2-label" htmlFor={selectId}>
          {label}
          {required && <span className="select-v2-required"> *</span>}
        </label>
      )}

      <div
        className={triggerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${selectId}-listbox`}
        aria-labelledby={label ? `${selectId}-label` : undefined}
      >
        <span className={`select-v2-value ${!selectedOption ? 'select-v2-placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={compact ? 14 : 18}
          className={`select-v2-chevron ${isOpen ? 'select-v2-chevron-open' : ''}`}
        />
      </div>

      {isOpen && !disabled && (
        <div
          className="select-v2-dropdown"
          ref={listRef}
          role="listbox"
          id={`${selectId}-listbox`}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`select-v2-option ${option.value === value ? 'select-v2-option-selected' : ''} ${index === highlightedIndex ? 'select-v2-option-highlighted' : ''}`}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={option.value === value}
            >
              <span className="select-v2-option-label">{option.label}</span>
              {option.value === value && (
                <Check size={14} className="select-v2-option-check" />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <span className="select-v2-error-text">{error}</span>
      )}

      {/* Hidden select for form integration */}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ display: 'none' }}
        required={required}
        disabled={disabled}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};
