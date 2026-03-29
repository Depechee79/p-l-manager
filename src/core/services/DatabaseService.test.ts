import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService } from './DatabaseService';
import type { Product, Provider, BaseEntity } from '@types';

// Mock localStorage with proper Storage interface
const localStorageMock: Storage = (() => {
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
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

global.localStorage = localStorageMock;

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
    it('should add item with auto-generated id and timestamps', async () => {
      const product: Omit<Product, 'id'> = {
        nombre: 'New Product',
        categoria: 'Food',
        proveedor: 'Provider A',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 15,
        esEmpaquetado: false,
      };

      const result = await db.add('productos', product);

      expect(result.id).toBeDefined();
      expect(result.nombre).toBe('New Product');
      expect(result._synced).toBe(true);
      expect(db.productos).toHaveLength(1);
    });

    it('should save to localStorage after adding', async () => {
      const product: Omit<Product, 'id'> = {
        nombre: 'Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      };

      await db.add('productos', product);

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

      await db.add('productos', product);

      // CloudService.add now receives: collectionName, data, firestoreId
      expect(db.cloudService.add).toHaveBeenCalledWith(
        'productos',
        expect.objectContaining({ nombre: 'Cloud Test' }),
        expect.any(String) // firestoreId
      );
    });
  });

  describe('update()', () => {
    it('should update existing item', async () => {
      const product = await db.add('productos', {
        nombre: 'Original',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      const updated = await db.update('productos', product.id, { nombre: 'Updated' });

      expect(updated).toBeTruthy();
      expect(updated?.nombre).toBe('Updated');
      expect(updated?._synced).toBe(true);
      expect(updated?.updatedAt).toBeDefined();
    });

    it('should return null for non-existent item', async () => {
      const result = await db.update('productos', 99999, { nombre: 'Ghost' });
      expect(result).toBeNull();
    });

    it('should preserve item id during update', async () => {
      const product = await db.add('productos', {
        nombre: 'Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      const originalId = product.id;
      const updated = await db.update('productos', originalId, { nombre: 'Updated' });

      expect(updated?.id).toBe(originalId);
    });
  });

  describe('delete()', () => {
    it('should remove item from collection', async () => {
      const product = await db.add('productos', {
        nombre: 'To Delete',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      expect(db.productos).toHaveLength(1);

      await db.delete('productos', product.id);

      expect(db.productos).toHaveLength(0);
    });

    it('should save to localStorage after deletion', async () => {
      const product = await db.add('productos', {
        nombre: 'Test',
        categoria: 'Test',
        proveedor: 'Test',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);

      await db.delete('productos', product.id);

      const stored = JSON.parse(localStorage.getItem('productos') || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('getByPeriod()', () => {
    /** Creates minimal test invoice data for period filtering tests */
    function makeTestInvoice(fecha: string, total: number): Omit<BaseEntity, 'id'> & Record<string, unknown> {
      return { fecha, total, _synced: false };
    }

    beforeEach(async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 8);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 2);

      await db.add('facturas', makeTestInvoice(today.toISOString(), 100));
      await db.add('facturas', makeTestInvoice(yesterday.toISOString(), 200));
      await db.add('facturas', makeTestInvoice(lastWeek.toISOString(), 300));
      await db.add('facturas', makeTestInvoice(lastMonth.toISOString(), 400));
    });

    it('should filter by day', () => {
      const result = db.getByPeriod('facturas', 'dia');
      expect(result).toHaveLength(1);
      expect((result[0] as BaseEntity & { total: number }).total).toBe(100);
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

    it('should handle items without fecha', async () => {
      await db.add('facturas', { total: 500, _synced: false } as Omit<BaseEntity, 'id'> & { total: number });
      const result = db.getByPeriod('facturas', 'dia');
      expect(result.some((f) => (f as BaseEntity & { total: number }).total === 500)).toBe(true);
    });
  });

  describe('Collection Access', () => {
    it('should allow direct access to collections', async () => {
      await db.add('productos', {
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
