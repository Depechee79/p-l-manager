import { useState, useRef, useEffect, useCallback, SelectHTMLAttributes } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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

export function Select({
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
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase() || 'unnamed'}`;
  const listboxId = `${selectId}-listbox`;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const option = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      option?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else {
          setIsOpen(true);
          const currentIndex = options.findIndex(opt => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = options.findIndex(opt => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
        } else {
          setHighlightedIndex(prev => (prev + 1) % options.length);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const currentIndex = options.findIndex(opt => opt.value === value);
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : options.length - 1);
        } else {
          setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      }
      case 'Home': {
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      }
      case 'End': {
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(options.length - 1);
        }
        break;
      }
      case 'Tab': {
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      }
    }
  }, [isOpen, highlightedIndex, options, value, handleSelect]);

  const containerClasses = [
    'select-v2-container',
    fullWidth ? 'select-v2-full-width' : '',
    disabled ? 'select-v2-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  const triggerClasses = [
    'select-v2-trigger',
    isOpen ? 'select-v2-open' : '',
    error ? 'select-v2-error' : '',
  ].filter(Boolean).join(' ');

  const valueClasses = [
    'select-v2-value',
    !selectedOption ? 'select-v2-placeholder' : '',
  ].filter(Boolean).join(' ');

  const chevronClasses = [
    'select-v2-chevron',
    isOpen ? 'select-v2-chevron-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      ref={containerRef}
      style={style}
    >
      {label && (
        <label className="input-label" htmlFor={selectId}>
          {label}
          {required && <span className="input-required-mark"> *</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        className={triggerClasses}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              const currentIndex = options.findIndex(opt => opt.value === value);
              setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-labelledby={label ? `${selectId}-label` : undefined}
      >
        <span className={valueClasses}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={chevronClasses} />
      </button>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          className="select-v2-dropdown"
          role="listbox"
          id={listboxId}
          aria-label={label || 'Opciones'}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            const optionClasses = [
              'select-v2-option',
              isSelected ? 'select-v2-option-selected' : '',
              isHighlighted ? 'select-v2-option-highlighted' : '',
            ].filter(Boolean).join(' ');

            return (
              <div
                key={option.value}
                className={optionClasses}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="select-v2-option-label">{option.label}</span>
                {isSelected && (
                  <Check size={16} className="select-v2-option-check" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <span className="select-v2-error-text">{error}</span>
      )}

      {/* Hidden native select for form integration */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ display: 'none' }}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
