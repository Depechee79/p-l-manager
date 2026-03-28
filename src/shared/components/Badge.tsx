import React from 'react';
import { SUCCESS, WARNING, DANGER, INFO } from '@shared/tokens/colors';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    style = {}
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'success': return { background: 'var(--success-bg)', color: SUCCESS, border: `1px solid var(--success-border)` };
            case 'warning': return { background: 'var(--warning-bg)', color: WARNING, border: `1px solid var(--warning-border)` };
            case 'danger': return { background: 'var(--danger-bg)', color: DANGER, border: `1px solid var(--danger-border)` };
            case 'info': return { background: 'var(--info-bg)', color: INFO, border: `1px solid var(--info-border)` };
            case 'secondary': return { background: 'var(--surface-muted)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
            case 'outline': return { background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' };
            case 'primary':
            default: return { background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', border: '1px solid rgba(var(--primary-rgb), 0.2)' };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm': return { fontSize: '12px', padding: '2px 8px' };
            case 'lg': return { fontSize: '14px', padding: '6px 16px' };
            case 'md':
            default: return { fontSize: '12px', padding: '4px 12px' };
        }
    };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            ...getVariantStyles(),
            ...getSizeStyles(),
            ...style
        }}>
            {children}
        </span>
    );
};
