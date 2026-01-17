import type { Escandallo, EscandaloIngrediente as Ingredient, TipoIVA } from '../types';

export class EscandalloService {
  /**
   * Calculate PVP Neto (without IVA)
   */
  static calculatePVPNeto(pvpConIVA: number, tipoIVA: TipoIVA): number {
    if (tipoIVA === 0) return pvpConIVA;
    const divisor = 1 + (tipoIVA / 100);
    return pvpConIVA / divisor;
  }

  /**
   * Calculate total cost of ingredients
   */
  static calculateCosteTotalNeto(ingredientes: Ingredient[]): number {
    return ingredientes.reduce((sum, ing) => sum + (ing.costeTotal || 0), 0);
  }

  /**
   * Calculate Food Cost %
   */
  static calculateFoodCost(costeTotalNeto: number, pvpNeto: number): number {
    if (pvpNeto === 0) return 0;
    return (costeTotalNeto / pvpNeto) * 100;
  }

  /**
   * Calculate Margen Bruto %
   */
  static calculateMargenBruto(foodCostPct: number): number {
    return 100 - foodCostPct;
  }

  /**
   * Recalculate all escandallo metrics
   */
  static recalculate(escandallo: Partial<Escandallo>): Escandallo {
    const pvpConIVA = escandallo.pvpConIVA || 0;
    const tipoIVA = escandallo.tipoIVA || 21;
    const ingredientes = escandallo.ingredientes || [];

    const pvpNeto = this.calculatePVPNeto(pvpConIVA, tipoIVA);
    const costeTotalNeto = this.calculateCosteTotalNeto(ingredientes);
    const foodCostPct = this.calculateFoodCost(costeTotalNeto, pvpNeto);
    const margenBrutoPct = this.calculateMargenBruto(foodCostPct);

    return {
      id: escandallo.id || '',
      nombre: escandallo.nombre || '',
      pvpConIVA,
      tipoIVA,
      pvpNeto,
      ingredientes,
      costeTotalNeto,
      foodCostPct,
      margenBrutoPct,
      descripcion: escandallo.descripcion,
      notas: escandallo.notas,
      createdAt: escandallo.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculate coste total for a single ingredient
   */
  static calculateIngredientCost(cantidad: number, costeUnitario: number): number {
    return cantidad * costeUnitario;
  }

  /**
   * Validate escandallo data
   */
  static validate(escandallo: Partial<Escandallo>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!escandallo.nombre || escandallo.nombre.trim() === '') {
      errors.push('El nombre es obligatorio');
    }

    if (!escandallo.pvpConIVA || escandallo.pvpConIVA <= 0) {
      errors.push('El PVP con IVA debe ser mayor que 0');
    }

    if (!escandallo.ingredientes || escandallo.ingredientes.length === 0) {
      errors.push('Debe añadir al menos un ingrediente');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a copy of an escandallo for replication
   */
  static createReplica(masterEscandallo: Escandallo, restaurantId: string, companyId: string): Escandallo {
    return {
      ...masterEscandallo,
      id: `${masterEscandallo.id}_${restaurantId}_${Date.now()}`,
      esMaestro: false,
      restaurantId,
      companyId,
      masterId: String(masterEscandallo.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if an escandallo is a master
   */
  static isMaster(escandallo: Escandallo): boolean {
    return escandallo.esMaestro === true && !escandallo.restaurantId;
  }

  /**
   * Get master escandallos from a list
   */
  static getMasters(escandallos: Escandallo[]): Escandallo[] {
    return escandallos.filter(e => this.isMaster(e));
  }

  /**
   * Get replicas of a master escandallo
   */
  static getReplicas(escandallos: Escandallo[], masterId: string): Escandallo[] {
    return escandallos.filter(e => e.masterId === masterId);
  }
}
