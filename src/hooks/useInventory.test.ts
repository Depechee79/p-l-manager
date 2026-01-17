import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInventory } from './useInventory';
import { DatabaseService } from '@core';

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

  it('should load products from database', () => {
    db.add('productos', {
      nombre: 'Product 1',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    db.add('productos', {
      nombre: 'Product 2',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));
    expect(result.current.products).toHaveLength(2);
  });

  it('should start new inventory count', () => {
    db.add('productos', {
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

  it('should record product count', () => {
    const product = db.add('productos', {
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

  it('should complete inventory', () => {
    const product = db.add('productos', {
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
      result.current.completeInventory();
    });

    expect(result.current.isCountingInventory).toBe(false);
    expect(db.inventarios.length).toBe(initialInventories + 1);
  });

  it('should cancel inventory', () => {
    const product = db.add('productos', {
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

  it('should filter products by category', () => {
    db.add('productos', {
      nombre: 'Tomato',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    db.add('productos', {
      nombre: 'Chicken',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.filterByCategory('Verduras');
    });

    expect(result.current.filteredProducts).toHaveLength(1);
    expect(result.current.filteredProducts[0].nombre).toBe('Tomato');
  });

  it('should return all products when category filter is "Todos"', () => {
    db.add('productos', {
      nombre: 'Tomato',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    db.add('productos', {
      nombre: 'Chicken',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    act(() => {
      result.current.filterByCategory('Verduras');
    });

    expect(result.current.filteredProducts).toHaveLength(1);

    act(() => {
      result.current.filterByCategory('Todos');
    });

    expect(result.current.filteredProducts).toHaveLength(2);
  });

  it('should get available categories', () => {
    db.add('productos', {
      nombre: 'Tomato',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 10,
      esEmpaquetado: false,
    } as any);

    db.add('productos', {
      nombre: 'Chicken',
      categoria: 'Carnes',
      proveedor: 'Provider 2',
      proveedorId: 2,
      unidadBase: 'kg',
      precioCompra: 20,
      esEmpaquetado: false,
    } as any);

    db.add('productos', {
      nombre: 'Lettuce',
      categoria: 'Verduras',
      proveedor: 'Provider 1',
      proveedorId: 1,
      unidadBase: 'kg',
      precioCompra: 8,
      esEmpaquetado: false,
    } as any);

    const { result } = renderHook(() => useInventory(db));

    expect(result.current.categories).toContain('Verduras');
    expect(result.current.categories).toContain('Carnes');
    expect(result.current.categories.length).toBe(2);
  });

  it('should get inventory history', () => {
    db.add('inventarios', {
      fecha: '2024-01-15',
      productos: [{ productoId: 1, cantidad: 10 }],
    } as any);

    db.add('inventarios', {
      fecha: '2024-02-15',
      productos: [{ productoId: 1, cantidad: 15 }],
    } as any);

    const { result } = renderHook(() => useInventory(db));

    expect(result.current.inventoryHistory).toHaveLength(2);
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
