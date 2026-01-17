import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@components';
import { ScanLine, Wallet, Package, ClipboardList } from 'lucide-react';

export const QuickActions: React.FC = () => {
    const actions = [
        { icon: <ScanLine size={24} />, label: 'Escanear Documento', link: '/ocr', color: 'var(--accent)' },
        { icon: <Wallet size={24} />, label: 'Nuevo Cierre', link: '/cierres', color: 'var(--success)' },
        { icon: <Package size={24} />, label: 'Añadir Producto', link: '/inventario', color: 'var(--info)' },
        { icon: <ClipboardList size={24} />, label: 'Nuevo Escandallo', link: '/escandallos', color: 'var(--warning)' },
    ];

    return (
        <Card title="Accesos Rápidos">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                {actions.map((action, idx) => (
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
