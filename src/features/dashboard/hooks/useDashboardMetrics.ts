import { useMemo, useState } from 'react';
import { useDatabase } from '@hooks';
import { PnLService } from '../../../services/pnl-service';
import { useRestaurantContext } from '@core';
import { logger } from '@core/services/LoggerService';
import { formatDate, formatCurrency } from '@utils';
import type { Cierre, Invoice, Product, DeliveryRecord, Escandallo, PnLManualEntry, Nomina, GastoFijo, InventoryItem } from '@types';

export type DashboardPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DashboardKPIs {
    ventasHoy: number;
    descuadreTotal: number;
    facturasPendientes: number;
    stockBajo: number;
    costeTeorico: number;
    costeReal: number;
    diferenciaCoste: number;
    proyeccionEBITDA: number;
    foodCostPct: number;
    margenBrutoPct: number;
    platosVendidos: number;
}

export interface DashboardActivity {
    type: 'factura' | 'albaran' | 'cierre' | 'producto' | 'proveedor';
    title: string;
    subtitle: string;
    date: Date;
    icon: string; // Icon name from lucide-react to be rendered in component
    link: string;
}

export interface DashboardAlert {
    type: 'warning' | 'danger' | 'info';
    title: string;
    message: string;
    link?: string;
}

export const useDashboardMetrics = () => {
    const { db } = useDatabase();
    const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('month');
    const [viewMode, setViewMode] = useState<'single' | 'consolidated'>('single');

    let restaurantContext: ReturnType<typeof useRestaurantContext> | null = null;
    try {
        restaurantContext = useRestaurantContext();
    } catch (error: unknown) {
        logger.warn('useDashboardMetrics: RestaurantContext not available', error instanceof Error ? error.message : String(error));
    }

    const hasMultipleRestaurants = restaurantContext && restaurantContext.restaurants.length > 1;

    const dateRange = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (selectedPeriod) {
            case 'day':
                return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
            case 'month':
                return {
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
                };
            case 'quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                return {
                    start: new Date(now.getFullYear(), quarter * 3, 1),
                    end: new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59),
                };
            case 'year':
                return {
                    start: new Date(now.getFullYear(), 0, 1),
                    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
                };
            default:
                return { start: today, end: today };
        }
    }, [selectedPeriod]);

    const filteredData = useMemo(() => {
        const restaurantId = restaurantContext?.currentRestaurant?.id;

        let cierres = (db.cierres as Cierre[] || []).filter((c) => {
            const fecha = new Date(c.fecha);
            return fecha >= dateRange.start && fecha <= dateRange.end;
        });

        let facturas = (db.facturas as Invoice[] || []).filter((f) => {
            const fecha = new Date(f.fecha || '');
            return fecha >= dateRange.start && fecha <= dateRange.end;
        });

        // Filter by restaurant if not consolidated
        if (viewMode === 'single' && restaurantId) {
            cierres = cierres.filter(c => String(c.restaurantId) === String(restaurantId));
            facturas = facturas.filter(f => String(f.restaurantId) === String(restaurantId));
        }

        return { cierres, facturas };
    }, [db.cierres, db.facturas, dateRange, viewMode, restaurantContext?.currentRestaurant?.id]);

    const kpis = useMemo((): DashboardKPIs => {
        const ventasHoy = filteredData.cierres.reduce((sum, c) => sum + (c.totalReal || 0), 0);
        const descuadreTotal = filteredData.cierres.reduce((sum, c) => sum + Math.abs(c.descuadreTotal || 0), 0);

        const facturasPendientes = 0; // Placeholder until Invoice has the field

        const productos = (db.productos as Product[] || []);
        const stockBajo = productos.filter((p) => {
            const stock = p.stockActualUnidades || 0;
            const minimo = p.stockMinimoUnidades || 0;
            return stock < minimo && minimo > 0;
        }).length;

        const currentDate = new Date();
        const pnlData = PnLService.calculatePnL(
            { month: currentDate.getMonth(), year: currentDate.getFullYear() },
            filteredData.cierres,
            filteredData.facturas,
            (db.delivery || []) as DeliveryRecord[],
            (db.pnl_adjustments || []) as PnLManualEntry[],
            restaurantContext?.currentRestaurant?.id,
            (db.nominas || []) as Nomina[],
            (db.gastosFijos || []) as GastoFijo[]
        );

        const escandallos = (db.escandallos || []) as Escandallo[];
        const costeTeorico = escandallos.reduce((sum, e) => sum + (e.costeTotalNeto || 0), 0);
        const costeReal = filteredData.facturas.reduce((sum, f) => sum + (f.total || 0), 0);
        const diferenciaCoste = costeReal - costeTeorico;

        const diasEnMes = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const diaActual = currentDate.getDate();
        const proyeccionEBITDA = pnlData.resultados.ebitda > 0 && diaActual > 0
            ? (pnlData.resultados.ebitda / diaActual) * diasEnMes
            : 0;

        return {
            ventasHoy,
            descuadreTotal,
            facturasPendientes,
            stockBajo,
            costeTeorico,
            costeReal,
            diferenciaCoste,
            proyeccionEBITDA,
            foodCostPct: pnlData.materias.foodCostPct,
            margenBrutoPct: pnlData.margen.margenBrutoPct,
            platosVendidos: 0, // Placeholder for future dish sales integration
        };
    }, [filteredData, db.productos, db.escandallos, db.delivery]);

    const recentActivity = useMemo((): DashboardActivity[] => {
        const activities: DashboardActivity[] = [];

        (db.facturas as Invoice[] || []).slice(0, 3).forEach((f) => {
            activities.push({
                type: 'factura',
                title: `Factura ${f.numero || 'N/A'}`,
                subtitle: f.proveedor || 'Proveedor desconocido',
                date: new Date(f.fecha || ''),
                icon: 'Receipt',
                link: '/ocr',
            });
        });

        (db.cierres as Cierre[] || []).slice(0, 3).forEach((c) => {
            activities.push({
                type: 'cierre',
                title: `Cierre ${formatDate(c.fecha)}`,
                subtitle: `Total: ${formatCurrency(c.totalReal || 0)}`,
                date: new Date(c.fecha),
                icon: 'Wallet',
                link: '/cierres',
            });
        });

        return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [db.facturas, db.cierres]);

    const alerts = useMemo((): DashboardAlert[] => {
        const alertList: DashboardAlert[] = [];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        const cierres = (db.cierres as Cierre[] || []);
        const cierreAyer = cierres.find((c) => {
            const fecha = new Date(c.fecha);
            return fecha >= yesterday && fecha <= yesterdayEnd;
        });

        if (!cierreAyer) {
            alertList.push({
                type: 'danger',
                title: 'Cierre de ayer pendiente',
                message: 'No se ha registrado el cierre de caja de ayer',
                link: '/cierres',
            });
        } else {
            const descuadre = Math.abs(cierreAyer.descuadreTotal || 0);
            if (descuadre > 5) {
                alertList.push({
                    type: 'danger',
                    title: `Descuadre grave en cierre de ayer: ${formatCurrency(descuadre)}`,
                    message: 'Revisa urgentemente el cierre de ayer',
                    link: '/cierres',
                });
            }
        }

        const inventarios = (db.inventarios as InventoryItem[] || []);
        if (inventarios.length > 0) {
            const ultimoInventario = inventarios
                .map((inv) => ({ ...inv, fecha: new Date(inv.fecha || inv.createdAt || '') }))
                .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0];

            const diasSinInventariar = Math.floor(
                (new Date().getTime() - ultimoInventario.fecha.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diasSinInventariar > 7) {
                alertList.push({
                    type: 'warning',
                    title: `${diasSinInventariar} días sin inventariar`,
                    message: `Último inventario: ${formatDate(ultimoInventario.fecha.toISOString())}`,
                    link: '/inventarios',
                });
            }
        } else {
            alertList.push({
                type: 'warning',
                title: 'Ningún inventario registrado',
                message: 'Crea tu primer inventario para comenzar',
                link: '/inventarios',
            });
        }

        const productos = (db.productos as Product[] || []);
        const stockBajo = productos.filter((p) => {
            const stock = p.stockActualUnidades || 0;
            const minimo = p.stockMinimoUnidades || 0;
            return stock < minimo && minimo > 0;
        });

        if (stockBajo.length > 0) {
            alertList.push({
                type: 'warning',
                title: `${stockBajo.length} producto${stockBajo.length > 1 ? 's' : ''} con stock bajo`,
                message: 'Revisa el inventario para reponer productos',
                link: '/inventario',
            });
        }

        const facturasPendientes = (db.facturas as Invoice[] || []).filter((f) => !f.proveedorId || !f._synced);
        if (facturasPendientes.length > 0) {
            alertList.push({
                type: 'info',
                title: `${facturasPendientes.length} documentos pendientes de procesar`,
                message: 'Revisa los documentos escaneados',
                link: '/ocr',
            });
        }

        return alertList;
    }, [db.productos, db.facturas, db.cierres, db.inventarios]);

    return {
        selectedPeriod,
        setSelectedPeriod,
        viewMode,
        setViewMode,
        hasMultipleRestaurants,
        kpis,
        recentActivity,
        alerts,
    };
};
