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
 * import { useResponsive, useMediaQuery } from '@/shared/hooks';
 * 
 * @version 1.1.0
 * @date 2025-12-30
 */

// =============================================================================
// RESPONSIVE HOOKS
// =============================================================================

export {
    // Primary responsive hook - use this for new code
    useResponsive,
    type ResponsiveState,
    type DeviceType,
    
    // Base media query hook
    useMediaQuery,
    
    // Convenience hooks for specific breakpoints
    useIsMobile,
    useIsTablet,
    useIsDesktop,
    useBreakpoint,
    useViewport,
} from './useMediaQuery';

// =============================================================================
// PERMISSION HOOKS
// =============================================================================

export { useUserPermissions, type UseUserPermissionsResult } from './useUserPermissions';

// =============================================================================
// VERSION
// =============================================================================

export const SHARED_HOOKS_VERSION = '1.1.0';
