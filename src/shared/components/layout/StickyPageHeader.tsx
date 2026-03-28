/**
 * StickyPageHeader - Page header that stays fixed while scrolling
 *
 * Session 005: Created for improved UX on long lists
 * Combines PageHeader + TabsHorizontal + optional filters
 * Stays visible at the top while content scrolls beneath
 */
import React from 'react';
import type { ReactNode } from 'react';
import { TabsHorizontal, type Tab } from '../TabsHorizontal';

export interface StickyPageHeaderProps {
    /** Main page title */
    title: string;
    /** Optional description below title */
    description?: string;
    /** Optional action buttons (right side) */
    action?: ReactNode;
    /** Optional icon component */
    icon?: ReactNode;
    /** Optional tabs */
    tabs?: Tab[];
    /** Active tab ID (required if tabs provided) */
    activeTab?: string;
    /** Tab change handler (required if tabs provided) */
    onTabChange?: (tabId: string) => void;
    /** Optional filters/search bar (rendered below tabs) */
    filters?: ReactNode;
    /** Children rendered in the sticky area after everything else */
    children?: ReactNode;
}

export const StickyPageHeader: React.FC<StickyPageHeaderProps> = ({
    title,
    description,
    action,
    icon,
    tabs,
    activeTab,
    onTabChange,
    filters,
    children,
}) => {
    return (
        <div
            className="sticky-page-header"
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-sticky)',
                background: 'var(--background)',
                paddingTop: 'var(--spacing-xs)',
                paddingBottom: 'var(--spacing-xs)',
                marginLeft: 'calc(-1 * var(--spacing-md))',
                marginRight: 'calc(-1 * var(--spacing-md))',
                paddingLeft: 'var(--spacing-md)',
                paddingRight: 'var(--spacing-md)',
                marginTop: 'calc(-1 * var(--spacing-sm))',
                borderBottom: '1px solid var(--border)',
            }}
        >
            {/* Title Row - AUDIT-FIX: P3.3 - Only one H1 per page */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
                marginBottom: tabs || filters ? 'var(--spacing-sm)' : 0,
            }}>
                <div>
                    {/* Using h1 as the single page title - other sections should use h2+ */}
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

            {/* Tabs (if provided) */}
            {tabs && tabs.length > 0 && activeTab && onTabChange && (
                <div style={{ marginBottom: filters ? 'var(--spacing-sm)' : 0 }}>
                    <TabsHorizontal
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={onTabChange}
                        noBorder
                    />
                </div>
            )}

            {/* Filters (if provided) */}
            {filters && (
                <div style={{ marginTop: 'var(--spacing-xs)' }}>
                    {filters}
                </div>
            )}

            {/* Additional children */}
            {children}
        </div>
    );
};
