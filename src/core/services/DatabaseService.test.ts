import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from './DatabaseService';
import type { Product, Provider } from '@types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as any;

// Mock FirestoreService
vi.mock('./FirestoreService', () => {
  return {
    FirestoreService: class {
      add = vi.fn().mockResolvedValue({ success: true });
      update = vi.fn().mockResolvedValue({ success: true });
      delete = vi.fn().mockResolvedValue({ success: true });
      getAll = vi.fn().mockResolvedValue({ success: true, data: [] });
    },
  };
});

// Mock DataIntegrityService to skip validation in tests
vi.mock('./DataIntegrityService', () => {
  return {
    DataIntegrityService: class {
      validateForeignKey = vi.fn().mockReturnValue({ valid: true, errors: [] });
      canDelete = vi.fn().mockReturnValue({ canDelete: true, blockingReferences: [] });
    },
  };
});

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    db = new DatabaseService();
  });

  describe('Initialization', () => {
    it('should initialize all collections as empty arrays', () => {
      expect(db.productos).toEqual([]);
      expect(db.proveedores).toEqual([]);
      expect(db.facturas).toEqual([]);
      expect(db.cierres).toEqual([]);
    });

    // TODO: This test is obsolete - DatabaseService now clears localStorage and syncs from Firebase only
    // See constructor: "Clear any old localStorage data to ensure only Firebase data is used"
    it.skip('should load existing data from localStorage', () => {
      const mockProducts: Product[] = [
        {
          id: 1,
          nombre: 'Test Product',
          categoria: 'Test',
          proveedor: 'Test Provider',
          proveedorId: 1,
          unidadBase: 'kg',
          precioCompra: 10,
          esEmpaquetado: false,
        },
      ];
      localStorage.setItem('productos', JSON.stringify(mockProducts));

      const newDb = new DatabaseService();
      expect(newDb.productos).toEqual(mockProducts);
    });
  });

  describe('add()', () => {
    it('should add item with auto-generated id and timestamps', () => {
      const product: Omit<Product, 'id'> = {
        nombre: 'New Product',
        categoria: 'Food',
        proveedor: 'Provider A',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 15,
        esEmpaquetado: false,
      };

      const result = db.add('productos', product);

      expect(result.id).toBeDefined();
      expect(result.nombre).toBe('New Product');
      expect(result._synced).toBe(false);
      expect(db.productos).toHaveLength(1);
    });

    it('should save to localStorage after adding', () => {
      const product: Omit<Product, 'id'> = {
        nombre: 'Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      };

      db.add('productos', product);

      const stored = JSON.parse(localStorage.getItem('productos') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].nombre).toBe('Test');
    });

    it('should trigger cloud sync', async () => {
      const product: Omit<Product, 'id'> = {
        nombre: 'Cloud Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      };

      db.add('productos', product);

      // Wait for async cloud sync
      await new Promise((resolve) => setTimeout(resolve, 10));

      // CloudService.add now receives: collectionName, data, firestoreId
      expect(db.cloudService.add).toHaveBeenCalledWith(
        'productos',
        expect.objectContaining({ nombre: 'Cloud Test' }),
        expect.any(String) // firestoreId
      );
    });
  });

  describe('update()', () => {
    it('should update existing item', () => {
      const product = db.add('productos', {
        nombre: 'Original',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      const updated = db.update('productos', product.id, { nombre: 'Updated' });

      expect(updated).toBeTruthy();
      expect(updated?.nombre).toBe('Updated');
      expect(updated?._synced).toBe(false);
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should return null for non-existent item', () => {
      const result = db.update('productos', 99999, { nombre: 'Ghost' });
      expect(result).toBeNull();
    });

    it('should preserve item id during update', () => {
      const product = db.add('productos', {
        nombre: 'Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      const originalId = product.id;
      const updated = db.update('productos', originalId, { nombre: 'Updated' });

      expect(updated?.id).toBe(originalId);
    });
  });

  describe('delete()', () => {
    it('should remove item from collection', () => {
      const product = db.add('productos', {
        nombre: 'To Delete',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      expect(db.productos).toHaveLength(1);

      db.delete('productos', product.id);

      expect(db.productos).toHaveLength(0);
    });

    it('should save to localStorage after deletion', () => {
      const product = db.add('productos', {
        nombre: 'Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      db.delete('productos', product.id);

      const stored = JSON.parse(localStorage.getItem('productos') || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('getByPeriod()', () => {
    beforeEach(() => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 8);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 2);

      db.add('facturas', { fecha: today.toISOString(), total: 100 } as any);
      db.add('facturas', { fecha: yesterday.toISOString(), total: 200 } as any);
      db.add('facturas', { fecha: lastWeek.toISOString(), total: 300 } as any);
      db.add('facturas', { fecha: lastMonth.toISOString(), total: 400 } as any);
    });

    it('should filter by day', () => {
      const result = db.getByPeriod('facturas', 'dia');
      expect(result).toHaveLength(1);
      expect((result[0] as any).total).toBe(100);
    });

    it('should filter by week', () => {
      const result = db.getByPeriod('facturas', 'semana');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by month', () => {
      const result = db.getByPeriod('facturas', 'mes');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by year', () => {
      const result = db.getByPeriod('facturas', 'anio');
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should return all items for "todo" period', () => {
      const result = db.getByPeriod('facturas', 'todo');
      expect(result).toHaveLength(4);
    });

    it('should handle items without fecha', () => {
      db.add('facturas', { total: 500 } as any);
      const result = db.getByPeriod('facturas', 'dia');
      expect(result.some((f: any) => f.total === 500)).toBe(true);
    });
  });

  describe('Collection Access', () => {
    it('should allow direct access to collections', () => {
      db.add('productos', {
        nombre: 'Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      expect(db.productos).toHaveLength(1);
      expect(db.productos[0].nombre).toBe('Test');
    });
  });
});
