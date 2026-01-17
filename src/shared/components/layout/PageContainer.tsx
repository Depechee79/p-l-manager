/**
 * PageContainer - Standardized page container with consistent padding
 * 
 * Wraps all page content to ensure uniform spacing per R-13.
 * 
 * @example
 * <PageContainer maxWidth="1400px">
 *   <PageHeader title="..." />
 *   <FilterBar>...</FilterBar>
 *   <Table ... />
 * </PageContainer>
 */
import React from 'react';
import type { ReactNode, CSSProperties } from 'react';

export interface PageContainerProps {
    /** Page content */
    children: ReactNode;
    /** Maximum width of content */
    maxWidth?: string;
    /** Additional inline styles */
    style?: CSSProperties;
}

export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    maxWidth = '1400px',
    style,
}) => {
    return (
        <div style={{
            padding: 'var(--spacing-3)',
            maxWidth,
            margin: '0 auto',
            ...style,
        }}>
            {children}
        </div>
    );
};
