import type { DeliveryOrder, DeliveryStats, PlataformaDelivery } from '../types/delivery.types';

export class DeliveryService {
  /**
   * Calculate comision importe
   */
  static calculateComision(ventasBrutas: number, comisionPct: number): number {
    return (ventasBrutas * comisionPct) / 100;
  }

  /**
   * Calculate ingreso neto (after comision)
   */
  static calculateIngresoNeto(ventasBrutas: number, comisionImporte: number): number {
    return ventasBrutas - comisionImporte;
  }

  /**
   * Calculate complete delivery order
   */
  static calculateOrder(ventasBrutas: number, comisionPct: number): {
    comisionImporte: number;
    ingresoNeto: number;
  } {
    const comisionImporte = this.calculateComision(ventasBrutas, comisionPct);
    const ingresoNeto = this.calculateIngresoNeto(ventasBrutas, comisionImporte);
    
    return { comisionImporte, ingresoNeto };
  }

  /**
   * Calculate statistics for a list of delivery orders
   */
  static calculateStats(orders: DeliveryOrder[]): DeliveryStats {
    const totalVentas = orders.reduce((sum, o) => sum + o.ventasBrutas, 0);
    const totalComisiones = orders.reduce((sum, o) => sum + o.comisionImporte, 0);
    const ingresoNeto = orders.reduce((sum, o) => sum + o.ingresoNeto, 0);
    const ordenesTotales = orders.length;
    const ticketPromedio = ordenesTotales > 0 ? totalVentas / ordenesTotales : 0;

    return {
      totalVentas,
      totalComisiones,
      ingresoNeto,
      ordenesTotales,
      ticketPromedio,
    };
  }

  /**
   * Filter orders by platform
   */
  static filterByPlatform(orders: DeliveryOrder[], plataforma: PlataformaDelivery): DeliveryOrder[] {
    return orders.filter(o => o.plataforma === plataforma);
  }

  /**
   * Filter orders by date range
   */
  static filterByDateRange(orders: DeliveryOrder[], startDate: string, endDate: string): DeliveryOrder[] {
    return orders.filter(o => {
      const orderDate = new Date(o.fecha);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return orderDate >= start && orderDate <= end;
    });
  }

  /**
   * Get default comision for platform
   */
  static getDefaultComision(plataforma: PlataformaDelivery): number {
    const defaults: Record<PlataformaDelivery, number> = {
      'Uber Eats': 30,
      'Glovo': 30,
      'Just Eat': 25,
      'Propio': 0,
    };
    return defaults[plataforma] || 30;
  }

  /**
   * Validate delivery order
   */
  static validate(order: Partial<DeliveryOrder>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!order.plataforma) {
      errors.push('La plataforma es obligatoria');
    }

    if (!order.fecha) {
      errors.push('La fecha es obligatoria');
    }

    if (!order.ventasBrutas || order.ventasBrutas <= 0) {
      errors.push('Las ventas brutas deben ser mayores que 0');
    }

    if (order.comisionPct === undefined || order.comisionPct < 0 || order.comisionPct > 100) {
      errors.push('La comisión debe estar entre 0% y 100%');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
