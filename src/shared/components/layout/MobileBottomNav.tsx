/**
 * MobileBottomNav - Bottom tab navigation for mobile
 * Extracted from Layout.tsx
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { mobileBottomNavItems } from './navConfig';

export const MobileBottomNav: React.FC = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '8px 0',
                zIndex: 100,
                boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
        >
            {mobileBottomNavItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                            color: active ? 'var(--accent)' : 'var(--text-secondary)',
                            padding: '8px 12px',
                            borderRadius: 'var(--radius)',
                            minWidth: '60px',
                            transition: 'all 200ms',
                            background: active ? 'var(--surface-muted)' : 'transparent',
                        }}
                    >
                        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: active ? '600' : '500',
                                textAlign: 'center',
                            }}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};
