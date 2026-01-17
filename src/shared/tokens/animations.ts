/**
 * P&L Manager Design Tokens - Animations
 * 
 * Tokens para transiciones y animaciones consistentes.
 * 
 * @description Tokens de animación del sistema de diseño
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// DURATIONS
// =============================================================================

/** Duración rápida - 150ms */
export const DURATION_FAST = 150;

/** Duración estándar - 200ms */
export const DURATION_DEFAULT = 200;

/** Duración media - 300ms */
export const DURATION_MEDIUM = 300;

/** Duración lenta - 500ms */
export const DURATION_SLOW = 500;

// =============================================================================
// DURATIONS CSS
// =============================================================================

export const DURATION_FAST_CSS = '150ms';
export const DURATION_DEFAULT_CSS = '200ms';
export const DURATION_MEDIUM_CSS = '300ms';
export const DURATION_SLOW_CSS = '500ms';

// =============================================================================
// EASINGS
// =============================================================================

/** Easing estándar */
export const EASING_DEFAULT = 'ease';

/** Easing para entrada */
export const EASING_IN = 'ease-in';

/** Easing para salida */
export const EASING_OUT = 'ease-out';

/** Easing para entrada-salida */
export const EASING_IN_OUT = 'ease-in-out';

// =============================================================================
// TRANSITIONS PRESETS
// =============================================================================

/** Transición estándar para la mayoría de elementos */
export const TRANSITION_DEFAULT = 'all 200ms ease';

/** Transición para colores */
export const TRANSITION_COLORS = 'color 200ms ease, background-color 200ms ease, border-color 200ms ease';

/** Transición para transformaciones */
export const TRANSITION_TRANSFORM = 'transform 200ms ease';

/** Transición para opacity */
export const TRANSITION_OPACITY = 'opacity 200ms ease';

// =============================================================================
// OBJECT EXPORTS
// =============================================================================

export const duration = {
    fast: DURATION_FAST,
    default: DURATION_DEFAULT,
    medium: DURATION_MEDIUM,
    slow: DURATION_SLOW,
} as const;

export const durationCSS = {
    fast: DURATION_FAST_CSS,
    default: DURATION_DEFAULT_CSS,
    medium: DURATION_MEDIUM_CSS,
    slow: DURATION_SLOW_CSS,
} as const;

export const easing = {
    default: EASING_DEFAULT,
    in: EASING_IN,
    out: EASING_OUT,
    inOut: EASING_IN_OUT,
} as const;

export const transition = {
    default: TRANSITION_DEFAULT,
    colors: TRANSITION_COLORS,
    transform: TRANSITION_TRANSFORM,
    opacity: TRANSITION_OPACITY,
} as const;
