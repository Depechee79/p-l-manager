import React from 'react';
import { Card } from '@shared/components';
import { formatCurrency } from '@utils/formatters';

interface CalculationSummaryProps {
    pvpNeto: number;
    costeTotalNeto: number;
    foodCost: number;
    margen: number;
    style?: React.CSSProperties;
}

export const CalculationSummary: React.FC<CalculationSummaryProps> = ({
    pvpNeto,
    costeTotalNeto,
    foodCost,
    margen,
    style,
}) => {
    return (
        <Card
            style={{
                backgroundColor: 'var(--success-lighter)',
                border: '2px solid var(--success-light)',
                ...style,
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'var(--spacing-md)',
                }}
            >
                <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                        PVP Neto
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-main)' }}>
                        {formatCurrency(pvpNeto)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                        Coste Total
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--text-main)' }}>
                        {formatCurrency(costeTotalNeto)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                        Food Cost %
                    </div>
                    <div style={{
                        fontSize: 'var(--font-size-xl)',
                        fontWeight: '700',
                        color: foodCost > 35 ? 'var(--danger)' : 'var(--success)'
                    }}>
                        {foodCost.toFixed(1)}%
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}>
                        Margen Bruto %
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', color: 'var(--info)' }}>
                        {margen.toFixed(1)}%
                    </div>
                </div>
            </div>
        </Card>
    );
};
