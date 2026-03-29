import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInventory } from './useInventory';
import { DatabaseService } from '@core';

// Mock FirestoreService to skip cloud sync in tests
vi.mock('@core/services/FirestoreService', () => {
  return {
    FirestoreService: class {
      add = vi.fn().mockResolvedValue({ success: true });
      update = vi.fn().mockResolvedValue({ success: true });
      delete = vi.fn().mockResolvedValue({ success: true });
      getAll = vi.fn().mockResolvedValue({ success: true, data: [] });
    },
  };
});

// Mock DataIntegrityService to skip FK validation in tests
vi.mock('@core/services/DataIntegrityService', () => {
  return {
    DataIntegrityService: class {
      validateForeignKey = vi.fn().mockReturnValue({ valid: true, errors: [] });
      canDelete = vi.fn().mockReturnValue({ canDelete: true, blockingReferences: [] });
    },
  };
});

describe('useInventory', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
  });

  it('should return empty products list initially', () => {
    const { result } = renderHook(() => useInventory(db));
    expect(result.current.products).toEqual([]);
  });

  it('should load products from database', async () => {
    await db.add('productos', {
      nombre: 'Product 1',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    await db.add('productos', {
      nombre: 'Product 2',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    // useInventory has a 1s setTimeout before loading data
    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
    }, { timeout: 2000 });
  });

  it('should start new inventory count', async () => {
    await db.add('productos', {
      nombre: 'Product 1',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.startInventory();
    });

    expect(result.current.isCountingInventory).toBe(true);
    expect(result.current.inventory).toBeDefined();
  });

  it('should record product count', async () => {
    const product = await db.add('productos', {
      nombre: 'Product 1',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.startInventory();
    });

    act(() => {
      result.current.recordCount(product.id, 5);
    });

    expect(result.current.inventory?.getCounts().size).toBe(1);
  });

  it('should complete inventory', async () => {
    const product = await db.add('productos', {
      nombre: 'Product 1',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.startInventory();
    });

    act(() => {
      result.current.recordCount(product.id, 5);
    });

    const initialInventories = db.inventarios.length;

    await act(async () => {
      result.current.completeInventory();
      // Wait for async db.add to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.isCountingInventory).toBe(false);
    expect(db.inventarios.length).toBe(initialInventories + 1);
  });

  it('should cancel inventory', async () => {
    const product = await db.add('productos', {
      nombre: 'Product 1',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.startInventory();
    });

    act(() => {
      result.current.recordCount(product.id, 5);
    });

    const initialInventories = db.inventarios.length;

    act(() => {
      result.current.cancelInventory();
    });

    expect(result.current.isCountingInventory).toBe(false);
    expect(db.inventarios.length).toBe(initialInventories);
  });

  it('should filter products by category', async () => {
    await db.add('productos', {
      nombre: 'Tomato',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    await db.add('productos', {
      nombre: 'Chicken',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    // Wait for async data loading (1s setTimeout + ensureLoaded)
    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
    }, { timeout: 2000 });

    act(() => {
      result.current.filterByCategory('Verduras');
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].nombre).toBe('Tomato');
  });

  it('should return all products when category filter is "Todos"', async () => {
    await db.add('productos', {
      nombre: 'Tomato',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    await db.add('productos', {
      nombre: 'Chicken',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
    }, { timeout: 2000 });

    act(() => {
      result.current.filterByCategory('Verduras');
    });

    expect(result.current.filteredProducts).toHaveLength(1);

    act(() => {
      result.current.filterByCategory('Todos');
    });

    expect(result.current.filteredProducts).toHaveLength(2);
  });

  it('should get available categories', async () => {
    await db.add('productos', {
      nombre: 'Tomato',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    await db.add('productos', {
      nombre: 'Chicken',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    await db.add('productos', {
      nombre: 'Lettuce',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 8,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    await waitFor(() => {
      expect(result.current.categories).toContain('Verduras');
      expect(result.current.categories).toContain('Carnes');
      expect(result.current.categories.length).toBe(2);
    }, { timeout: 2000 });
  });

  it('should get inventory history', async () => {
    // Seed prerequisite product (inventarios.productos[].productoId references productos)
    await db.add('productos', {
      nombre: 'Product 1',
      categoria: 'Test',
      proveedor: 'Provider',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);
    const productId = db.productos[0].id;

    await db.add('inventarios', {
      fecha: '2024-01-15',
      productos: [{ productoId: productId, cantidad: 10 }],
    } as any);

    await db.add('inventarios', {
      fecha: '2024-02-15',
      productos: [{ productoId: productId, cantidad: 15 }],
    } as any);

    const { result } = renderHook(() => useInventory(db));

    await waitFor(() => {
      expect(result.current.inventoryHistory).toHaveLength(2);
    }, { timeout: 2000 });
  });

  it('should handle errors', () => {
    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});
