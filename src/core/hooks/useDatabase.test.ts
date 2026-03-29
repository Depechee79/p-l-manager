import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useDatabase } from './useDatabase';
import { DatabaseProvider } from '../context/DatabaseContext';
import type { Product } from '@types';

// Mock FirestoreService to skip cloud sync in tests
vi.mock('../services/FirestoreService', () => {
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
vi.mock('../services/DataIntegrityService', () => {
  return {
    DataIntegrityService: class {
      validateForeignKey = vi.fn().mockReturnValue({ valid: true, errors: [] });
      validateDelete = vi.fn().mockReturnValue({ valid: true, errors: [] });
      validateEntity = vi.fn().mockReturnValue({ valid: true, errors: [] });
      canDelete = vi.fn().mockReturnValue({ canDelete: true, dependencies: [] });
    },
  };
});

// Mock LoggerService
vi.mock('../services/LoggerService', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Mock ToastService
vi.mock('../services/ToastService', () => ({
  ToastService: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(DatabaseProvider, null, children);

describe('useDatabase', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide database instance', () => {
    const { result } = renderHook(() => useDatabase(), { wrapper });
    expect(result.current.db).toBeDefined();
    expect(result.current.db.productos).toBeDefined();
    expect(result.current.db.proveedores).toBeDefined();
  });

  it('should provide add method', async () => {
    const { result } = renderHook(() => useDatabase(), { wrapper });

    await act(async () => {
      await result.current.db.add('productos', {
        nombre: 'Test Product',
        categoria: 'Test',
        proveedor: 'Test Provider',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);
    });

    expect(result.current.db.productos).toHaveLength(1);
  });

  it('should provide update method', async () => {
    const { result } = renderHook(() => useDatabase(), { wrapper });

    let productId: number;

    await act(async () => {
      const product = await result.current.db.add('productos', {
        nombre: 'Test Product',
        categoria: 'Test',
        proveedor: 'Test Provider',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);
      productId = product.id as number;
    });

    await act(async () => {
      await result.current.db.update('productos', productId, {
        nombre: 'Updated Product',
      } as Partial<Product>);
    });

    const updated = result.current.db.productos[0] as Product;
    expect(updated.nombre).toBe('Updated Product');
  });

  it('should provide delete method', async () => {
    const { result } = renderHook(() => useDatabase(), { wrapper });

    let productId: number;

    await act(async () => {
      const product = await result.current.db.add('productos', {
        nombre: 'Test Product',
        categoria: 'Test',
        proveedor: 'Test Provider',
        proveedorId: 1,
        unidadBase: 'kg',
        precioCompra: 10,
        esEmpaquetado: false,
      } as Omit<Product, 'id'>);
      productId = product.id as number;
    });

    expect(result.current.db.productos).toHaveLength(1);

    await act(async () => {
      await result.current.db.delete('productos', productId);
    });

    expect(result.current.db.productos).toHaveLength(0);
  });

  it('should maintain same instance across re-renders', () => {
    const { result, rerender } = renderHook(() => useDatabase(), { wrapper });
    const firstInstance = result.current.db;

    rerender();

    expect(result.current.db).toBe(firstInstance);
  });
});
