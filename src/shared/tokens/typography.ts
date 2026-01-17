/**
 * P&L Manager Design Tokens - Typography
 * 
 * Sistema tipográfico de la aplicación.
 * Usa Public Sans como fuente principal (heading y body).
 * 
 * @description Tokens de tipografía del sistema de diseño
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// FONT FAMILIES
// =============================================================================

/** Fuente para headings */
export const FONT_HEADING = "'Public Sans', sans-serif";

/** Fuente para body text */
export const FONT_BODY = "'Public Sans', sans-serif";

/** Fallback sin comillas para casos especiales */
export const FONT_FALLBACK = 'sans-serif';

// =============================================================================
// FONT SIZES (en píxeles)
// =============================================================================

/** Extra small - 11px */
export const FONT_SIZE_XS = 11;

/** Small - 13px */
export const FONT_SIZE_SM = 13;

/** Base/default - 15px */
export const FONT_SIZE_BASE = 15;

/** Medium - 17px */
export const FONT_SIZE_MD = 17;

/** Large - 21px */
export const FONT_SIZE_LG = 21;

/** Extra large - 28px */
export const FONT_SIZE_XL = 28;

/** 2x Extra large - 36px */
export const FONT_SIZE_2XL = 36;

/** 3x Extra large - 48px */
export const FONT_SIZE_3XL = 48;

// =============================================================================
// FONT SIZES COMO CSS STRINGS
// =============================================================================

export const FONT_SIZE_XS_CSS = '11px';
export const FONT_SIZE_SM_CSS = '13px';
export const FONT_SIZE_BASE_CSS = '15px';
export const FONT_SIZE_MD_CSS = '17px';
export const FONT_SIZE_LG_CSS = '21px';
export const FONT_SIZE_XL_CSS = '28px';
export const FONT_SIZE_2XL_CSS = '36px';
export const FONT_SIZE_3XL_CSS = '48px';

// =============================================================================
// FONT WEIGHTS
// =============================================================================

/** Light - 300 */
export const FONT_WEIGHT_LIGHT = 300;

/** Regular - 400 */
export const FONT_WEIGHT_REGULAR = 400;

/** Medium - 500 */
export const FONT_WEIGHT_MEDIUM = 500;

/** Semibold - 600 */
export const FONT_WEIGHT_SEMIBOLD = 600;

/** Bold - 700 */
export const FONT_WEIGHT_BOLD = 700;

// =============================================================================
// LINE HEIGHTS
// =============================================================================

/** Line height estándar */
export const LINE_HEIGHT_DEFAULT = 1.5;

/** Line height para headings (más compacto) */
export const LINE_HEIGHT_HEADING = 1.25;

/** Line height para texto grande */
export const LINE_HEIGHT_TIGHT = 1.2;

// =============================================================================
// LETTER SPACING
// =============================================================================

/** Letter spacing para labels uppercase */
export const LETTER_SPACING_LABEL = '0.05em';

// =============================================================================
// OBJECT EXPORTS
// =============================================================================

/**
 * Familias de fuentes
 */
export const fontFamily = {
    heading: FONT_HEADING,
    body: FONT_BODY,
    fallback: FONT_FALLBACK,
} as const;

/**
 * Tamaños de fuente (numéricos)
 */
export const fontSize = {
    xs: FONT_SIZE_XS,
    sm: FONT_SIZE_SM,
    base: FONT_SIZE_BASE,
    md: FONT_SIZE_MD,
    lg: FONT_SIZE_LG,
    xl: FONT_SIZE_XL,
    '2xl': FONT_SIZE_2XL,
    '3xl': FONT_SIZE_3XL,
} as const;

/**
 * Tamaños de fuente como CSS
 */
export const fontSizeCSS = {
    xs: FONT_SIZE_XS_CSS,
    sm: FONT_SIZE_SM_CSS,
    base: FONT_SIZE_BASE_CSS,
    md: FONT_SIZE_MD_CSS,
    lg: FONT_SIZE_LG_CSS,
    xl: FONT_SIZE_XL_CSS,
    '2xl': FONT_SIZE_2XL_CSS,
    '3xl': FONT_SIZE_3XL_CSS,
} as const;

/**
 * Pesos de fuente
 */
export const fontWeight = {
    light: FONT_WEIGHT_LIGHT,
    regular: FONT_WEIGHT_REGULAR,
    medium: FONT_WEIGHT_MEDIUM,
    semibold: FONT_WEIGHT_SEMIBOLD,
    bold: FONT_WEIGHT_BOLD,
} as const;

/**
 * Line heights
 */
export const lineHeight = {
    default: LINE_HEIGHT_DEFAULT,
    heading: LINE_HEIGHT_HEADING,
    tight: LINE_HEIGHT_TIGHT,
} as const;

/**
 * Tipo para los tamaños de fuente
 */
export type FontSize = keyof typeof fontSize;

/**
 * Tipo para los pesos de fuente
 */
export type FontWeight = keyof typeof fontWeight;
