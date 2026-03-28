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
    maxWidth,
    style,
}) => {
    return (
        <div style={{
            // Only apply maxWidth if explicitly provided
            ...(maxWidth ? { maxWidth, margin: '0 auto' } : {}),
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            ...style,
        }}>
            {children}
        </div>
    );
};
