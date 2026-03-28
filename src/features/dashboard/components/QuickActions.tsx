/**
 * QuickActions - Dashboard quick action buttons with permission filtering
 *
 * Session 005: Added permission filtering - actions shown based on user role
 *
 * Permission mapping:
 * - Escanear Documento: ocr.create
 * - Nuevo Cierre: cierres.create
 * - Añadir Producto: inventarios.create
 * - Nuevo Escandallo: escandallos.create
 */
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@components';
import { ScanLine, Wallet, Package, ClipboardList } from 'lucide-react';
import { useUserPermissions } from '@shared/hooks/useUserPermissions';
import type { Permission } from '@types';

interface QuickAction {
    icon: React.ReactNode;
    label: string;
    link: string;
    color: string;
    requiredPermission?: Permission;
}

const ALL_ACTIONS: QuickAction[] = [
    { icon: <ScanLine size={24} />, label: 'Escanear Documento', link: '/ocr', color: 'var(--accent)', requiredPermission: 'ocr.create' },
    { icon: <Wallet size={24} />, label: 'Nuevo Cierre', link: '/cierres', color: 'var(--success)', requiredPermission: 'cierres.create' },
    { icon: <Package size={24} />, label: 'Añadir Producto', link: '/almacen', color: 'var(--info)', requiredPermission: 'inventarios.create' },
    { icon: <ClipboardList size={24} />, label: 'Nuevo Escandallo', link: '/escandallos', color: 'var(--warning)', requiredPermission: 'escandallos.create' },
];

export const QuickActions: React.FC = () => {
    const { hasPermission } = useUserPermissions();

    // Filter actions based on user permissions
    const visibleActions = useMemo(() => {
        return ALL_ACTIONS.filter(action =>
            !action.requiredPermission || hasPermission(action.requiredPermission)
        );
    }, [hasPermission]);

    // Don't render if no actions are visible
    if (visibleActions.length === 0) {
        return null;
    }

    return (
        <Card title="Accesos Rápidos">
            <div style={{
                display: 'grid',
                gridTemplateColumns: visibleActions.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: 'var(--spacing-md)'
            }}>
                {visibleActions.map((action, idx) => (
                    <Link
                        key={idx}
                        to={action.link}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--spacing-sm)',
                            padding: 'var(--spacing-lg)',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border)',
                            textDecoration: 'none',
                            color: 'var(--text-main)',
                            transition: 'all var(--transition-base)',
                            backgroundColor: 'var(--surface)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            e.currentTarget.style.borderColor = action.color;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                    >
                        <div style={{ color: action.color }}>{action.icon}</div>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500', textAlign: 'center' }}>
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </Card>
    );
};
