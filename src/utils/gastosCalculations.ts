import React from 'react';
import { Home, Zap, Phone, Shield, Megaphone, Sparkles, Package } from 'lucide-react';
import type { GastoFijo, GastoFijoTipo, GastosFijosSummary } from '../types/gastos.types';

/**
 * Human-readable labels for expense types
 */
export const GASTO_FIJO_LABELS: Record<GastoFijoTipo, string> = {
    alquiler: 'Alquiler',
    suministros: 'Suministros',
    servicios: 'Servicios',
    seguros: 'Seguros',
    marketing: 'Marketing',
    limpieza: 'Limpieza',
    otros: 'Otros',
};

/**
 * Icons for expense types as Lucide React components
 */
export const GASTO_FIJO_ICONS: Record<GastoFijoTipo, React.ReactNode> = {
    alquiler: React.createElement(Home, { size: 18 }),
    suministros: React.createElement(Zap, { size: 18 }),
    servicios: React.createElement(Phone, { size: 18 }),
    seguros: React.createElement(Shield, { size: 18 }),
    marketing: React.createElement(Megaphone, { size: 18 }),
    limpieza: React.createElement(Sparkles, { size: 18 }),
    otros: React.createElement(Package, { size: 18 }),
};

/**
 * Calculate summary of fixed expenses by category.
 * Only includes active expenses without end date.
 */
export function calculateGastosFijosSummary(gastos: GastoFijo[]): GastosFijosSummary {
    const activeGastos = gastos.filter(g => g.activo && !g.fechaFin);

    const summary: GastosFijosSummary = {
        alquiler: 0,
        suministros: 0,
        servicios: 0,
        seguros: 0,
        marketing: 0,
        limpieza: 0,
        otros: 0,
        total: 0,
    };

    for (const g of activeGastos) {
        const amount = g.importeMensual || 0;
        if (g.tipo in summary) {
            summary[g.tipo] += amount;
        } else {
            summary.otros += amount;
        }
    }

    summary.total = summary.alquiler + summary.suministros + summary.servicios +
        summary.seguros + summary.marketing + summary.limpieza + summary.otros;

    return summary;
}
