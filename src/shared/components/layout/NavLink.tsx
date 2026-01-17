/**
 * NavLink - Reusable navigation link component
 * Extracted from Layout.tsx for consistency across sidebar components
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface NavLinkProps {
    path: string;
    label: string;
    icon: LucideIcon;
    onClick?: () => void;
}

export const NavLink: React.FC<NavLinkProps> = ({ path, label, icon: Icon, onClick }) => {
    const location = useLocation();
    const active = location.pathname === path;

    return (
        <Link
            to={path}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                textDecoration: 'none',
                color: active ? 'var(--surface)' : 'var(--text-secondary)',
                background: active ? 'var(--accent)' : 'transparent',
                borderRadius: 'var(--radius)',
                fontWeight: active ? '600' : '500',
                transition: 'all 200ms ease',
                border: 'none',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'var(--surface-muted)';
                    e.currentTarget.style.color = 'var(--text-main)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                }
            }}
        >
            <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                style={{ flexShrink: 0 }}
            />
            <span style={{ fontSize: '14px' }}>{label}</span>
        </Link>
    );
};
