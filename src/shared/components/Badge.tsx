import React from 'react';

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
            case 'success': return { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' };
            case 'warning': return { background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' };
            case 'danger': return { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
            case 'info': return { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' };
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
