import type {
  Product,
  InventoryItem,
  InventoryProductCount,
} from '@/types';
import { DatabaseService } from '@core';

/**
 * Formatted product for inventory display
 */
export interface FormattedInventoryProduct extends Product {
  stockTeorico: number;
  counted?: number;
  hasCount: boolean;
}

/**
 * Inventory summary statistics
 */
export interface InventorySummary {
  totalItems: number;
  totalDifference: number;
  totalValue: number;
}

/**
 * Result of save operation
 */
export interface SaveResult {
  success: boolean;
  data?: InventoryItem;
  error?: string;
}

/**
 * Inventory Service
 * Handles inventory counting logic without UI concerns
 */
export class InventoryService {
  private counts: Map<string | number, number> = new Map();
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Format products with count information
   */
  getFormattedProducts(products: Product[]): FormattedInventoryProduct[] {
    return products.map((p) => {
      const counted = this.counts.get(p.id);
      const hasCount = counted !== undefined;
      const stockTeorico = p.stockActualUnidades || 0;

      return {
        ...p,
        stockTeorico,
        counted,
        hasCount,
      };
    });
  }

  /**
   * Set count for a specific product
   */
  setProductCount(productId: string | number, count: number): void {
    this.counts.set(productId, count);
  }

  /**
   * Get count for a specific product
   */
  getProductCount(productId: string | number): number | undefined {
    return this.counts.get(productId);
  }

  /**
   * Calculate total units from quantity and units per package
   */
  calculateRowTotal(quantity: number, unitsPerPackage: number): number {
    return quantity * unitsPerPackage;
  }

  /**
   * Reset all counts
   */
  resetCounts(): void {
    this.counts.clear();
  }

  /**
   * Save inventory snapshot
   */
  async saveInventory(date: string, editId?: number): Promise<SaveResult> {
    if (!date) {
      return {
        success: false,
        error: 'Date is required',
      };
    }

    try {
      // Get all products
      const products = this.db.productos as Product[];

      // Build detailed product list
      const productosDetalle: InventoryProductCount[] = products.map((p) => {
        const stockTeorico = p.stockActualUnidades || 0;
        const stockReal = this.counts.get(p.id) ?? 0;
        const diferencia = stockReal - stockTeorico;
        const valorDiferencia = diferencia * (p.precioCompra || 0);

        return {
          productoId: p.id,
          nombre: p.nombre,
          stockTeorico,
          stockReal,
          diferencia,
          valorDiferencia,
          precioCompra: p.precioCompra,
        };
      });

      // Calculate totals
      const totalItems = productosDetalle.length;
      const valorTotal = productosDetalle.reduce(
        (sum, p) => sum + p.valorDiferencia,
        0
      );

      const inventario: Omit<InventoryItem, 'id'> & { id?: number } = {
        fecha: date,
        productos: productosDetalle,
        totalItems,
        valorTotal,
      };

      let saved: InventoryItem;

      if (editId) {
        saved = await this.db.update('inventarios', editId, inventario) as InventoryItem;
      } else {
        saved = await this.db.add('inventarios', inventario) as InventoryItem;
      }

      // Reset counts after saving
      this.resetCounts();

      return {
        success: true,
        data: saved,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Get summary statistics for inventory products
   */
  getInventorySummary(products: InventoryProductCount[]): InventorySummary {
    return {
      totalItems: products.length,
      totalDifference: products.reduce((sum, p) => sum + p.diferencia, 0),
      totalValue: products.reduce((sum, p) => sum + p.valorDiferencia, 0),
    };
  }

  /**
   * Get current counts (for external access if needed)
   */
  getCounts(): Map<string | number, number> {
    return new Map(this.counts);
  }
}
