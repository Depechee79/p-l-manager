/**
 * MobileBottomNav - Bottom navigation with overflow menu for mobile
 *
 * UX_CONTRACT Section 7.4: Maximum 5 items visible. "More" overflow menu for additional pages.
 * Active item has accent color indicator.
 *
 * Shows 4 primary items + "Mas" button that opens overflow menu with remaining items.
 * If current route is in the overflow menu, "Mas" button shows as active.
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { filterNavigationByPermissions } from './navConfig';
import type { NavItem } from './navConfig';
import { useUserPermissions } from '@shared/hooks';

/** Paths that appear in the primary nav bar (first 4 items) */
const PRIMARY_PATHS = new Set(['/', '/cierres', '/almacen', '/equipo']);

/** Maximum items in the bottom nav bar (including "Mas" button) */
const MAX_VISIBLE = 5;

export const MobileBottomNav: React.FC = () => {
    const location = useLocation();
    const { permissions } = useUserPermissions();
    const [overflowOpen, setOverflowOpen] = useState(false);

    // Close overflow menu on route change
    useEffect(() => {
        setOverflowOpen(false);
    }, [location.pathname]);

    // Filter navigation by permissions and split into primary/overflow
    const { primaryItems, overflowItems } = useMemo(() => {
        const filteredNav = filterNavigationByPermissions(permissions);
        const allItems = filteredNav.flatMap(cat => cat.items);

        const primary: NavItem[] = [];
        const overflow: NavItem[] = [];

        for (const item of allItems) {
            if (PRIMARY_PATHS.has(item.path) && primary.length < MAX_VISIBLE - 1) {
                primary.push(item);
            } else {
                overflow.push(item);
            }
        }

        return { primaryItems: primary, overflowItems: overflow };
    }, [permissions]);

    const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

    // "Mas" button is active if the current route is in the overflow items
    const isOverflowActive = useMemo(
        () => overflowItems.some(item => isActive(item.path)),
        [overflowItems, isActive]
    );

    const toggleOverflow = useCallback(() => {
        setOverflowOpen(prev => !prev);
    }, []);

    const closeOverflow = useCallback(() => {
        setOverflowOpen(false);
    }, []);

    return (
        <>
            {/* Backdrop overlay */}
            {overflowOpen && (
                <div
                    onClick={closeOverflow}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 'var(--z-fixed)' as string,
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Overflow menu */}
            {overflowOpen && (
                <div
                    role="menu"
                    style={{
                        position: 'fixed',
                        bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
                        right: '8px',
                        backgroundColor: 'var(--surface)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '8px 0',
                        zIndex: 'var(--z-fixed)' as string,
                        minWidth: '200px',
                        border: '1px solid var(--border)',
                    }}
                >
                    {overflowItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                role="menuitem"
                                onClick={closeOverflow}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    textDecoration: 'none',
                                    color: active ? 'var(--accent)' : 'var(--text-main)',
                                    backgroundColor: active ? 'var(--surface-muted)' : 'transparent',
                                    minHeight: '44px',
                                    transition: 'background-color 150ms',
                                    fontSize: '14px',
                                    fontWeight: active ? '600' : '400',
                                }}
                            >
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Bottom navigation bar */}
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
                    justifyContent: 'space-around',
                    padding: '8px 12px env(safe-area-inset-bottom, 0px)',
                    paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
                    zIndex: 'var(--z-fixed)' as string,
                    boxShadow: 'var(--shadow)',
                }}
            >
                {/* Primary nav items */}
                {primaryItems.map((item) => {
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
                                minWidth: '44px',
                                minHeight: '44px',
                                transition: 'all 200ms',
                                background: active ? 'var(--surface-muted)' : 'transparent',
                            }}
                        >
                            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontWeight: active ? '600' : '500',
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* "Mas" overflow button */}
                {overflowItems.length > 0 && (
                    <button
                        type="button"
                        onClick={toggleOverflow}
                        aria-expanded={overflowOpen}
                        aria-haspopup="menu"
                        aria-label="Mas opciones de navegacion"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            color: isOverflowActive || overflowOpen
                                ? 'var(--accent)'
                                : 'var(--text-secondary)',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius)',
                            minWidth: '44px',
                            minHeight: '44px',
                            transition: 'all 200ms',
                            background: isOverflowActive || overflowOpen
                                ? 'var(--surface-muted)'
                                : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        <LayoutGrid
                            size={20}
                            strokeWidth={isOverflowActive || overflowOpen ? 2.5 : 2}
                        />
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: isOverflowActive || overflowOpen ? '600' : '500',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Mas
                        </span>
                    </button>
                )}
            </nav>
        </>
    );
};
