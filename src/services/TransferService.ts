import type { Transfer } from '../types';
import { DatabaseService } from '@core';

export class TransferService {
  constructor(private db: DatabaseService) { }

  /**
   * Create a new transfer request
   */
  async createTransfer(data: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transfer> {
    const transfer: Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      estado: 'pendiente',
    };
    return await this.db.add('transfers', transfer) as Transfer;
  }

  /**
   * Get transfer by ID
   */
  getTransfer(id: string): Transfer | null {
    const transfers = this.db.transfers as Transfer[];
    return transfers.find(t => t.id === id) || null;
  }

  /**
   * Approve transfer (restaurant destination accepts)
   */
  async approveTransfer(transferId: string, restaurantId: string): Promise<Transfer | null> {
    const transfer = this.getTransfer(transferId);
    if (!transfer || transfer.restauranteDestino !== restaurantId) {
      return null;
    }

    return await this.db.update('transfers', transferId, {
      estado: 'en_transito',
    } as Partial<Transfer>) as Transfer | null;
  }

  /**
   * Complete transfer (destination confirms reception)
   */
  async completeTransfer(transferId: string): Promise<Transfer | null> {
    const transfer = this.getTransfer(transferId);
    if (!transfer || transfer.estado !== 'en_transito') {
      return null;
    }

    // TODO: Update inventory for both restaurants
    // This would need to integrate with InventoryService

    return await this.db.update('transfers', transferId, {
      estado: 'completada',
    } as Partial<Transfer>) as Transfer | null;
  }

  /**
   * Cancel transfer
   */
  async cancelTransfer(transferId: string): Promise<Transfer | null> {
    return await this.db.update('transfers', transferId, {
      estado: 'cancelada',
    } as Partial<Transfer>) as Transfer | null;
  }

  /**
   * Get transfers for a restaurant
   */
  getTransfers(restaurantId?: string, filters?: {
    estado?: Transfer['estado'];
    fechaDesde?: string;
    fechaHasta?: string;
  }): Transfer[] {
    let transfers = this.db.transfers as Transfer[];

    if (restaurantId) {
      transfers = transfers.filter(t =>
        t.restauranteOrigen === restaurantId ||
        t.restauranteDestino === restaurantId
      );
    }

    if (filters?.estado) {
      transfers = transfers.filter(t => t.estado === filters.estado);
    }

    if (filters?.fechaDesde) {
      transfers = transfers.filter(t => t.fecha >= filters.fechaDesde!);
    }

    if (filters?.fechaHasta) {
      transfers = transfers.filter(t => t.fecha <= filters.fechaHasta!);
    }

    return transfers;
  }

  /**
   * Get pending transfers for a restaurant
   */
  getPendingTransfers(restaurantId: string): Transfer[] {
    return this.getTransfers(restaurantId, { estado: 'pendiente' });
  }
}
