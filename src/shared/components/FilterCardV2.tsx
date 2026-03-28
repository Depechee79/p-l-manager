/**
 * FilterCardV2 - Compact filter panel with V2 design system
 *
 * Session 007: New design matching Almacen reference
 * Features:
 * - White card with subtle border and shadow
 * - Compact filter inputs (32px height)
 * - Uppercase tiny labels (8px)
 * - Grid layout responsive
 */
import React from 'react';
import type { ReactNode } from 'react';

export interface FilterCardV2Props {
  children: ReactNode;
  /** Number of columns (default: 4) */
  columns?: 1 | 2 | 3 | 4;
  /** Extra class name */
  className?: string;
}

export const FilterCardV2: React.FC<FilterCardV2Props> = ({
  children,
  columns = 4,
  className = '',
}) => {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`bg-surface p-5 rounded-[var(--radius)] shadow-sm border border-border ${className}`}>
      <div className={`grid ${colsClass} gap-sm`}>
        {children}
      </div>
    </div>
  );
};

/**
 * FilterInputV2 - Compact filter input with label
 */
export interface FilterInputV2Props {
  label: string;
  children: ReactNode;
  /** Make this input grow to fill available space */
  grow?: boolean;
}

export const FilterInputV2: React.FC<FilterInputV2Props> = ({
  label,
  children,
  grow = false,
}) => {
  return (
    <div className={`flex flex-col ${grow ? 'flex-1' : ''}`}>
      <label className="block text-[var(--app-filter-label-size)] font-bold text-text-light uppercase tracking-[0.1em] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
};

/**
 * Compact text input for filters
 */
export interface FilterTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
}

export const FilterTextInput: React.FC<FilterTextInputProps> = ({
  value,
  onChange,
  placeholder = '',
  icon,
}) => {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-light flex items-center pointer-events-none">
          {icon}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full h-[var(--app-filter-input-h)]
          ${icon ? 'pl-8 pr-3' : 'px-3'}
          bg-surface-muted border-none rounded-[var(--app-interactive-radius)]
          text-[var(--app-filter-input-size)] text-text-main
          outline-none transition-all duration-150
          focus:ring-1 focus:ring-accent focus:ring-offset-0
          focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]
        `.replace(/\s+/g, ' ').trim()}
      />
    </div>
  );
};

/**
 * Compact select for filters - Custom dropdown with V2 design
 */
export interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  options,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  React.useEffect(() => {
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

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full min-h-[44px] pl-3 pr-8 bg-surface-muted border-none
          rounded-[var(--app-interactive-radius)] text-[var(--app-filter-input-size)]
          font-medium text-text-main cursor-pointer transition-all duration-150
          text-left flex items-center box-border outline-none
          ${isOpen ? 'ring-1 ring-accent shadow-[0_0_0_3px_rgba(225,29,72,0.1)]' : ''}
        `.replace(/\s+/g, ' ').trim()}
      >
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {selectedOption?.label || 'Seleccionar...'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-secondary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-[var(--app-interactive-radius)] shadow-lg z-[1000] max-h-[280px] overflow-y-auto p-1">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer text-sm
                transition-colors duration-150
                ${option.value === value
                  ? 'font-semibold text-accent bg-surface-muted'
                  : 'font-medium text-text-main bg-transparent hover:bg-surface-muted'
                }
              `.replace(/\s+/g, ' ').trim()}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
