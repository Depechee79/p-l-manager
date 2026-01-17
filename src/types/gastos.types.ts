/**
 * Gastos Types - Fixed expenses and recurring costs
 * 
 * Types for managing fixed operational expenses (OPEX) like rent,
 * utilities, insurance, and other recurring costs for restaurants.
 */

import type { BaseEntity } from './index';

/**
 * Categories of fixed expenses
 */
export type GastoFijoTipo =
    | 'alquiler'       // Rent
    | 'suministros'    // Utilities (water, electricity, gas)
    | 'servicios'      // Services (internet, phone, maintenance)
    | 'seguros'        // Insurance
    | 'marketing'      // Marketing & advertising
    | 'limpieza'       // Cleaning services
    | 'otros';         // Other fixed expenses

/**
 * Fixed expense entity
 * Represents a recurring monthly cost for a restaurant
 */
export interface GastoFijo extends BaseEntity {
    /** Restaurant this expense belongs to */
    restaurantId: string | number;

    /** Category of the expense */
    tipo: GastoFijoTipo;

    /** Description of the expense */
    descripcion: string;

    /** Monthly amount in euros */
    importeMensual: number;

    /** Vendor/provider name (optional) */
    proveedor?: string;

    /** Start date of the expense (YYYY-MM-DD) */
    fechaInicio: string;

    /** End date of the expense if terminated (YYYY-MM-DD) */
    fechaFin?: string;

    /** Whether the expense is currently active */
    activo: boolean;

    /** Additional notes */
    notas?: string;
}

/**
 * Summary of fixed expenses by category
 * Used for P&L calculation
 */
export interface GastosFijosSummary {
    alquiler: number;
    suministros: number;
    servicios: number;
    seguros: number;
    marketing: number;
    limpieza: number;
    otros: number;
    total: number;
}

/**
 * Helper to calculate summary from list of expenses
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

    activeGastos.forEach(g => {
        const amount = g.importeMensual || 0;
        switch (g.tipo) {
            case 'alquiler':
                summary.alquiler += amount;
                break;
            case 'suministros':
                summary.suministros += amount;
                break;
            case 'servicios':
                summary.servicios += amount;
                break;
            case 'seguros':
                summary.seguros += amount;
                break;
            case 'marketing':
                summary.marketing += amount;
                break;
            case 'limpieza':
                summary.limpieza += amount;
                break;
            default:
                summary.otros += amount;
        }
    });

    summary.total = summary.alquiler + summary.suministros + summary.servicios +
        summary.seguros + summary.marketing + summary.limpieza + summary.otros;

    return summary;
}

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
 * Icons for expense types (emoji for mobile-friendly display)
 */
export const GASTO_FIJO_ICONS: Record<GastoFijoTipo, string> = {
    alquiler: '🏠',
    suministros: '💡',
    servicios: '📞',
    seguros: '🛡️',
    marketing: '📢',
    limpieza: '🧹',
    otros: '📦',
};
