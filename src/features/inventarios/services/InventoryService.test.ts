import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryService } from './InventoryService';
import { DatabaseService } from '@core';
import type { Product, InventoryProductCount } from '@/types';

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
    inventoryService = new InventoryService(db);
  });

  describe('getFormattedProducts()', () => {
    it('should format products with count status', () => {
      const products: Product[] = [
        {
          id: 1,
          nombre: 'Product 1',
          categoria: 'Test',
          proveedor: 'Provider',
          proveedorId: 1,
          unidadBase: 'kg',
          precioCompra: 10,
          esEmpaquetado: false,
          stockActualUnidades: 50,
        },
        {
          id: 2,
          nombre: 'Product 2',
          categoria: 'Test',
          proveedor: 'Provider',
          proveedorId: 1,
          unidadBase: 'L',
          precioCompra: 15,
          esEmpaquetado: true,
          unidadesPorEmpaque: 6,
          stockActualUnidades: 24,
        },
      ];

      // Set a count for product 1
      inventoryService.setProductCount(1, 45);

      const formatted = inventoryService.getFormattedProducts(products);

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toMatchObject({
        id: 1,
        nombre: 'Product 1',
        stockTeorico: 50,
        counted: 45,
        hasCount: true,
      });
      expect(formatted[1]).toMatchObject({
        id: 2,
        nombre: 'Product 2',
        stockTeorico: 24,
        hasCount: false,
      });
    });

    it('should handle products without stock', () => {
      const products: Product[] = [
        {
          id: 1,
          nombre: 'Product',
          categoria: 'Test',
          proveedor: 'Provider',
          proveedorId: 1,
          unidadBase: 'kg',
          precioCompra: 10,
          esEmpaquetado: false,
        },
      ];

      const formatted = inventoryService.getFormattedProducts(products);

      expect(formatted[0].stockTeorico).toBe(0);
    });
  });

  describe('setProductCount()', () => {
    it('should set count for a product', () => {
      inventoryService.setProductCount(1, 100);
      expect(inventoryService.getProductCount(1)).toBe(100);
    });

    it('should update existing count', () => {
      inventoryService.setProductCount(1, 50);
      inventoryService.setProductCount(1, 75);
      expect(inventoryService.getProductCount(1)).toBe(75);
    });
  });

  describe('getProductCount()', () => {
    it('should return count if exists', () => {
      inventoryService.setProductCount(1, 42);
      expect(inventoryService.getProductCount(1)).toBe(42);
    });

    it('should return undefined if count does not exist', () => {
      expect(inventoryService.getProductCount(999)).toBeUndefined();
    });
  });

  describe('calculateRowTotal()', () => {
    it('should calculate total for simple unit count', () => {
      const total = inventoryService.calculateRowTotal(10, 1);
      expect(total).toBe(10);
    });

    it('should calculate total for packaged items', () => {
      const total = inventoryService.calculateRowTotal(5, 6);
      expect(total).toBe(30);
    });

    it('should handle zero quantities', () => {
      expect(inventoryService.calculateRowTotal(0, 5)).toBe(0);
      expect(inventoryService.calculateRowTotal(5, 0)).toBe(0);
    });

    it('should handle decimal values', () => {
      const total = inventoryService.calculateRowTotal(2.5, 4);
      expect(total).toBe(10);
    });
  });

  describe('resetCounts()', () => {
    it('should clear all product counts', () => {
      inventoryService.setProductCount(1, 10);
      inventoryService.setProductCount(2, 20);
      inventoryService.setProductCount(3, 30);

      inventoryService.resetCounts();

      expect(inventoryService.getProductCount(1)).toBeUndefined();
      expect(inventoryService.getProductCount(2)).toBeUndefined();
      expect(inventoryService.getProductCount(3)).toBeUndefined();
    });
  });

  describe('saveInventory()', () => {
    let product1Id: number;
    let product2Id: number;

    beforeEach(() => {
      // Clear and reset for this test suite
      localStorage.clear();
      db = new DatabaseService();
      inventoryService = new InventoryService(db);

      // Add test products
      const p1 = db.add('productos', {
        nombre: 'Product A',
        categoria: 'Bebidas',
        proveedor: 'Provider 1',
        proveedorId: 1,
        unidadBase: 'L',
        precioCompra: 10,
        esEmpaquetado: false,
        stockActualUnidades: 50,
      } as any);
      product1Id = p1.id as number;

      const p2 = db.add('productos', {
        nombre: 'Product B',
        categoria: 'Alimentos',
        proveedor: 'Provider 2',
        proveedorId: 2,
        unidadBase: 'kg',
        precioCompra: 20,
        esEmpaquetado: false,
        stockActualUnidades: 30,
      } as any);
      product2Id = p2.id as number;
    });

    it('should save inventory with all products', () => {
      const date = '2024-01-15';

      inventoryService.setProductCount(product1Id, 48);
      inventoryService.setProductCount(product2Id, 32);

      const result = inventoryService.saveInventory(date);

      expect(result.success).toBe(true);
      expect(db.inventarios).toHaveLength(1);

      const saved = db.inventarios[0] as any;
      expect(saved.fecha).toBe(date);
      expect(saved.productos).toHaveLength(2);
    });

    it('should calculate differences correctly', () => {
      const date = '2024-01-15';

      inventoryService.setProductCount(product1Id, 45); // -5 difference
      inventoryService.setProductCount(product2Id, 35); // +5 difference

      inventoryService.saveInventory(date);

      const saved = db.inventarios[0] as any;
      const product1 = saved.productos.find(
        (p: any) => p.productoId === product1Id
      );
      const product2 = saved.productos.find(
        (p: any) => p.productoId === product2Id
      );

      expect(product1.diferencia).toBe(-5);
      expect(product2.diferencia).toBe(5);
    });

    it('should use 0 for uncounted products', () => {
      const date = '2024-01-15';

      // Only count one product
      inventoryService.setProductCount(product1Id, 48);

      inventoryService.saveInventory(date);

      const saved = db.inventarios[0] as any;
      const product2 = saved.productos.find(
        (p: any) => p.productoId === product2Id
      );

      expect(product2.stockReal).toBe(0);
      expect(product2.diferencia).toBe(-30);
    });

    it('should update existing inventory if editId provided', () => {
      const date = '2024-01-15';

      // Create initial inventory
      inventoryService.setProductCount(product1Id, 48);
      const initial = inventoryService.saveInventory(date);

      // Update it
      inventoryService.setProductCount(product1Id, 50);
      const updated = inventoryService.saveInventory(date, initial.data?.id as number);

      expect(db.inventarios).toHaveLength(1);
      expect((db.inventarios[0] as any).productos[0].stockReal).toBe(50);
    });

    it('should reset counts after saving', () => {
      inventoryService.setProductCount(1, 10);
      inventoryService.setProductCount(2, 20);

      inventoryService.saveInventory('2024-01-15');

      expect(inventoryService.getProductCount(1)).toBeUndefined();
      expect(inventoryService.getProductCount(2)).toBeUndefined();
    });

    it('should return error if no date provided', () => {
      const result = inventoryService.saveInventory('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getInventorySummary()', () => {
    it('should calculate total items and value', () => {
      const products: InventoryProductCount[] = [
        {
          productoId: 1,
          nombre: 'Product A',
          stockTeorico: 50,
          stockReal: 45,
          diferencia: -5,
          valorDiferencia: -50,
          precioCompra: 10,
        },
        {
          productoId: 2,
          nombre: 'Product B',
          stockTeorico: 30,
          stockReal: 35,
          diferencia: 5,
          valorDiferencia: 100,
          precioCompra: 20,
        },
      ];

      const summary = inventoryService.getInventorySummary(products);

      expect(summary.totalItems).toBe(2);
      expect(summary.totalDifference).toBe(0);
      expect(summary.totalValue).toBe(50);
    });

    it('should handle empty product list', () => {
      const summary = inventoryService.getInventorySummary([]);
      expect(summary.totalItems).toBe(0);
      expect(summary.totalDifference).toBe(0);
      expect(summary.totalValue).toBe(0);
    });
  });
});
