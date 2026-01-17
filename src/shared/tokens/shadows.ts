/**
 * P&L Manager Design Tokens - Shadows
 * 
 * Sistema de sombras para elevación y profundidad visual.
 * Basado en una progresión suave para distintos niveles de elevación.
 * 
 * @description Tokens de sombras del sistema de diseño
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// SHADOWS (Box Shadows CSS)
// =============================================================================

/** 
 * Sombra extra pequeña - Para elementos sutiles
 * Equivale a elevación 1
 */
export const SHADOW_SM = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';

/** 
 * Sombra estándar - Para cards y contenedores
 * Equivale a elevación 2
 */
export const SHADOW = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';

/** 
 * Sombra media - Para dropdowns y popovers
 * Equivale a elevación 3
 */
export const SHADOW_MD = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';

/** 
 * Sombra grande - Para modales y elementos flotantes
 * Equivale a elevación 4
 */
export const SHADOW_LG = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';

/** 
 * Sombra especial para botones primarios (con color accent)
 */
export const SHADOW_ACCENT = '0 4px 12px rgba(225, 29, 72, 0.3)';

/** 
 * Sombra especial para totals card (con color accent más intenso)
 */
export const SHADOW_ACCENT_INTENSE = '0 10px 25px -5px rgba(225, 29, 72, 0.4)';

/**
 * Sombra para focus ring
 */
export const SHADOW_FOCUS_RING = '0 0 0 3px rgba(225, 29, 72, 0.1)';

// =============================================================================
// OBJECT EXPORTS
// =============================================================================

/**
 * Todas las sombras como objeto
 */
export const shadows = {
    sm: SHADOW_SM,
    default: SHADOW,
    md: SHADOW_MD,
    lg: SHADOW_LG,
    accent: SHADOW_ACCENT,
    accentIntense: SHADOW_ACCENT_INTENSE,
    focusRing: SHADOW_FOCUS_RING,
} as const;

/**
 * Niveles de elevación semánticos
 */
export const elevation = {
    /** Sin elevación */
    0: 'none',
    /** Elevación sutil - cards base */
    1: SHADOW_SM,
    /** Elevación estándar - contenedores */
    2: SHADOW,
    /** Elevación media - dropdowns */
    3: SHADOW_MD,
    /** Elevación alta - modales */
    4: SHADOW_LG,
} as const;

/**
 * Tipo para niveles de sombra
 */
export type ShadowLevel = keyof typeof shadows;

/**
 * Tipo para niveles de elevación
 */
export type ElevationLevel = keyof typeof elevation;
