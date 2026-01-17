/**
 * Calcula el Food Cost (Porcentaje de coste sobre venta)
 * @param costeTotalNeto - Coste total neto
 * @param pvpNeto - Precio de venta neto
 * @returns Porcentaje de food cost
 */
export function calculateFoodCost(costeTotalNeto: number, pvpNeto: number): number {
  if (!pvpNeto || pvpNeto === 0) return 0;
  return (costeTotalNeto / pvpNeto) * 100;
}

/**
 * Calcula el Margen de Beneficio (Porcentaje)
 * @param costeTotalNeto - Coste total neto
 * @param pvpNeto - Precio de venta neto
 * @returns Porcentaje de margen
 */
export function calculateMarginPercentage(
  costeTotalNeto: number,
  pvpNeto: number
): number {
  if (!pvpNeto || pvpNeto === 0) return 0;
  return ((pvpNeto - costeTotalNeto) / pvpNeto) * 100;
}

/**
 * Calcula el coste total de un ingrediente
 * @param cantidad - Cantidad del ingrediente
 * @param costeUnitario - Coste unitario
 * @returns Coste total
 */
export function calculateCosteIngrediente(
  cantidad: number,
  costeUnitario: number
): number {
  return (cantidad || 0) * (costeUnitario || 0);
}

/**
 * Calcula el precio sin IVA (Base Imponible)
 * @param precioConIva - Precio con IVA incluido
 * @param tipoIva - Tipo de IVA (ej: 10 para 10%)
 * @returns Precio sin IVA
 */
export function calculateBaseImponible(
  precioConIva: number,
  tipoIva: number
): number {
  if (!precioConIva) return 0;
  return precioConIva / (1 + tipoIva / 100);
}

/**
 * Calcula el Margen Bruto (Valor absoluto)
 * @param pvpNeto - Precio de venta neto
 * @param costeTotalNeto - Coste total neto
 * @returns Margen bruto en valor absoluto
 */
export function calculateGrossMargin(pvpNeto: number, costeTotalNeto: number): number {
  return (pvpNeto || 0) - (costeTotalNeto || 0);
}
