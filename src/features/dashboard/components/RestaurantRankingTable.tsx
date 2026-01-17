/**
 * RestaurantRankingTable - Multi-restaurant KPI comparison table
 * 
 * Shows a ranking of all restaurants by selected KPI with color-coded
 * performance indicators (green/yellow/red).
 * 
 * @audit AUDIT-02 - Multi-restaurant dashboard
 */
import React, { useState } from 'react';
import { Building2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, Select } from '@/shared/components';
import { formatCurrency } from '@/utils/formatters';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RestaurantKPI {
    id: string;
    name: string;
    ventas: number;
    descuadrePct: number;
    foodCostPct: number;
    laborCostPct: number;
    ebitdaPct: number;
}

export interface RestaurantRankingTableProps {
    restaurants: RestaurantKPI[];
    onSelectRestaurant?: (id: string) => void;
    selectedRestaurantId?: string | null;
}

type SortKey = 'ventas' | 'descuadrePct' | 'foodCostPct' | 'laborCostPct' | 'ebitdaPct';

// ═══════════════════════════════════════════════════════════════════════════════
// KPI THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
    descuadrePct: { warning: 0.5, danger: 1.0 },   // % de ventas
    foodCostPct: { warning: 32, danger: 35 },      // % de ventas
    laborCostPct: { warning: 28, danger: 32 },     // % de ventas
    ebitdaPct: { warning: 12, danger: 8, inverted: true }, // Lower is bad
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const getStatus = (value: number, key: SortKey): 'success' | 'warning' | 'danger' => {
    if (key === 'ventas') return 'success'; // Ventas is always neutral/success

    const threshold = THRESHOLDS[key as keyof typeof THRESHOLDS];
    if (!threshold) return 'success';

    if ('inverted' in threshold && threshold.inverted) {
        // For EBITDA, higher is better
        if (value < threshold.danger) return 'danger';
        if (value < threshold.warning) return 'warning';
        return 'success';
    } else {
        // For costs, lower is better
        if (value > threshold.danger) return 'danger';
        if (value > threshold.warning) return 'warning';
        return 'success';
    }
};

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const RestaurantRankingTable: React.FC<RestaurantRankingTableProps> = ({
    restaurants,
    onSelectRestaurant,
    selectedRestaurantId,
}) => {
    const [sortKey, setSortKey] = useState<SortKey>('ventas');
    const [sortAsc] = useState(false);

    // Sort restaurants
    const sortedRestaurants = [...restaurants].sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        return sortAsc ? valA - valB : valB - valA;
    });

    // Sort toggle handled by Select onChange

    const statusColors = {
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
    };

    if (restaurants.length === 0) {
        return (
            <Card>
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-xl)',
                    color: 'var(--text-secondary)',
                }}>
                    <Building2 size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
                    <p>No hay restaurantes para mostrar</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                }}>
                    <TrendingUp size={20} />
                    Ranking de Restaurantes
                </h3>
                <Select
                    value={sortKey}
                    onChange={(val) => setSortKey(val as SortKey)}
                    options={[
                        { value: 'ventas', label: 'Ordenar por Ventas' },
                        { value: 'foodCostPct', label: 'Ordenar por Food Cost' },
                        { value: 'laborCostPct', label: 'Ordenar por Labor Cost' },
                        { value: 'ebitdaPct', label: 'Ordenar por EBITDA' },
                        { value: 'descuadrePct', label: 'Ordenar por Descuadre' },
                    ]}
                    style={{ minWidth: '180px' }}
                />
            </div>

            {/* Mobile-friendly ranking list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {sortedRestaurants.map((restaurant, index) => {
                    const isSelected = selectedRestaurantId === restaurant.id;

                    return (
                        <div
                            key={restaurant.id}
                            onClick={() => onSelectRestaurant?.(restaurant.id)}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr auto',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius)',
                                border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                backgroundColor: isSelected ? 'var(--accent-bg, rgba(225, 29, 72, 0.05))' : 'var(--surface)',
                                cursor: onSelectRestaurant ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {/* Rank */}
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: index === 0 ? 'var(--success)'
                                    : index === 1 ? 'var(--warning)'
                                        : index === 2 ? 'var(--info)'
                                            : 'var(--surface-muted)',
                                color: index < 3 ? 'white' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: 'var(--font-size-sm)',
                            }}>
                                {index + 1}
                            </div>

                            {/* Restaurant Name & KPIs */}
                            <div>
                                <div style={{
                                    fontWeight: '600',
                                    fontSize: 'var(--font-size-base)',
                                    marginBottom: 'var(--spacing-xs)',
                                }}>
                                    {restaurant.name}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: 'var(--spacing-md)',
                                    flexWrap: 'wrap',
                                    fontSize: 'var(--font-size-sm)',
                                }}>
                                    <span style={{ color: statusColors[getStatus(restaurant.foodCostPct, 'foodCostPct')] }}>
                                        FC: {formatPercentage(restaurant.foodCostPct)}
                                    </span>
                                    <span style={{ color: statusColors[getStatus(restaurant.laborCostPct, 'laborCostPct')] }}>
                                        LC: {formatPercentage(restaurant.laborCostPct)}
                                    </span>
                                    <span style={{ color: statusColors[getStatus(restaurant.ebitdaPct, 'ebitdaPct')] }}>
                                        EBITDA: {formatPercentage(restaurant.ebitdaPct)}
                                    </span>
                                    {restaurant.descuadrePct > 0.5 && (
                                        <span style={{ color: statusColors[getStatus(restaurant.descuadrePct, 'descuadrePct')] }}>
                                            <AlertTriangle size={12} style={{ marginRight: '2px' }} />
                                            Desc: {formatPercentage(restaurant.descuadrePct)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Main KPI Value */}
                            <div style={{
                                textAlign: 'right',
                                fontWeight: '700',
                                fontSize: 'var(--font-size-lg)',
                                color: 'var(--text-main)',
                            }}>
                                {sortKey === 'ventas'
                                    ? formatCurrency(restaurant.ventas)
                                    : formatPercentage(restaurant[sortKey])
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default RestaurantRankingTable;
