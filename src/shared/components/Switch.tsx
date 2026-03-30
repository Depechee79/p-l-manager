import { useCallback } from 'react';
import { SURFACE, SWITCH_SHADOW } from '@shared/tokens/colors';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  id?: string;
}

const SIZES = {
  sm: { width: 32, height: 18, circle: 14, translate: 14 },
  md: { width: 44, height: 24, circle: 20, translate: 20 },
  lg: { width: 52, height: 28, circle: 24, translate: 24 },
} as const;

export function Switch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  id,
}: SwitchProps) {
  const dims = SIZES[size];

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [disabled, checked, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  }, [disabled, checked, onChange]);

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        width: `${dims.width}px`,
        height: `${dims.height}px`,
        minHeight: '44px',
        minWidth: '44px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        background: disabled ? 'var(--surface-muted)' : (checked ? 'var(--primary)' : 'var(--border)'),
        borderRadius: '999px',
        border: 'none',
        padding: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s ease',
        opacity: disabled ? 0.6 : 1,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${dims.circle}px`,
          height: `${dims.circle}px`,
          background: SURFACE,
          borderRadius: 'var(--radius-full)',
          position: 'absolute',
          top: '2px',
          left: '2px',
          transform: checked ? `translateX(${dims.translate}px)` : 'translateX(0)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
          boxShadow: SWITCH_SHADOW,
          pointerEvents: 'none',
        }}
      />
    </button>
  );
}
