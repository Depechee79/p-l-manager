/**
 * FilterBar - Standardized filter bar component
 * 
 * Wraps filter inputs in a consistent Card layout per R-13.
 * 
 * @example
 * <FilterBar>
 *   <Input placeholder="Buscar..." />
 *   <Select options={...} />
 * </FilterBar>
 */
import React from 'react';
import type { ReactNode } from 'react';
import { Card } from '../Card';

export interface FilterBarProps {
    /** Filter inputs */
    children: ReactNode;
    /** Number of columns (default: auto-fit) */
    columns?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    children,
    columns,
}) => {
    return (
        <Card style={{ marginBottom: 'var(--spacing-3)' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: columns
                    ? `repeat(${columns}, 1fr)`
                    : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-2)',
                alignItems: 'end',
            }}>
                {children}
            </div>
        </Card>
    );
};
