/**
 * Navigation configuration for Layout
 * Extracted for reuse across Sidebar, MobileNav, MobileBottomNav
 *
 * Updated: Session 004 - Complete UI Reorganization
 * - Removed section titles
 * - Reordered: Dashboard > Docs > Cierres > Escandallos > Almacen > Plantilla > P&L > Config
 * - Removed separate routes for Proveedores, Traspasos, Gastos Fijos (now tabs)
 * - Renamed: Facturas -> Docs, Recetas y Costes -> Escandallos
 */
import {
    LayoutDashboard,
    FileStack,
    Wallet,
    ClipboardList,
    BarChart3,
    Users,
    Settings,
    Warehouse,
    type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@types';

export interface NavItem {
    path: string;
    label: string;
    icon: LucideIcon;
    /** Optional permissions required to see this item */
    requiredPermissions?: Permission[];
}

export interface NavCategory {
    id: string;
    label: string;
    items: NavItem[];
}

/**
 * All navigation categories and items for the application
 *
 * Session 004: Simplified navigation without section titles
 * New order: Dashboard > Docs > Cierres > Escandallos > Almacen > Plantilla > P&L > Config
 */
export const navigation: NavCategory[] = [
    {
        id: 'main',
        label: '',  // No section title
        items: [
            { path: '/', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/docs', label: 'Docs', icon: FileStack },
            { path: '/cierres', label: 'Cierres', icon: Wallet },
            { path: '/escandallos', label: 'Escandallos', icon: ClipboardList },
            { path: '/almacen', label: 'Almacen', icon: Warehouse },
            { path: '/equipo', label: 'Equipo', icon: Users },  // AUDIT-FIX: P1.3 unified naming
            { path: '/pnl', label: 'P&L', icon: BarChart3, requiredPermissions: ['pnl.view'] },
            { path: '/configuracion', label: 'Configuracion', icon: Settings, requiredPermissions: ['configuracion.edit'] },
        ]
    }
];

/**
 * Flat list of all nav items for legacy support
 */
export const navItems = navigation.flatMap(cat => cat.items);

/**
 * Get all nav items as flat array (for mobile scrollable nav)
 */
export const getAllNavItems = (): NavItem[] => {
    return navigation.flatMap(cat => cat.items);
};

/**
 * Filter navigation items based on user permissions
 * @param userPermissions - Array of permissions the user has
 * @returns Filtered navigation categories
 */
export const filterNavigationByPermissions = (userPermissions: Permission[]): NavCategory[] => {
    return navigation.map(category => ({
        ...category,
        items: category.items.filter(item => {
            // If no required permissions, always show
            if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
                return true;
            }
            // Check if user has any of the required permissions
            return item.requiredPermissions.some(perm => userPermissions.includes(perm));
        })
    })).filter(category => category.items.length > 0); // Remove empty categories
};

/**
 * @deprecated Use navigation directly or getAllNavItems() for mobile
 * Kept for backwards compatibility during migration
 * Updated Session 004: Match new navigation structure
 */
export const mobileBottomNavItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/docs', label: 'Docs', icon: FileStack },
    { path: '/cierres', label: 'Cierres', icon: Wallet },
    { path: '/almacen', label: 'Almacen', icon: Warehouse },
    { path: '/pnl', label: 'P&L', icon: BarChart3 },
];
