import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFinance } from './useFinance';
import { DatabaseService } from '@core';
import type { CashBreakdown } from '@/types';

describe('useFinance', () => {
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
  });

  it('should return empty closings list initially', () => {
    const { result } = renderHook(() => useFinance(db));
    expect(result.current.closings).toEqual([]);
  });

  it('should load closings from database', () => {
    db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Mañana',
      efectivoContado: 500,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 300,
      otrosMedios: [],
      totalOtrosMedios: 100,
      realDelivery: 0,
      posEfectivo: 500,
      posTarjetas: 300,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 100,
      totalReal: 900,
      totalPos: 900,
      descuadreTotal: 0,
    } as any);

    db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Tarde',
      efectivoContado: 600,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 400,
      otrosMedios: [],
      totalOtrosMedios: 200,
      realDelivery: 0,
      posEfectivo: 600,
      posTarjetas: 400,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 200,
      totalReal: 1200,
      totalPos: 1200,
      descuadreTotal: 0,
    } as any);

    const { result } = renderHook(() => useFinance(db));
    expect(result.current.closings).toHaveLength(2);
  });

  it('should calculate cash total from breakdown', () => {
    const { result } = renderHook(() => useFinance(db));

    const breakdown: CashBreakdown = {
      b500: 2,
      b200: 3,
      b100: 5,
      b50: 10,
      b20: 20,
      b10: 30,
      b5: 40,
      m2: 50,
      m1: 100,
      m050: 200,
      m020: 300,
      m010: 400,
      m005: 500,
      m002: 600,
      m001: 700,
    };

    const total = result.current.calculateCashTotal(breakdown);

    // 1000 + 600 + 500 + 500 + 400 + 300 + 200 + 100 + 100 + 100 + 60 + 40 + 25 + 12 + 7
    expect(total).toBe(3944);
  });

  it('should create new closing', async () => {
    const { result } = renderHook(() => useFinance(db));

    await act(async () => {
      await result.current.createClosing({
        fecha: '2024-03-15',
        turno: 'Mañana',
        desgloseEfectivo: { b100: 5 },
        datafonos: [{ terminal: 'Terminal 1', importe: 300 }],
        otrosMedios: [{ medio: 'Transferencia', importe: 100 }],
        realDelivery: 50,
        posEfectivo: 500,
        posTarjetas: 300,
        posDelivery: 50,
        posTickets: 10,
        posExtras: 40,
      });
    });

    expect(result.current.closings).toHaveLength(1);
    expect(result.current.closings[0].turno).toBe('Mañana');
  });

  it('should update existing closing', async () => {
    const closing = db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Mañana',
      efectivoContado: 500,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 300,
      otrosMedios: [],
      totalOtrosMedios: 100,
      realDelivery: 0,
      posEfectivo: 500,
      posTarjetas: 300,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 100,
      totalReal: 900,
      totalPos: 900,
      descuadreTotal: 0,
    } as any);

    const { result } = renderHook(() => useFinance(db));

    await act(async () => {
      await result.current.updateClosing(closing.id as number, {
        fecha: '2024-01-15',
        turno: 'Mañana',
        desgloseEfectivo: { b100: 6 },
        datafonos: [{ terminal: 'Terminal 1', importe: 400 }],
        otrosMedios: [{ medio: 'Transferencia', importe: 150 }],
        realDelivery: 50,
        posEfectivo: 600,
        posTarjetas: 400,
        posDelivery: 50,
        posTickets: 10,
        posExtras: 90,
      });
    });

    expect(result.current.closings[0].totalReal).toBeGreaterThan(1000);
  });

  it('should delete closing', async () => {
    const closing = db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Mañana',
      efectivoContado: 500,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 300,
      otrosMedios: [],
      totalOtrosMedios: 100,
      realDelivery: 0,
      posEfectivo: 500,
      posTarjetas: 300,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 100,
      totalReal: 900,
      totalPos: 900,
      descuadreTotal: 0,
    } as any);

    const { result } = renderHook(() => useFinance(db));
    expect(result.current.closings).toHaveLength(1);

    await act(async () => {
      await result.current.deleteClosing(closing.id as number);
    });

    expect(result.current.closings).toHaveLength(0);
  });

  it('should filter closings by period', () => {
    db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Mañana',
      efectivoContado: 500,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 300,
      otrosMedios: [],
      totalOtrosMedios: 100,
      realDelivery: 0,
      posEfectivo: 500,
      posTarjetas: 300,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 100,
      totalReal: 900,
      totalPos: 900,
      descuadreTotal: 0,
    } as any);

    db.add('cierres', {
      fecha: '2024-02-15',
      turno: 'Tarde',
      efectivoContado: 600,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 400,
      otrosMedios: [],
      totalOtrosMedios: 200,
      realDelivery: 0,
      posEfectivo: 600,
      posTarjetas: 400,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 200,
      totalReal: 1200,
      totalPos: 1200,
      descuadreTotal: 0,
    } as any);

    const { result } = renderHook(() => useFinance(db));

    act(() => {
      result.current.filterByPeriod('2024-01-01', '2024-01-31');
    });

    expect(result.current.filteredClosings).toHaveLength(1);
    expect(result.current.filteredClosings[0].fecha).toBe('2024-01-15');
  });

  it('should return all closings when no period filter is set', () => {
    db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Mañana',
      efectivoContado: 500,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 300,
      otrosMedios: [],
      totalOtrosMedios: 100,
      realDelivery: 0,
      posEfectivo: 500,
      posTarjetas: 300,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 100,
      totalReal: 900,
      totalPos: 900,
      descuadreTotal: 0,
    } as any);

    db.add('cierres', {
      fecha: '2024-02-15',
      turno: 'Tarde',
      efectivoContado: 600,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 400,
      otrosMedios: [],
      totalOtrosMedios: 200,
      realDelivery: 0,
      posEfectivo: 600,
      posTarjetas: 400,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 200,
      totalReal: 1200,
      totalPos: 1200,
      descuadreTotal: 0,
    } as any);

    const { result } = renderHook(() => useFinance(db));

    act(() => {
      result.current.filterByPeriod('2024-01-01', '2024-01-31');
    });

    expect(result.current.filteredClosings).toHaveLength(1);

    act(() => {
      result.current.clearPeriodFilter();
    });

    expect(result.current.filteredClosings).toHaveLength(2);
  });

  it('should calculate total cash', () => {
    db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Mañana',
      efectivoContado: 500,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 300,
      otrosMedios: [],
      totalOtrosMedios: 100,
      realDelivery: 0,
      posEfectivo: 500,
      posTarjetas: 300,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 100,
      totalReal: 900,
      totalPos: 900,
      descuadreTotal: 0,
    } as any);

    db.add('cierres', {
      fecha: '2024-01-15',
      turno: 'Tarde',
      efectivoContado: 600,
      desgloseEfectivo: {},
      datafonos: [],
      totalDatafonos: 400,
      otrosMedios: [],
      totalOtrosMedios: 200,
      realDelivery: 0,
      posEfectivo: 600,
      posTarjetas: 400,
      posDelivery: 0,
      posTickets: 0,
      posExtras: 200,
      totalReal: 1200,
      totalPos: 1200,
      descuadreTotal: 0,
    } as any);

    const { result } = renderHook(() => useFinance(db));

    expect(result.current.totalCash).toBe(2100);
  });

  it('should handle errors', () => {
    const { result } = renderHook(() => useFinance(db));

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useFinance(db));

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
