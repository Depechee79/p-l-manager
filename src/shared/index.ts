/**
 * P&L Manager - Shared Module Index
 * 
 * Barrel export principal del módulo shared.
 * Importa desde aquí para acceso centralizado a todo el sistema de diseño.
 * 
 * @example
 * // Tokens
 * import { colors, spacing, ACCENT } from '@/shared';
 * 
 * // Types
 * import type { Size, Variant } from '@/shared';
 * 
 * // Utils
 * import { cn, generateId } from '@/shared';
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// TOKENS (Design System Values)
// =============================================================================
export * from './tokens';

// =============================================================================
// TYPES (Shared Type Definitions)
// =============================================================================
export * from './types';

// =============================================================================
// UTILS (Shared Utilities)
// =============================================================================
export * from './utils';

// =============================================================================
// COMPONENTS (Will be populated in ARCH-02)
// =============================================================================
// Components are exported from their own index for tree-shaking
// import { Button, Card } from '@/shared/components';
// export { SHARED_COMPONENTS_VERSION } from './components';

// =============================================================================
// HOOKS (Will be populated as needed)
// =============================================================================
// export { SHARED_HOOKS_VERSION } from './hooks';
