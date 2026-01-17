/**
 * P&L Manager - Shared Hooks Index
 * 
 * Barrel export de hooks reutilizables del sistema.
 * 
 * NOTA: Los hooks serán migrados progresivamente desde src/hooks/
 * cuando corresponda. Este archivo contiene hooks genéricos que no
 * dependen de lógica de negocio específica.
 * 
 * @example
 * import { useLocalStorage, useMediaQuery } from '@/shared/hooks';
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// HOOKS COMPARTIDOS
// =============================================================================

export { useMediaQuery, useIsMobile } from './useMediaQuery';

// =============================================================================
// PLACEHOLDER EXPORT
// =============================================================================

/**
 * Constante placeholder para evitar error de módulo vacío.
 * Se eliminará cuando se añada el primer hook.
 */
export const SHARED_HOOKS_VERSION = '1.0.0';
