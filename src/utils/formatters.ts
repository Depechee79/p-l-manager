const DEFAULT_LOCALE = 'es-ES';

/**
 * Formatea una fecha a formato español DD/MM/YYYY
 * @param dateInput - Fecha en formato ISO, Date object, timestamp o string DD/MM/YYYY
 * @returns Fecha formateada o string vacío si es inválida
 */
export function formatDate(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return '';

  // Si ya está en formato DD/MM/YYYY, devolver tal cual
  if (typeof dateInput === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateInput)) {
    return dateInput;
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }

  return date.toLocaleDateString(DEFAULT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formatea un número como moneda en euros
 * @param amount - Cantidad a formatear
 * @returns String con formato de moneda española (ej: "1.234,56 €")
 */
export function formatCurrency(amount: number | null | undefined): string {
  const value = amount || 0;
  const formatted = new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value);
  
  return `${formatted} €`;
}

/**
 * Formatea un número con el formato español
 * @param value - Número a formatear
 * @param decimals - Número de decimales (por defecto: automático)
 * @returns Número formateado
 */
export function formatNumber(
  value: number | null | undefined,
  decimals?: number
): string {
  const num = value || 0;
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(num);
}

/**
 * Formatea un número como porcentaje
 * @param value - Valor del porcentaje
 * @param decimals - Número de decimales (por defecto: 2)
 * @returns Porcentaje formateado (ej: "25,50%")
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 2
): string {
  const num = value || 0;
  return `${formatNumber(num, decimals)}%`;
}
