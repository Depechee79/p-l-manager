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

// Functions and constants moved to @utils/gastosCalculations.ts
// This file contains ONLY type definitions.
