import type { PnLData, PnLPeriod, PnLKPIs } from '../types/pnl.types';
import type { Cierre, Invoice, DeliveryRecord } from '../types';
import type { Nomina } from '../types/personal.types';
import type { GastoFijo } from '../types/gastos.types';
import { calculateNominaSummary } from '../utils/personalCalculations';
import { calculateGastosFijosSummary } from '../utils/gastosCalculations';

const PNL_CONFIG = {
  BEBIDA_KEYWORDS: ['bebida', 'licor', 'vino', 'cerveza', 'café', 'refresco'],
  DELIVERY_KEYWORDS: ['glovo', 'uber', 'just eat', 'deliveroo'],
  DELIVERY_CATEGORY: 'delivery',
  DELIVERY_COMMISSION: 'comisiones delivery'
};

export class PnLService {
  /**
   * Complete P&L Calculation
   */
  static calculatePnL(
    period: PnLPeriod,
    cierres: Cierre[],
    facturas: Invoice[],
    delivery: DeliveryRecord[],
    adjustments: import('../types/pnl.types').PnLManualEntry[],
    restaurantId?: string | number,
    nominas: Nomina[] = [],
    gastosFijos: GastoFijo[] = []
  ): PnLData {
    // 0. Filter by Restaurant
    // 0. Filter by Restaurant

    const filteredCierres = restaurantId ? cierres.filter(c => String(c.restaurantId) === String(restaurantId)) : cierres;
    const filteredInvoices = restaurantId ? facturas.filter(f => String(f.restaurantId) === String(restaurantId)) : facturas;
    const filteredDelivery = restaurantId ? delivery.filter(d => String(d.restaurantId) === String(restaurantId)) : delivery;

    // Explicit fix for adjustments: ensure restaurantId check is safe
    const filteredAdjustments = adjustments.filter(a =>
      (!restaurantId || String(a.restaurantId) === String(restaurantId)) &&
      a.period === `${period.year}-${period.month}`
    );

    // Helper: Is Delivery Invoice?
    const isDeliveryInvoice = (f: Invoice) => {
      const proveedor = (f.proveedorNombre || f.proveedor || '').toLowerCase();
      const categoria = (f.categoria || '').toLowerCase();

      const isPlatform = PNL_CONFIG.DELIVERY_KEYWORDS.some(k => proveedor.includes(k));
      const isCategory = categoria === PNL_CONFIG.DELIVERY_CATEGORY || categoria === PNL_CONFIG.DELIVERY_COMMISSION;

      return isPlatform || isCategory;
    };

    // Helper: Get Adjustments
    const getAdj = (cat: import('../types/pnl.types').PnLAdjustmentCategory) =>
      filteredAdjustments.filter(a => a.category === cat).reduce((sum, a) => sum + a.amount, 0);

    // 1. INGRESOS
    const ventasLocal = filteredCierres.reduce((sum, c) => sum + ((c.totalReal || 0) - (c.realDelivery || 0)), 0);
    const ventasDelivery =
      filteredCierres.reduce((sum, c) => sum + (c.realDelivery || 0), 0) +
      filteredDelivery.reduce((sum, d) => sum + (d.ventaNeta || 0), 0);

    const totalIngresos = ventasLocal + ventasDelivery + getAdj('revenue');

    // 2. MATERIAS (COGS)
    let comprasComida = 0;
    let comprasBebida = 0;

    filteredInvoices.forEach(f => {
      if (isDeliveryInvoice(f)) return;

      const cat = (f.categoria || '').toLowerCase();
      const val = f.total || 0;

      if (PNL_CONFIG.BEBIDA_KEYWORDS.some(k => cat.includes(k))) {
        comprasBebida += val;
      } else {
        comprasComida += val;
      }
    });

    const totalMaterias = comprasComida + comprasBebida + getAdj('cogs');
    const foodCostPct = PnLService.calculatePercentage(totalMaterias, totalIngresos);

    // 3. MARGEN BRUTO
    const margenBruto = totalIngresos - totalMaterias;
    const margenBrutoPct = PnLService.calculatePercentage(margenBruto, totalIngresos);

    // 4. PERSONAL - Connected to real nominas data
    const adjustmentsLabor = getAdj('labor');
    const filteredNominas = nominas.filter(n =>
      (!restaurantId || String(n.restaurantId) === String(restaurantId)) &&
      n.mes === period.month &&
      n.anio === period.year
    );
    const nominaSummary = calculateNominaSummary(filteredNominas);
    const totalPersonal = nominaSummary.totalCostePersonal + adjustmentsLabor;
    const personalPct = PnLService.calculatePercentage(totalPersonal, totalIngresos);

    // 5. OPEX - Connected to real gastosFijos data
    const comisionesDelivery = filteredDelivery.reduce((sum, d) => sum + (d.comision || 0), 0);
    const gastosDelivery = filteredInvoices.filter(isDeliveryInvoice).reduce((sum, f) => sum + (f.total || 0), 0) + comisionesDelivery;

    const filteredGastosFijos = gastosFijos.filter(g =>
      (!restaurantId || String(g.restaurantId) === String(restaurantId)) &&
      g.activo &&
      !g.fechaFin
    );
    const gastosFijosSummary = calculateGastosFijosSummary(filteredGastosFijos);

    const adjustmentsOpex = getAdj('opex');
    const totalOpex = gastosDelivery + gastosFijosSummary.total + adjustmentsOpex;
    const opexPct = PnLService.calculatePercentage(totalOpex, totalIngresos);

    // 6. EBITDA
    const ebitda = margenBruto - totalPersonal - totalOpex;
    const ebitdaPct = PnLService.calculatePercentage(ebitda, totalIngresos);

    // 7. RESULTADOS
    const adjustmentsFinancial = getAdj('financial');
    const beneficioNeto = ebitda - adjustmentsFinancial;
    const margenNetoPct = PnLService.calculatePercentage(beneficioNeto, totalIngresos);

    return {
      period,
      ingresos: { ventasLocal, ventasDelivery, totalIngresos },
      materias: { comprasComida, comprasBebida, totalMaterias, foodCostPct },
      margen: { margenBruto, margenBrutoPct },
      personal: {
        salarios: nominaSummary.totalSalarioBruto,
        seguridadSocial: nominaSummary.totalSeguridadSocialEmpresa,
        totalPersonal,
        personalPct
      },
      opex: {
        alquiler: gastosFijosSummary.alquiler,
        suministros: gastosFijosSummary.suministros,
        servicios: gastosFijosSummary.servicios,
        marketing: gastosFijosSummary.marketing,
        limpieza: gastosFijosSummary.limpieza,
        seguros: gastosFijosSummary.seguros,
        otrosOpex: gastosFijosSummary.otros + adjustmentsOpex,
        comisionesDelivery,
        gastosDeliveryFacturas: gastosDelivery - comisionesDelivery,
        totalOpex,
        opexPct
      },
      resultados: { ebitda, ebitdaPct, financieros: 0, amortizaciones: 0, beneficioNeto, margenNetoPct }
    };
  }

  /**
   * Extract KPIs from P&L data
   */
  static extractKPIs(pnl: PnLData): PnLKPIs {
    const laborCostPct = pnl.personal.personalPct;
    const primeCostPct = pnl.materias.foodCostPct + laborCostPct;

    return {
      ingresos: pnl.ingresos.totalIngresos,
      foodCost: pnl.materias.foodCostPct,
      laborCostPct,
      primeCostPct,
      margenBruto: pnl.margen.margenBrutoPct,
      ebitda: pnl.resultados.ebitdaPct,
    };
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Calculate percentage of total
   */
  static calculatePercentage(value: number, total: number): number {
    return total > 0 ? (value / total * 100) : 0;
  }
}
