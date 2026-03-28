/**
 * Shared filter constants for the application
 * AUDIT-FIX: P2.4 - Extracted from hardcoded values in components
 *
 * Benefits:
 * - Single source of truth for filter options
 * - Enables future internationalization
 * - Consistent across all components
 */

/**
 * Period filter options for date-based lists
 */
export const PERIOD_FILTERS = {
  day: { value: 'day', label: 'Día' },
  week: { value: 'week', label: 'Semana' },
  month: { value: 'month', label: 'Mes' },
  quarter: { value: 'quarter', label: 'Trimestre' },
  year: { value: 'year', label: 'Año' },
} as const;

export type PeriodFilterKey = keyof typeof PERIOD_FILTERS;

/**
 * Get period label by key
 */
export const getPeriodLabel = (key: PeriodFilterKey): string => {
  return PERIOD_FILTERS[key]?.label || key;
};

/**
 * Get all period options as array (for Select components)
 */
export const getPeriodOptions = () => {
  return Object.values(PERIOD_FILTERS).map(({ value, label }) => ({
    value,
    label,
  }));
};

/**
 * Turno (shift) options for cierres
 */
export const TURNO_OPTIONS = [
  { value: 'apertura', label: 'Apertura' },
  { value: 'comida', label: 'Comida' },
  { value: 'cena', label: 'Cena' },
  { value: 'cierre', label: 'Cierre' },
  { value: 'dia_completo', label: 'Día Completo' },
] as const;

export type TurnoKey = typeof TURNO_OPTIONS[number]['value'];

/**
 * Document type filters for DocsPage
 */
export const DOCUMENT_TYPE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'factura', label: 'Facturas' },
  { value: 'albaran', label: 'Albaranes' },
  { value: 'ticket', label: 'Tickets' },
] as const;

export type DocumentTypeKey = typeof DOCUMENT_TYPE_FILTERS[number]['value'];

/**
 * Status filters for various lists
 */
export const STATUS_FILTERS = {
  all: { value: 'all', label: 'Todos' },
  pending: { value: 'pending', label: 'Pendiente' },
  completed: { value: 'completed', label: 'Completado' },
  cancelled: { value: 'cancelled', label: 'Cancelado' },
} as const;

/**
 * View mode options
 */
export const VIEW_MODE_OPTIONS = [
  { value: 'single', label: 'Vista Detallada' },
  { value: 'comparison', label: 'Comparativa Grupo' },
] as const;

/**
 * Month names in Spanish
 */
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/**
 * Get month name by index (0-11)
 */
export const getMonthName = (index: number): string => {
  return MONTH_NAMES[index] || '';
};

/**
 * Generate month/year options for the last N months
 */
export const generateMonthYearOptions = (months: number = 24) => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      value: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  return options;
};
