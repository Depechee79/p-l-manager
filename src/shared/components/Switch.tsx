import React from 'react';
import { SURFACE, SWITCH_SHADOW } from '@shared/tokens/colors';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled = false, size = 'md' }) => {
    const getSize = () => {
        switch (size) {
            case 'sm': return { width: 32, height: 18, circle: 14, translate: 14 };
            case 'lg': return { width: 52, height: 28, circle: 24, translate: 24 };
            default: return { width: 44, height: 24, circle: 20, translate: 20 };
        }
    };

    const dims = getSize();

    return (
        <div
            onClick={() => !disabled && onChange(!checked)}
            style={{
                width: `${dims.width}px`,
                height: `${dims.height}px`,
                background: disabled ? 'var(--surface-muted)' : (checked ? 'var(--primary)' : 'var(--border)'),
                borderRadius: '999px',
                position: 'relative',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease',
                opacity: disabled ? 0.6 : 1,
                flexShrink: 0
            }}
        >
            <div
                style={{
                    width: `${dims.circle}px`,
                    height: `${dims.circle}px`,
                    background: SURFACE,
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '2px', // Centrado vertical aproximado (height - circle) / 2
                    left: '2px',
                    transform: checked ? `translateX(${dims.translate}px)` : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    boxShadow: SWITCH_SHADOW
                }}
            />
        </div>
    );
};
