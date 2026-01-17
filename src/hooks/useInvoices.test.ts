import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoices } from './useInvoices';
import { DatabaseService } from '@core';

describe('useInvoices', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
  });

  it('should return empty invoices list initially', () => {
    const { result } = renderHook(() => useInvoices(db));
    expect(result.current.invoices).toEqual([]);
  });

  it('should load invoices from database', () => {
    db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    db.add('facturas', {
      proveedorId: 2,
      proveedor: 'Provider 2',
      numeroFactura: 'INV-002',
      fecha: '2024-02-15',
      total: 2000,
      baseImponible: 1652.89,
      iva: 347.11,
      productos: [],
    } as any);

    const { result } = renderHook(() => useInvoices(db));
    expect(result.current.invoices).toHaveLength(2);
  });

  it('should filter invoices by provider', () => {
    db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    db.add('facturas', {
      proveedorId: 2,
      proveedor: 'Provider 2',
      numeroFactura: 'INV-002',
      fecha: '2024-02-15',
      total: 2000,
      baseImponible: 1652.89,
      iva: 347.11,
      productos: [],
    } as any);

    const { result } = renderHook(() => useInvoices(db));

    act(() => {
      result.current.filterByProvider(1);
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].proveedor).toBe('Provider 1');
  });

  it('should return all invoices when provider filter is null', () => {
    db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    db.add('facturas', {
      proveedorId: 2,
      proveedor: 'Provider 2',
      numeroFactura: 'INV-002',
      fecha: '2024-02-15',
      total: 2000,
      baseImponible: 1652.89,
      iva: 347.11,
      productos: [],
    } as any);

    const { result } = renderHook(() => useInvoices(db));

    act(() => {
      result.current.filterByProvider(1);
    });

    expect(result.current.filteredInvoices).toHaveLength(1);

    act(() => {
      result.current.filterByProvider(null);
    });

    expect(result.current.filteredInvoices).toHaveLength(2);
  });

  it('should filter invoices by period', () => {
    db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    db.add('facturas', {
      proveedorId: 2,
      proveedor: 'Provider 2',
      numeroFactura: 'INV-002',
      fecha: '2024-02-15',
      total: 2000,
      baseImponible: 1652.89,
      iva: 347.11,
      productos: [],
    } as any);

    const { result } = renderHook(() => useInvoices(db));

    act(() => {
      result.current.filterByPeriod('2024-01-01', '2024-01-31');
    });

    expect(result.current.filteredInvoices).toHaveLength(1);
    expect(result.current.filteredInvoices[0].numeroFactura).toBe('INV-001');
  });

  it('should create new invoice', async () => {
    const { result } = renderHook(() => useInvoices(db));

    await act(async () => {
      await result.current.createInvoice({
        proveedorId: 1,
        proveedor: 'Provider 1',
        tipo: 'factura',
        numeroFactura: 'INV-NEW',
        fecha: '2024-03-15',
        total: 500,

        productos: [],
      });
    });

    expect(result.current.invoices).toHaveLength(1);
    expect(result.current.invoices[0].numeroFactura).toBe('INV-NEW');
  });

  it('should update existing invoice', async () => {
    const invoice = db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    const { result } = renderHook(() => useInvoices(db));

    await act(async () => {
      await result.current.updateInvoice(invoice.id, {
        proveedorId: 1,
        proveedor: 'Provider 1',
        tipo: 'factura',
        numeroFactura: 'INV-001-UPDATED',
        fecha: '2024-01-15',
        total: 1500,

        productos: [],
      });
    });

    expect(result.current.invoices[0].numeroFactura).toBe('INV-001-UPDATED');
    expect(result.current.invoices[0].total).toBe(1500);
  });

  it('should delete invoice', async () => {
    const invoice = db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    const { result } = renderHook(() => useInvoices(db));
    expect(result.current.invoices).toHaveLength(1);

    await act(async () => {
      await result.current.deleteInvoice(invoice.id);
    });

    expect(result.current.invoices).toHaveLength(0);
  });

  it('should calculate total amount', () => {
    db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    db.add('facturas', {
      proveedorId: 2,
      proveedor: 'Provider 2',
      numeroFactura: 'INV-002',
      fecha: '2024-02-15',
      total: 2000,
      baseImponible: 1652.89,
      iva: 347.11,
      productos: [],
    } as any);

    const { result } = renderHook(() => useInvoices(db));

    expect(result.current.totalAmount).toBe(3000);
  });

  it('should handle errors', () => {
    const { result } = renderHook(() => useInvoices(db));

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useInvoices(db));

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
