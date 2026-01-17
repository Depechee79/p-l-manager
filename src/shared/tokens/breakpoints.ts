/**
 * P&L Manager Design Tokens - Breakpoints
 * 
 * Puntos de quiebre para responsive design.
 * Sigue un enfoque mobile-first.
 * 
 * @description Tokens de breakpoints del sistema de diseño
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// BREAKPOINTS (en píxeles)
// =============================================================================

/** Extra small - Móviles pequeños */
export const BREAKPOINT_XS = 480;

/** Small - Móviles */
export const BREAKPOINT_SM = 640;

/** Medium - Tablets */
export const BREAKPOINT_MD = 768;

/** Large - Tablets landscape / Desktop pequeño */
export const BREAKPOINT_LG = 1024;

/** Extra large - Desktop */
export const BREAKPOINT_XL = 1280;

/** 2x Extra large - Desktop grande */
export const BREAKPOINT_2XL = 1536;

// =============================================================================
// MEDIA QUERIES
// =============================================================================

/** Media query para móvil pequeño y arriba */
export const MQ_XS = `@media (min-width: ${BREAKPOINT_XS}px)`;

/** Media query para móvil y arriba */
export const MQ_SM = `@media (min-width: ${BREAKPOINT_SM}px)`;

/** Media query para tablet y arriba */
export const MQ_MD = `@media (min-width: ${BREAKPOINT_MD}px)`;

/** Media query para desktop pequeño y arriba */
export const MQ_LG = `@media (min-width: ${BREAKPOINT_LG}px)`;

/** Media query para desktop y arriba */
export const MQ_XL = `@media (min-width: ${BREAKPOINT_XL}px)`;

/** Media query para desktop grande y arriba */
export const MQ_2XL = `@media (min-width: ${BREAKPOINT_2XL}px)`;

// =============================================================================
// MEDIA QUERIES MAX-WIDTH (para estilos específicos de móvil)
// =============================================================================

/** Media query máximo móvil */
export const MQ_MAX_MD = `@media (max-width: ${BREAKPOINT_MD - 1}px)`;

/** Media query máximo tablet */
export const MQ_MAX_LG = `@media (max-width: ${BREAKPOINT_LG - 1}px)`;

// =============================================================================
// OBJECT EXPORTS
// =============================================================================

export const breakpoints = {
    xs: BREAKPOINT_XS,
    sm: BREAKPOINT_SM,
    md: BREAKPOINT_MD,
    lg: BREAKPOINT_LG,
    xl: BREAKPOINT_XL,
    '2xl': BREAKPOINT_2XL,
} as const;

export const mediaQueries = {
    xs: MQ_XS,
    sm: MQ_SM,
    md: MQ_MD,
    lg: MQ_LG,
    xl: MQ_XL,
    '2xl': MQ_2XL,
    maxMd: MQ_MAX_MD,
    maxLg: MQ_MAX_LG,
} as const;

/**
 * Tipo para los nombres de breakpoints
 */
export type BreakpointName = keyof typeof breakpoints;
