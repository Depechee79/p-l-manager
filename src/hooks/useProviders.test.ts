import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProviders } from './useProviders';
import { DatabaseService } from '../services/DatabaseService';

describe('useProviders', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
  });

  it('should return empty providers list initially', () => {
    const { result } = renderHook(() => useProviders(db));
    expect(result.current.providers).toEqual([]);
  });

  it('should load providers from database', () => {
    db.add('proveedores', {
      nombre: 'Provider 1',
      cif: 'A12345678',
      contacto: 'contact@provider1.com',
    } as any);

    db.add('proveedores', {
      nombre: 'Provider 2',
      cif: 'B87654321',
      contacto: 'contact@provider2.com',
    } as any);

    const { result } = renderHook(() => useProviders(db));
    expect(result.current.providers).toHaveLength(2);
  });

  it('should create new provider', async () => {
    const { result } = renderHook(() => useProviders(db));

    await act(async () => {
      await result.current.createProvider({
        nombre: 'New Provider',
        cif: 'C11111111',
        contacto: 'new@provider.com',
      });
    });

    expect(result.current.providers).toHaveLength(1);
    expect(result.current.providers[0].nombre).toBe('New Provider');
  });

  it('should update existing provider', async () => {
    const provider = db.add('proveedores', {
      nombre: 'Original Provider',
      cif: 'A12345678',
      contacto: 'original@provider.com',
    } as any);

    const { result } = renderHook(() => useProviders(db));

    await act(async () => {
      await result.current.updateProvider(provider.id, {
        nombre: 'Updated Provider',
        cif: 'A12345678',
        contacto: 'updated@provider.com',
      });
    });

    expect(result.current.providers[0].nombre).toBe('Updated Provider');
  });

  it('should delete provider', async () => {
    const provider = db.add('proveedores', {
      nombre: 'Provider to Delete',
      cif: 'A12345678',
      contacto: 'delete@provider.com',
    } as any);

    const { result } = renderHook(() => useProviders(db));
    expect(result.current.providers).toHaveLength(1);

    await act(async () => {
      await result.current.deleteProvider(provider.id);
    });

    expect(result.current.providers).toHaveLength(0);
  });

  it('should search providers', () => {
    db.add('proveedores', {
      nombre: 'Acme Corporation',
      cif: 'A12345678',
      contacto: 'acme@example.com',
      ciudad: 'Madrid',
    } as any);

    db.add('proveedores', {
      nombre: 'Beta Solutions',
      cif: 'B87654321',
      contacto: 'beta@example.com',
      ciudad: 'Barcelona',
    } as any);

    const { result } = renderHook(() => useProviders(db));

    act(() => {
      result.current.searchProviders('acme');
    });

    expect(result.current.filteredProviders).toHaveLength(1);
    expect(result.current.filteredProviders[0].nombre).toBe('Acme Corporation');
  });

  it('should return all providers when search is empty', () => {
    db.add('proveedores', {
      nombre: 'Provider 1',
      cif: 'A12345678',
      contacto: 'p1@example.com',
    } as any);

    db.add('proveedores', {
      nombre: 'Provider 2',
      cif: 'B87654321',
      contacto: 'p2@example.com',
    } as any);

    const { result } = renderHook(() => useProviders(db));

    act(() => {
      result.current.searchProviders('');
    });

    expect(result.current.filteredProviders).toHaveLength(2);
  });

  it('should get provider statistics', () => {
    const p1 = db.add('proveedores', {
      nombre: 'Provider 1',
      cif: 'A12345678',
      contacto: 'p1@example.com',
    } as any);

    db.add('proveedores', {
      nombre: 'Provider 2',
      cif: 'B87654321',
      contacto: 'p2@example.com',
    } as any);

    db.add('facturas', {
      proveedorId: p1.id,
      fecha: '2024-01-15',
      total: 1000,
    } as any);

    const { result } = renderHook(() => useProviders(db));

    expect(result.current.stats.total).toBe(2);
    expect(result.current.stats.withInvoices).toBe(1);
    expect(result.current.stats.withoutInvoices).toBe(1);
    expect(result.current.stats.totalSpent).toBe(1000);
  });

  it('should initialize with loading false', () => {
    const { result } = renderHook(() => useProviders(db));
    expect(result.current.loading).toBe(false);
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useProviders(db));

    await act(async () => {
      await result.current.createProvider({
        nombre: '',
        cif: '',
        contacto: '',
      });
    });

    expect(result.current.error).toBeDefined();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useProviders(db));

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
