export interface PnLPeriod {
  month: number; // 0-11
  year: number;
}

export type PnLAdjustmentCategory = 'revenue' | 'cogs' | 'labor' | 'opex' | 'financial';

export interface PnLManualEntry {
  id: number | string;
  restaurantId: string | number;
  period: string; // "YYYY-MM"
  category: PnLAdjustmentCategory;
  concept: string;
  amount: number;
  createdAt?: string;
  _synced?: boolean;
}

export interface PnLIngresos {
  ventasLocal: number;
  ventasDelivery: number;
  totalIngresos: number;
}

export interface PnLMaterias {
  comprasComida: number;
  comprasBebida: number;
  totalMaterias: number;
  foodCostPct: number;
}

export interface PnLMargen {
  margenBruto: number;
  margenBrutoPct: number;
}

export interface PnLPersonal {
  salarios: number;
  seguridadSocial: number;
  totalPersonal: number;
  personalPct: number;
}

export interface PnLOpex {
  alquiler: number;
  suministros: number;
  servicios: number;
  marketing: number;
  limpieza: number;
  seguros: number;
  otrosOpex: number;
  comisionesDelivery: number;
  gastosDeliveryFacturas: number;
  totalOpex: number;
  opexPct: number;
}

export interface PnLResultados {
  ebitda: number;
  ebitdaPct: number;
  financieros: number;
  amortizaciones: number;
  beneficioNeto: number;
  margenNetoPct: number;
}

export interface PnLKPIs {
  ingresos: number;
  foodCost: number;
  laborCostPct: number;   // Personal / Ventas (objetivo: < 30%)
  primeCostPct: number;   // (Food + Labor) / Ventas (objetivo: < 60%)
  margenBruto: number;
  ebitda: number;
}

export interface PnLComparison {
  period: PnLPeriod;
  restaurants: RestaurantKPI[];
}

export interface RestaurantKPI extends PnLKPIs {
  restaurantId: string | number;
  restaurantNombre: string;
}

export interface PnLData {
  period: PnLPeriod;
  restaurantId?: string | number;
  restaurantNombre?: string;
  ingresos: PnLIngresos;
  materias: PnLMaterias;
  margen: PnLMargen;
  personal: PnLPersonal;
  opex: PnLOpex;
  resultados: PnLResultados;
}
