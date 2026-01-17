/**
 * P&L Manager - Shared Types Index
 * 
 * Barrel export de tipos compartidos del sistema.
 * 
 * NOTA: Este archivo contendrá tipos genéricos de UI y utilidad.
 * Los tipos de dominio (Product, Invoice, etc.) permanecen en src/types/
 * 
 * @example
 * import type { Size, Variant, ComponentBaseProps } from '@/shared/types';
 * 
 * @version 1.0.0
 * @date 2025-12-30
 */

// =============================================================================
// COMPONENT COMMON TYPES
// =============================================================================

/**
 * Tamaños estándar para componentes
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Tamaños para componentes interactivos (Button, Modal)
 * Mapeo: sm=small, md=medium(default), lg=large
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Tamaños para padding de contenedores (Card, etc.)
 */
export type PaddingSize = 'none' | 'xs' | 'sm' | 'md' | 'lg';

/**
 * Variantes semánticas comunes
 */
export type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Props base que comparten todos los componentes
 */
export interface ComponentBaseProps {
    /** Clases CSS adicionales */
    className?: string;
    /** Estilos inline adicionales */
    style?: React.CSSProperties;
    /** ID del elemento */
    id?: string;
    /** Atributos data-* */
    'data-testid'?: string;
}

/**
 * Props para componentes con children
 */
export interface WithChildren {
    children: React.ReactNode;
}

/**
 * Props para componentes que pueden estar disabled
 */
export interface WithDisabled {
    disabled?: boolean;
}

/**
 * Props para componentes que pueden estar loading
 */
export interface WithLoading {
    loading?: boolean;
}

/**
 * Props para componentes con validación
 */
export interface WithValidation {
    error?: string;
    success?: boolean;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Hace opcionales todas las propiedades de un tipo
 */
export type PartialProps<T> = {
    [P in keyof T]?: T[P];
};

/**
 * Extrae el tipo de un array
 */
export type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never;
