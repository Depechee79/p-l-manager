/**
 * PageHeader - Standardized page header component
 *
 * Ensures consistent layout across all pages per R-13 rule.
 * All pages should use this component for their header section.
 *
 * AUDIT-FIX: P3.3 - This component renders the only H1 on the page.
 * Content sections should use h2, h3, etc.
 *
 * @deprecated Prefer StickyPageHeader for better UX on scrollable content
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
            backgroundColor: 'var(--background)',
            paddingTop: 'var(--spacing-xs)',
            paddingBottom: 'var(--spacing-xs)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
        }}>
            <div>
                <h1 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-heading)',
                    display: icon ? 'flex' : 'block',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                }}>
                    {icon}
                    {title}
                </h1>
                {description && (
                    <p style={{
                        margin: '4px 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)',
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
