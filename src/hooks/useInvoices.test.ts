import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInvoices } from './useInvoices';
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

  it('should load invoices from database', async () => {
    await db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    await db.add('facturas', {
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

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(2);
    });
  });

  it('should filter invoices by provider', async () => {
    await db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    await db.add('facturas', {
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

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(2);
    });

    act(() => {
      result.current.filterByProvider(1);
    });

    await waitFor(() => {
      expect(result.current.filteredInvoices).toHaveLength(1);
      expect(result.current.filteredInvoices[0].proveedor).toBe('Provider 1');
    });
  });

  it('should return all invoices when provider filter is null', async () => {
    await db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    await db.add('facturas', {
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

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(2);
    });

    act(() => {
      result.current.filterByProvider(1);
    });

    await waitFor(() => {
      expect(result.current.filteredInvoices).toHaveLength(1);
    });

    act(() => {
      result.current.filterByProvider(null);
    });

    await waitFor(() => {
      expect(result.current.filteredInvoices).toHaveLength(2);
    });
  });

  it('should filter invoices by period', async () => {
    await db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    await db.add('facturas', {
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

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(2);
    });

    act(() => {
      result.current.filterByPeriod('2024-01-01', '2024-01-31');
    });

    await waitFor(() => {
      expect(result.current.filteredInvoices).toHaveLength(1);
      expect(result.current.filteredInvoices[0].numeroFactura).toBe('INV-001');
    });
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
      // Wait for async db.add to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // refreshInvoices reads db.facturas synchronously, but db.add is async
    // Need to wait for the hook state to settle
    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(1);
    });
  });

  it('should update existing invoice', async () => {
    const invoice = await db.add('facturas', {
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

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(1);
    });

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
      // Wait for async db.update to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(result.current.invoices[0].numeroFactura).toBe('INV-001-UPDATED');
      expect(result.current.invoices[0].total).toBe(1500);
    });
  });

  it('should delete invoice', async () => {
    const invoice = await db.add('facturas', {
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

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteInvoice(invoice.id);
      // deleteInvoice fires db.delete without await, wait for it to complete
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Verify deletion happened at the database level
    expect(db.facturas).toHaveLength(0);
  });

  it('should calculate total amount', async () => {
    await db.add('facturas', {
      proveedorId: 1,
      proveedor: 'Provider 1',
      numeroFactura: 'INV-001',
      fecha: '2024-01-15',
      total: 1000,
      baseImponible: 826.45,
      iva: 173.55,
      productos: [],
    } as any);

    await db.add('facturas', {
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

    await waitFor(() => {
      expect(result.current.totalAmount).toBe(3000);
    });
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
