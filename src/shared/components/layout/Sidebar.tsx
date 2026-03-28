/**
 * Sidebar - Desktop sidebar navigation
 *
 * Updated: Session 004 - Removed section titles (all labels now empty)
 */
import React, { useMemo } from 'react';
import { Store } from 'lucide-react';
import { Select } from '../Select';
import { BrandHeader } from './BrandHeader';
import { NavLink } from './NavLink';
import { UserSection } from './UserSection';
import { filterNavigationByPermissions } from './navConfig';
import { useUserPermissions } from '@shared/hooks';
import type { AppUser } from '@types';
import type { Restaurant } from '@/types';

export interface SidebarProps {
    user?: AppUser | null;
    onLogout?: () => void;
    /** Restaurant context data (optional) */
    restaurants?: Restaurant[];
    currentRestaurant?: Restaurant | null;
    onSwitchRestaurant?: (restaurant: Restaurant) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    user,
    onLogout,
    restaurants = [],
    currentRestaurant,
    onSwitchRestaurant,
}) => {
    const { permissions } = useUserPermissions();

    // Filter navigation based on user permissions
    const filteredNavigation = useMemo(() => {
        return filterNavigationByPermissions(permissions);
    }, [permissions]);

    return (
        <aside
            style={{
                width: '280px',
                backgroundColor: 'var(--surface)',
                borderRight: '1px solid var(--border)',
                padding: 'var(--spacing-lg) 0',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflowY: 'auto',
                position: 'sticky',
                top: 0,
                height: '100vh',
                zIndex: 'var(--z-sticky)',
            }}
        >
            {/* Logo/Brand */}
            <BrandHeader />

            {/* Restaurant Selector - Always show if restaurants exist */}
            {restaurants.length > 0 && (
                <div style={{ padding: '0 var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                    <Select
                        label="Restaurante"
                        value={currentRestaurant ? String(currentRestaurant.id) : ''}
                        onChange={(value) => {
                            const restaurant = restaurants.find((r) => String(r.id) === value);
                            if (restaurant && onSwitchRestaurant) {
                                onSwitchRestaurant(restaurant);
                            }
                        }}
                        options={restaurants.map((r) => ({
                            value: String(r.id),
                            label: r.nombre,
                        }))}
                        fullWidth
                    />
                </div>
            )}

            {/* Restaurant Info - Solo mostrar si hay un restaurante seleccionado */}
            {currentRestaurant && (
                <div
                    style={{
                        padding: '0 var(--spacing-md)',
                        marginBottom: 'var(--spacing-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        paddingTop: 'var(--spacing-sm)',
                        paddingBottom: 'var(--spacing-sm)',
                        borderTop: '1px solid var(--border)',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <Store size={16} color="var(--text-secondary)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: '600',
                                color: 'var(--text-main)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {currentRestaurant.nombre}
                        </div>
                        <div
                            style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--text-secondary)',
                                marginTop: '2px',
                            }}
                        >
                            {currentRestaurant.codigo}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation - filtered by permissions */}
            <nav
                style={{
                    flex: 1,
                    padding: '0 var(--spacing-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)',
                    paddingBottom: 'var(--spacing-xl)',
                }}
            >
                {filteredNavigation.map((category) => (
                    <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        {/* Session 004: Only render label if not empty */}
                        {category.label && (
                            <div
                                style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: 'var(--text-light)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    paddingLeft: '12px',
                                    marginBottom: '4px',
                                    marginTop: 'var(--spacing-sm)',
                                }}
                            >
                                {category.label}
                            </div>
                        )}
                        {category.items.map((item) => (
                            <NavLink key={item.path} {...item} />
                        ))}
                    </div>
                ))}
            </nav>

            {/* User Section */}
            {user && <UserSection user={{ name: user.nombre }} onLogout={onLogout} />}
        </aside>
    );
};
