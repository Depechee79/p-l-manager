/**
 * P&L Manager Design Tokens - Spacing
 * 
 * Sistema de espaciado consistente para toda la aplicación.
 * Basado en una escala de 6px (spacing-xs base).
 * 
 * @description Tokens de espaciado del sistema de diseño
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// SPACING SCALE (en píxeles)
// =============================================================================

/** Extra small - 6px */
export const SPACING_XS = 6;

/** Small - 12px (2x base) */
export const SPACING_SM = 12;

/** Medium - 20px (default para gaps) */
export const SPACING_MD = 20;

/** Large - 32px */
export const SPACING_LG = 32;

/** Extra large - 48px */
export const SPACING_XL = 48;

/** 2x Extra large - 64px */
export const SPACING_2XL = 64;

// =============================================================================
// SPACING COMO STRINGS CSS
// =============================================================================

/** Extra small como string CSS */
export const SPACING_XS_CSS = '6px';

/** Small como string CSS */
export const SPACING_SM_CSS = '12px';

/** Medium como string CSS */
export const SPACING_MD_CSS = '20px';

/** Large como string CSS */
export const SPACING_LG_CSS = '32px';

/** Extra large como string CSS */
export const SPACING_XL_CSS = '48px';

/** 2x Extra large como string CSS */
export const SPACING_2XL_CSS = '64px';

// =============================================================================
// BORDER RADIUS
// =============================================================================

/** Radio de borde estándar - 12px (más redondeado, moderno) */
export const RADIUS = 12;

/** Radio de borde como string CSS */
export const RADIUS_CSS = '12px';

/** Radio de borde pequeño - 8px */
export const RADIUS_SM = 8;

/** Radio de borde pequeño como string CSS */
export const RADIUS_SM_CSS = '8px';

/** Radio de borde grande - 16px */
export const RADIUS_LG = 16;

/** Radio de borde grande como string CSS */
export const RADIUS_LG_CSS = '16px';

/** Radio circular (para avatars, badges) */
export const RADIUS_FULL = '50%';

// =============================================================================
// COMPONENT HEIGHTS
// =============================================================================

/** Altura mínima de inputs y botones */
export const HEIGHT_INPUT = 40;

/** Altura mínima de inputs como CSS */
export const HEIGHT_INPUT_CSS = '40px';

/** Altura de botón small */
export const HEIGHT_BUTTON_SM = 32;

/** Altura de botón small como CSS */
export const HEIGHT_BUTTON_SM_CSS = '32px';

/** Altura de mobile header */
export const HEIGHT_MOBILE_HEADER = 60;

/** Altura de mobile header como CSS */
export const HEIGHT_MOBILE_HEADER_CSS = '60px';

/** Ancho del paso del step indicator */
export const SIZE_STEP_NUMBER = 36;

/** Ancho del paso como CSS */
export const SIZE_STEP_NUMBER_CSS = '36px';

// =============================================================================
// OBJECT EXPORTS
// =============================================================================

/**
 * Todos los espaciados como objeto (valores numéricos en px)
 */
export const spacing = {
    xs: SPACING_XS,
    sm: SPACING_SM,
    md: SPACING_MD,
    lg: SPACING_LG,
    xl: SPACING_XL,
    '2xl': SPACING_2XL,
} as const;

/**
 * Todos los espaciados como strings CSS
 */
export const spacingCSS = {
    xs: SPACING_XS_CSS,
    sm: SPACING_SM_CSS,
    md: SPACING_MD_CSS,
    lg: SPACING_LG_CSS,
    xl: SPACING_XL_CSS,
    '2xl': SPACING_2XL_CSS,
} as const;

/**
 * Todos los border radius
 */
export const radius = {
    default: RADIUS,
    sm: RADIUS_SM,
    lg: RADIUS_LG,
    full: RADIUS_FULL,
} as const;

/**
 * Tipo para los tamaños de spacing
 */
export type SpacingSize = keyof typeof spacing;
