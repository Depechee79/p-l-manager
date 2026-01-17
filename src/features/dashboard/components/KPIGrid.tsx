import React from 'react';
import { Card, ErrorBoundary } from '@components';
import { DollarSign, AlertTriangle, Receipt, ShoppingCart, Calculator, TrendingUp, TrendingDown, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@utils';
import type { DashboardKPIs, DashboardPeriod } from '../hooks/useDashboardMetrics';

interface KPIGridProps {
    kpis: DashboardKPIs;
    period: DashboardPeriod;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, period }) => {
    return (
        <ErrorBoundary>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--spacing-md)',
            }}>
                <KPICard
                    title={`Ventas ${period === 'day' ? 'Hoy' : 'Período'}`}
                    value={formatCurrency(kpis.ventasHoy)}
                    icon={<DollarSign size={24} />}
                    color="var(--success)"
                    bgColor="var(--success-lighter)"
                />

                <KPICard
                    title="Descuadre Total"
                    value={formatCurrency(kpis.descuadreTotal)}
                    icon={<AlertTriangle size={24} />}
                    color="var(--danger)"
                    bgColor="var(--danger-lighter)"
                />

                <KPICard
                    title="Facturas Pendientes"
                    value={kpis.facturasPendientes.toString()}
                    icon={<Receipt size={24} />}
                    color="var(--info)"
                    bgColor="var(--info-lighter)"
                />

                <KPICard
                    title="Stock Bajo"
                    value={kpis.stockBajo.toString()}
                    icon={<ShoppingCart size={24} />}
                    color="var(--warning)"
                    bgColor="var(--warning-lighter)"
                />

                <Card clickable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                Flash Cost
                            </div>
                            <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                                {formatCurrency(kpis.costeReal)}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: kpis.diferenciaCoste >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                                {kpis.diferenciaCoste >= 0 ? '+' : ''}{formatCurrency(kpis.diferenciaCoste)} vs teórico
                            </div>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius)',
                            backgroundColor: kpis.diferenciaCoste >= 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: kpis.diferenciaCoste >= 0 ? 'var(--danger)' : 'var(--success)',
                        }}>
                            <Calculator size={24} />
                        </div>
                    </div>
                </Card>

                <Card clickable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                Proyección EBITDA
                            </div>
                            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: kpis.proyeccionEBITDA >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {formatCurrency(kpis.proyeccionEBITDA)}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Food Cost: {(kpis.foodCostPct || 0).toFixed(1)}%
                            </div>
                        </div>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius)',
                            backgroundColor: kpis.proyeccionEBITDA >= 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: kpis.proyeccionEBITDA >= 0 ? 'var(--success)' : 'var(--danger)',
                        }}>
                            {kpis.proyeccionEBITDA >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        </div>
                    </div>
                </Card>

                <KPICard
                    title="Platos Vendidos"
                    value={kpis.platosVendidos.toString()}
                    icon={<UtensilsCrossed size={24} />}
                    color="var(--accent)"
                    bgColor="var(--accent-lighter)"
                />
            </div>
        </ErrorBoundary>
    );
};

interface KPICardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, bgColor }) => (
    <Card clickable>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                    {title}
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-main)' }}>
                    {value}
                </div>
            </div>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius)',
                backgroundColor: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
            }}>
                {icon}
            </div>
        </div>
    </Card>
);
