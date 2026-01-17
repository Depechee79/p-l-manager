/**
 * P&L Manager Design Tokens - Index
 * 
 * Barrel export de todos los tokens del sistema de diseño.
 * Importa desde aquí para acceso centralizado.
 * 
 * @example
 * import { colors, spacing, ACCENT, SHADOW_LG } from '@/shared/tokens';
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// COLORS
// =============================================================================
export {
    // Individual constants
    BACKGROUND,
    SURFACE,
    SURFACE_MUTED,
    TEXT_MAIN,
    TEXT_SECONDARY,
    TEXT_LIGHT,
    BORDER,
    BORDER_FOCUS,
    PRIMARY,
    PRIMARY_HOVER,
    PRIMARY_LIGHT,
    ACCENT,
    ACCENT_HOVER,
    ACCENT_SHADOW,
    ACCENT_FOCUS_RING,
    SUCCESS,
    SUCCESS_BG,
    SUCCESS_BORDER,
    WARNING,
    WARNING_BG,
    WARNING_BORDER,
    DANGER,
    DANGER_BG,
    DANGER_BORDER,
    DANGER_BORDER_HOVER,
    INFO,
    INFO_BG,
    INFO_BORDER,
    // Object export
    colors,
    // Types
    type ColorName,
    type ColorValue,
} from './colors';

// =============================================================================
// SPACING
// =============================================================================
export {
    // Individual constants
    SPACING_XS,
    SPACING_SM,
    SPACING_MD,
    SPACING_LG,
    SPACING_XL,
    SPACING_2XL,
    SPACING_XS_CSS,
    SPACING_SM_CSS,
    SPACING_MD_CSS,
    SPACING_LG_CSS,
    SPACING_XL_CSS,
    SPACING_2XL_CSS,
    RADIUS,
    RADIUS_CSS,
    RADIUS_SM,
    RADIUS_SM_CSS,
    RADIUS_LG,
    RADIUS_LG_CSS,
    RADIUS_FULL,
    HEIGHT_INPUT,
    HEIGHT_INPUT_CSS,
    HEIGHT_BUTTON_SM,
    HEIGHT_BUTTON_SM_CSS,
    HEIGHT_MOBILE_HEADER,
    HEIGHT_MOBILE_HEADER_CSS,
    SIZE_STEP_NUMBER,
    SIZE_STEP_NUMBER_CSS,
    // Object exports
    spacing,
    spacingCSS,
    radius,
    // Types
    type SpacingSize,
} from './spacing';

// =============================================================================
// TYPOGRAPHY
// =============================================================================
export {
    // Individual constants
    FONT_HEADING,
    FONT_BODY,
    FONT_FALLBACK,
    FONT_SIZE_XS,
    FONT_SIZE_SM,
    FONT_SIZE_BASE,
    FONT_SIZE_MD,
    FONT_SIZE_LG,
    FONT_SIZE_XL,
    FONT_SIZE_2XL,
    FONT_SIZE_3XL,
    FONT_SIZE_XS_CSS,
    FONT_SIZE_SM_CSS,
    FONT_SIZE_BASE_CSS,
    FONT_SIZE_MD_CSS,
    FONT_SIZE_LG_CSS,
    FONT_SIZE_XL_CSS,
    FONT_SIZE_2XL_CSS,
    FONT_SIZE_3XL_CSS,
    FONT_WEIGHT_LIGHT,
    FONT_WEIGHT_REGULAR,
    FONT_WEIGHT_MEDIUM,
    FONT_WEIGHT_SEMIBOLD,
    FONT_WEIGHT_BOLD,
    LINE_HEIGHT_DEFAULT,
    LINE_HEIGHT_HEADING,
    LINE_HEIGHT_TIGHT,
    LETTER_SPACING_LABEL,
    // Object exports
    fontFamily,
    fontSize,
    fontSizeCSS,
    fontWeight,
    lineHeight,
    // Types
    type FontSize,
    type FontWeight,
} from './typography';

// =============================================================================
// SHADOWS
// =============================================================================
export {
    // Individual constants
    SHADOW_SM,
    SHADOW,
    SHADOW_MD,
    SHADOW_LG,
    SHADOW_ACCENT,
    SHADOW_ACCENT_INTENSE,
    SHADOW_FOCUS_RING,
    // Object exports
    shadows,
    elevation,
    // Types
    type ShadowLevel,
    type ElevationLevel,
} from './shadows';

// =============================================================================
// ANIMATIONS
// =============================================================================
export {
    // Individual constants
    DURATION_FAST,
    DURATION_DEFAULT,
    DURATION_MEDIUM,
    DURATION_SLOW,
    DURATION_FAST_CSS,
    DURATION_DEFAULT_CSS,
    DURATION_MEDIUM_CSS,
    DURATION_SLOW_CSS,
    EASING_DEFAULT,
    EASING_IN,
    EASING_OUT,
    EASING_IN_OUT,
    TRANSITION_DEFAULT,
    TRANSITION_COLORS,
    TRANSITION_TRANSFORM,
    TRANSITION_OPACITY,
    // Object exports
    duration,
    durationCSS,
    easing,
    transition,
} from './animations';

// =============================================================================
// BREAKPOINTS
// =============================================================================
export {
    // Individual constants
    BREAKPOINT_XS,
    BREAKPOINT_SM,
    BREAKPOINT_MD,
    BREAKPOINT_LG,
    BREAKPOINT_XL,
    BREAKPOINT_2XL,
    MQ_XS,
    MQ_SM,
    MQ_MD,
    MQ_LG,
    MQ_XL,
    MQ_2XL,
    MQ_MAX_MD,
    MQ_MAX_LG,
    // Object exports
    breakpoints,
    mediaQueries,
    // Types
    type BreakpointName,
} from './breakpoints';
