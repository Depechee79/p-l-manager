import type {
  Cierre,
  Period,
  CashBreakdown,
  Datafono,
  OtroMedio,
} from '../types';
import { DatabaseService } from '@core';
import { logger } from '@core/services/LoggerService';

/**
 * Input data for saving a closing
 */
export interface ClosingData {
  fecha: string;
  turno: string;
  desgloseEfectivo: Partial<CashBreakdown>;
  datafonos: Datafono[];
  otrosMedios: OtroMedio[];
  realDelivery: number | string;
  posEfectivo: number | string;
  posTarjetas: number | string;
  posDelivery: number | string;
  posTickets: number | string;
  posExtras: number | string;
}

/**
 * Result of save operation
 */
export interface SaveClosingResult {
  success: boolean;
  data?: Cierre;
  error?: string;
}

/**
 * Finance Service
 * Handles closing calculations and financial operations
 */
export class FinanceService {
  private db: DatabaseService;

  // Cash denomination values in euros
  private readonly CASH_VALUES: Record<string, number> = {
    b500: 500,
    b200: 200,
    b100: 100,
    b50: 50,
    b20: 20,
    b10: 10,
    b5: 5,
    m2: 2,
    m1: 1,
    m050: 0.5,
    m020: 0.2,
    m010: 0.1,
    m005: 0.05,
    m002: 0.02,
    m001: 0.01,
  };

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Calculate total cash from denomination breakdown
   */
  calculateCashTotal(breakdown: Partial<CashBreakdown>): number {
    let total = 0;

    for (const [key, qty] of Object.entries(breakdown)) {
      const value = this.CASH_VALUES[key];
      if (value) {
        const quantity = parseFloat(String(qty)) || 0;
        total += quantity * value;
      }
    }

    return Math.round(total * 100) / 100; // Round to 2 decimals
  }

  /**
   * Save closing with all calculations
   */
  async saveClosing(data: ClosingData, editId?: number): Promise<SaveClosingResult> {
    // Validate required fields
    if (!data.fecha) {
      return {
        success: false,
        error: 'Fecha is required',
      };
    }

    // Calculate totals
    const totalCash = this.calculateCashTotal(data.desgloseEfectivo);

    const totalDatafonos = data.datafonos.reduce(
      (sum, d) => sum + (parseFloat(String(d.importe)) || 0),
      0
    );

    const totalOtros = data.otrosMedios.reduce(
      (sum, m) => sum + (parseFloat(String(m.importe)) || 0),
      0
    );

    const realDelivery = parseFloat(String(data.realDelivery)) || 0;
    const totalReal = totalCash + totalDatafonos + totalOtros + realDelivery;

    const posEfectivo = parseFloat(String(data.posEfectivo)) || 0;
    const posTarjetas = parseFloat(String(data.posTarjetas)) || 0;
    const posDelivery = parseFloat(String(data.posDelivery)) || 0;
    const posExtras = parseFloat(String(data.posExtras)) || 0;

    const totalPOS = posEfectivo + posTarjetas + posDelivery + posExtras;
    const descuadre = Math.round((totalReal - totalPOS) * 100) / 100;

    const cierre: Omit<Cierre, 'id'> & { id?: number } = {
      fecha: data.fecha,
      turno: data.turno,

      efectivoContado: totalCash,
      desgloseEfectivo: data.desgloseEfectivo,

      datafonos: data.datafonos,
      totalDatafonos: totalDatafonos,

      otrosMedios: data.otrosMedios,
      totalOtrosMedios: totalOtros,

      realDelivery: realDelivery,

      posEfectivo: posEfectivo,
      posTarjetas: posTarjetas,
      posDelivery: posDelivery,
      posTickets: parseInt(String(data.posTickets)) || 0,
      posExtras: posExtras,

      totalReal: totalReal,
      totalPos: totalPOS,
      descuadreTotal: descuadre,
    };

    let saved: Cierre;

    if (editId) {
      saved = await this.db.update('cierres', editId, cierre) as Cierre;
    } else {
      saved = await this.db.add('cierres', cierre) as Cierre;
    }

    return {
      success: true,
      data: saved,
    };
  }

  /**
   * Get closings for a specific period
   */
  getClosings(period: Period): Cierre[] {
    return this.db.getByPeriod('cierres', period) as Cierre[];
  }

  /**
   * Get a single closing by ID
   */
  getClosing(id: number): Cierre | undefined {
    return this.db.cierres.find((c) => c.id === id) as Cierre | undefined;
  }

  /**
   * Delete a closing by ID
   */
  deleteClosing(id: number): boolean {
    try {
      this.db.delete('cierres', id);
      return true;
    } catch (error: unknown) {
      logger.error('Failed to delete closing', error);
      return false;
    }
  }
}
