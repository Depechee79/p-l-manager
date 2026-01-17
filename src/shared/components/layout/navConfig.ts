/**
 * Navigation configuration for Layout
 * Extracted for reuse across Sidebar, MobileNav, MobileBottomNav
 */
import {
    LayoutDashboard,
    ScanLine,
    Wallet,
    Building2,
    Package,
    ClipboardList,
    BarChart3,
    ClipboardCheck,
    Users,
    Activity,
    Sparkles,
    ArrowRight,
    Settings,
    Shield,
    type LucideIcon,
} from 'lucide-react';

export interface NavItem {
    path: string;
    label: string;
    icon: LucideIcon;
}

export interface NavCategory {
    id: string;
    label: string;
    items: NavItem[];
}

/**
 * All navigation categories and items for the application
 */
export const navigation: NavCategory[] = [
    {
        id: 'operaciones',
        label: 'Operaciones',
        items: [
            { path: '/', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/cierres', label: 'Cierres', icon: Wallet },
            { path: '/mermas', label: 'Mermas', icon: Activity },
        ]
    },
    {
        id: 'almacen',
        label: 'Almacén',
        items: [
            { path: '/inventarios', label: 'Inventarios', icon: ClipboardCheck },
            { path: '/pedidos', label: 'Pedidos', icon: Package },
            { path: '/ocr', label: 'Facturas', icon: ScanLine },
            { path: '/proveedores', label: 'Proveedores', icon: Building2 },
            { path: '/transferencias', label: 'Traspasos', icon: ArrowRight },
        ]
    },
    {
        id: 'equipo',
        label: 'Equipo',
        items: [
            { path: '/equipo', label: 'Gestión Humana', icon: Users },
            { path: '/roles', label: 'Roles y Permisos', icon: Shield },
        ]
    },
    {
        id: 'estrategia',
        label: 'Estrategia',
        items: [
            { path: '/pnl', label: 'P&L', icon: BarChart3 },
            { path: '/escandallos', label: 'Escandallos', icon: ClipboardList },
            { path: '/ingenieria-menu', label: 'Ingeniería Menú', icon: Sparkles },
        ]
    },
    {
        id: 'configuracion',
        label: 'Configuración',
        items: [
            { path: '/configuracion', label: 'Configuración', icon: Settings },
        ]
    }
];

// Legacy support for other components while they migrate
export const navItems = navigation.flatMap(cat => cat.items);

/**
 * Items for mobile bottom navigation (subset of navItems)
 */
export const mobileBottomNavItems: NavItem[] = [
    { path: '/', label: 'Inicio', icon: LayoutDashboard },
    { path: '/ocr', label: 'Facturas', icon: ScanLine },
    { path: '/cierres', label: 'Cierres', icon: Wallet },
    { path: '/inventarios', label: 'Logística', icon: ClipboardCheck },
    { path: '/pnl', label: 'Estrategia', icon: BarChart3 },
];

