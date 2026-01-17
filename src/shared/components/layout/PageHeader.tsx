/**
 * PageHeader - Standardized page header component
 * 
 * Ensures consistent layout across all pages per R-13 rule.
 * All pages should use this component for their header section.
 * 
 * @example
 * <PageHeader
 *   title="Pedidos"
 *   description="Gestión de pedidos a proveedores"
 *   action={<Button>Nuevo Pedido</Button>}
 * />
 */
import React from 'react';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
    /** Main page title */
    title: string;
    /** Optional description below title */
    description?: string;
    /** Optional action buttons (right side) */
    action?: ReactNode;
    /** Optional icon component */
    icon?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    action,
    icon,
}) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-3)',
        }}>
            <div>
                <h1 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-heading)',
                    display: icon ? 'flex' : 'block',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                }}>
                    {icon}
                    {title}
                </h1>
                {description && (
                    <p style={{
                        margin: 'var(--spacing-xs) 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-base)',
                    }}>
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div style={{ flexShrink: 0 }}>
                    {action}
                </div>
            )}
        </div>
    );
};
