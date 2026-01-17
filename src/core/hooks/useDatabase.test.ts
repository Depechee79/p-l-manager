import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDatabase } from './useDatabase';

describe('useDatabase', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide database instance', () => {
    const { result } = renderHook(() => useDatabase());
    expect(result.current.db).toBeDefined();
    expect(result.current.db.productos).toBeDefined();
    expect(result.current.db.proveedores).toBeDefined();
  });

  it('should provide add method', () => {
    const { result } = renderHook(() => useDatabase());

    act(() => {
      result.current.db.add('productos', {
        nombre: 'Test Product',
        categoria: 'Test',
        proveedor: 'Test Provider',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as any);
    });

    expect(result.current.db.productos).toHaveLength(1);
  });

  it('should provide update method', () => {
    const { result } = renderHook(() => useDatabase());

    let productId: number;

    act(() => {
      const product = result.current.db.add('productos', {
        nombre: 'Test Product',
        categoria: 'Test',
        proveedor: 'Test Provider',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as any);
      productId = product.id as number;
    });

    act(() => {
      result.current.db.update('productos', productId, {
        nombre: 'Updated Product',
      } as any);
    });

    const updated = result.current.db.productos[0] as any;
    expect(updated.nombre).toBe('Updated Product');
  });

  it('should provide delete method', () => {
    const { result } = renderHook(() => useDatabase());

    let productId: number;

    act(() => {
      const product = result.current.db.add('productos', {
        nombre: 'Test Product',
        categoria: 'Test',
        proveedor: 'Test Provider',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as any);
      productId = product.id as number;
    });

    expect(result.current.db.productos).toHaveLength(1);

    act(() => {
      result.current.db.delete('productos', productId);
    });

    expect(result.current.db.productos).toHaveLength(0);
  });

  it('should maintain same instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useDatabase());
    const firstInstance = result.current.db;

    rerender();

    expect(result.current.db).toBe(firstInstance);
  });
});
