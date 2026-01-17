/**
 * P&L Manager - Shared Utils Index
 * 
 * Barrel export de utilidades compartidas del sistema.
 * 
 * @example
 * import { cn, formatCurrency, generateId } from '@/shared/utils';
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// CLASS NAME UTILITIES
// =============================================================================

/**
 * Combina class names de forma segura, filtrando valores falsy.
 * Similar a la librería 'clsx' pero sin dependencias.
 * 
 * @example
 * cn('btn', isActive && 'btn-active', className)
 * // => 'btn btn-active custom-class'
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Genera un ID único para uso en formularios y accesibilidad.
 * 
 * @example
 * const inputId = generateId('input');
 * // => 'input-a1b2c3d4'
 */
export function generateId(prefix: string = 'id'): string {
    return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Verifica si un valor no es null ni undefined.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Verifica si un valor es un objeto.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Verifica si un valor es un string no vacío.
 */
export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Agrupa un array por una key.
 * 
 * @example
 * groupBy(products, 'category')
 */
export function groupBy<T, K extends keyof T>(
    array: T[],
    key: K
): Record<string, T[]> {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
}
