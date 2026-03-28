/**
 * MobileBottomNav - Scrollable bottom navigation for mobile
 *
 * Updated: Session 002 - Changed from 5 fixed tabs to horizontal scroll
 * Now shows ALL navigation items, matching desktop sidebar content
 * Filters items based on user permissions
 */
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { filterNavigationByPermissions } from './navConfig';
import { useUserPermissions } from '@shared/hooks';

export const MobileBottomNav: React.FC = () => {
    const location = useLocation();
    const { permissions } = useUserPermissions();

    // Filter navigation by permissions and flatten to single array
    const visibleItems = useMemo(() => {
        const filteredNav = filterNavigationByPermissions(permissions);
        return filteredNav.flatMap(cat => cat.items);
    }, [permissions]);

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
                alignItems: 'center',
                padding: '8px 12px',
                zIndex: 'var(--z-fixed)',
                boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
                // Scrollable horizontal
                overflowX: 'auto',
                overflowY: 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE/Edge
                gap: '4px',
            }}
            className="mobile-bottom-nav"
        >
            {/* Inline style to hide webkit scrollbar */}
            <style>{`
                .mobile-bottom-nav::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {visibleItems.map((item) => {
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
                            gap: '2px',
                            textDecoration: 'none',
                            color: active ? 'var(--accent)' : 'var(--text-secondary)',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius)',
                            minWidth: '52px',
                            maxWidth: '64px',
                            flexShrink: 0, // Prevent items from shrinking
                            transition: 'all 200ms',
                            background: active ? 'var(--surface-muted)' : 'transparent',
                        }}
                    >
                        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                        <span
                            style={{
                                fontSize: '9px',
                                fontWeight: active ? '600' : '500',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
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
