/**
 * P&L Manager Design Tokens - Colors
 * 
 * Estos tokens son la fuente de verdad para los colores de la aplicación.
 * Están sincronizados con las CSS variables en shared/styles/tokens.css
 * 
 * @description Paleta de colores del sistema de diseño
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// BACKGROUNDS
// =============================================================================

/** Color de fondo principal de la aplicación - Cool Gray 100 */
export const BACKGROUND = '#f3f4f6';

/** Color de superficie (cards, modales) - Blanco puro */
export const SURFACE = '#ffffff';

/** Superficie con menos énfasis - Cool Gray 50 */
export const SURFACE_MUTED = '#f9fafb';

// =============================================================================
// TEXT
// =============================================================================

/** Texto principal - Gray 900 */
export const TEXT_MAIN = '#111827';

/** Texto secundario - Gray 600 (WCAG AA compliant) */
export const TEXT_SECONDARY = '#4b5563';

/** Texto con menor énfasis - Gray 400 */
export const TEXT_LIGHT = '#9ca3af';

// =============================================================================
// BORDERS
// =============================================================================

/** Borde estándar - Gray 200 */
export const BORDER = '#e5e7eb';

/** Borde en estado focus - Gray 300 */
export const BORDER_FOCUS = '#d1d5db';

// =============================================================================
// PRIMARY (Brand)
// =============================================================================

/** Color primario - Gray 900 */
export const PRIMARY = '#111827';

/** Primary en hover - Gray 700 */
export const PRIMARY_HOVER = '#374151';

/** Primary light - Gray 100 */
export const PRIMARY_LIGHT = '#f3f4f6';

// =============================================================================
// ACCENT (CTA)
// =============================================================================

/** Color de acento principal - Rose 600 */
export const ACCENT = '#e11d48';

/** Accent en hover - Rose 700 */
export const ACCENT_HOVER = '#be123c';

/** RGBA del accent para sombras */
export const ACCENT_SHADOW = 'rgba(225, 29, 72, 0.3)';

/** RGBA del accent para focus ring */
export const ACCENT_FOCUS_RING = 'rgba(225, 29, 72, 0.1)';

// =============================================================================
// SEMANTIC (Estados)
// =============================================================================

/** Success - Emerald 500 */
export const SUCCESS = '#10b981';

/** Success background light */
export const SUCCESS_BG = '#ecfdf5';

/** Success border */
export const SUCCESS_BORDER = '#d1fae5';

/** Warning - Amber 500 */
export const WARNING = '#f59e0b';

/** Warning background light */
export const WARNING_BG = '#fffbeb';

/** Warning border */
export const WARNING_BORDER = '#fef3c7';

/** Danger - Red 500 */
export const DANGER = '#ef4444';

/** Danger background light */
export const DANGER_BG = '#fef2f2';

/** Danger border */
export const DANGER_BORDER = '#fecaca';

/** Danger border hover */
export const DANGER_BORDER_HOVER = '#fca5a5';

/** Info - Blue 500 */
export const INFO = '#3b82f6';

/** Info background light */
export const INFO_BG = '#eff6ff';

/** Info border */
export const INFO_BORDER = '#dbeafe';

// =============================================================================
// OBJECT EXPORTS (para uso programático)
// =============================================================================

/**
 * Todos los colores como objeto
 * Útil para iteración o tipado dinámico
 */
export const colors = {
    // Backgrounds
    background: BACKGROUND,
    surface: SURFACE,
    surfaceMuted: SURFACE_MUTED,

    // Text
    textMain: TEXT_MAIN,
    textSecondary: TEXT_SECONDARY,
    textLight: TEXT_LIGHT,

    // Borders
    border: BORDER,
    borderFocus: BORDER_FOCUS,

    // Primary
    primary: PRIMARY,
    primaryHover: PRIMARY_HOVER,
    primaryLight: PRIMARY_LIGHT,

    // Accent
    accent: ACCENT,
    accentHover: ACCENT_HOVER,
    accentShadow: ACCENT_SHADOW,
    accentFocusRing: ACCENT_FOCUS_RING,

    // Semantic
    success: SUCCESS,
    successBg: SUCCESS_BG,
    successBorder: SUCCESS_BORDER,
    warning: WARNING,
    warningBg: WARNING_BG,
    warningBorder: WARNING_BORDER,
    danger: DANGER,
    dangerBg: DANGER_BG,
    dangerBorder: DANGER_BORDER,
    dangerBorderHover: DANGER_BORDER_HOVER,
    info: INFO,
    infoBg: INFO_BG,
    infoBorder: INFO_BORDER,
} as const;

/**
 * Tipo para los nombres de colores
 */
export type ColorName = keyof typeof colors;

/**
 * Tipo para los valores de colores
 */
export type ColorValue = typeof colors[ColorName];
