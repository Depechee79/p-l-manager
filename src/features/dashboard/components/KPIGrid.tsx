/**
 * KPIGrid - Dashboard KPI Cards with permission-based filtering
 *
 * Session 005: Added permission filtering - widgets are shown based on user role
 *
 * Permission mapping:
 * - Ventas/Descuadre: dashboard.view (all users)
 * - Facturas Pendientes: ocr.view
 * - Stock Bajo: almacen.view
 * - Flash Cost: escandallos.view
 * - EBITDA: pnl.view
 * - Platos Vendidos: dashboard.view (all users)
 */
import React from 'react';
import { Card, ErrorBoundary } from '@components';
import { DollarSign, AlertTriangle, Receipt, ShoppingCart, Calculator, TrendingUp, TrendingDown, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '@utils';
import { useUserPermissions } from '@shared/hooks/useUserPermissions';
import type { DashboardKPIs, DashboardPeriod } from '../hooks/useDashboardMetrics';

interface KPIGridProps {
    kpis: DashboardKPIs;
    period: DashboardPeriod;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, period }) => {
    const { hasPermission } = useUserPermissions();

    // Permission checks for each KPI
    const canViewOCR = hasPermission('ocr.view');
    const canViewAlmacen = hasPermission('almacen.view');
    const canViewEscandallos = hasPermission('escandallos.view');
    const canViewPnL = hasPermission('pnl.view');

    return (
        <ErrorBoundary>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Ventas - Always visible (dashboard.view) */}
                <KPICard
                    title={`Ventas ${period === 'day' ? 'Hoy' : 'Período'}`}
                    value={formatCurrency(kpis.ventasHoy)}
                    icon={<DollarSign size={24} />}
                    color="var(--success)"
                    bgColor="var(--success-lighter)"
                />

                {/* Descuadre - Always visible (dashboard.view) */}
                <KPICard
                    title="Descuadre Total"
                    value={formatCurrency(kpis.descuadreTotal)}
                    icon={<AlertTriangle size={24} />}
                    color="var(--danger)"
                    bgColor="var(--danger-lighter)"
                />

                {/* Facturas Pendientes - Requires ocr.view */}
                {canViewOCR && (
                    <KPICard
                        title="Facturas Pendientes"
                        value={kpis.facturasPendientes.toString()}
                        icon={<Receipt size={24} />}
                        color="var(--info)"
                        bgColor="var(--info-lighter)"
                    />
                )}

                {/* Stock Bajo - Requires almacen.view */}
                {canViewAlmacen && (
                    <KPICard
                        title="Stock Bajo"
                        value={kpis.stockBajo.toString()}
                        icon={<ShoppingCart size={24} />}
                        color="var(--warning)"
                        bgColor="var(--warning-lighter)"
                    />
                )}

                {/* Flash Cost - Requires escandallos.view */}
                {canViewEscandallos && (
                    <Card clickable>
                        <div className="flex justify-between items-start p-0">
                            <div>
                                <div className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                    Flash Cost
                                </div>
                                <div className="text-lg md:text-2xl" style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
                                    {formatCurrency(kpis.costeReal)}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: kpis.diferenciaCoste >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                                    {kpis.diferenciaCoste >= 0 ? '+' : ''}{formatCurrency(kpis.diferenciaCoste)} vs teórico
                                </div>
                            </div>
                            <div className="w-9 h-9 md:w-12 md:h-12 flex-shrink-0" style={{
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
                )}

                {/* EBITDA - Requires pnl.view */}
                {canViewPnL && (
                    <Card clickable>
                        <div className="flex justify-between items-start p-0">
                            <div>
                                <div className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                    Proyección EBITDA
                                </div>
                                <div className="text-lg md:text-2xl" style={{ fontWeight: '700', color: kpis.proyeccionEBITDA >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {formatCurrency(kpis.proyeccionEBITDA)}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Food Cost: {(kpis.foodCostPct || 0).toFixed(1)}%
                                </div>
                            </div>
                            <div className="w-9 h-9 md:w-12 md:h-12 flex-shrink-0" style={{
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
                )}

                {/* Platos Vendidos - Always visible (dashboard.view) */}
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
        <div className="flex justify-between items-start p-0">
            <div>
                <div className="text-xs md:text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                    {title}
                </div>
                <div className="text-lg md:text-2xl" style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    {value}
                </div>
            </div>
            <div className="w-9 h-9 md:w-12 md:h-12 flex-shrink-0" style={{
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
