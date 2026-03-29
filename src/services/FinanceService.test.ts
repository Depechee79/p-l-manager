import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinanceService } from './FinanceService';
import { DatabaseService } from '@core';
import type { Cierre } from '@/types';

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

describe('FinanceService', () => {
  let financeService: FinanceService;
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
    financeService = new FinanceService(db);
  });

  describe('calculateCashTotal()', () => {
    it('should calculate total from bill denominations', () => {
      const breakdown = {
        b500: 2, // 1000
        b200: 1, // 200
        b100: 3, // 300
        b50: 2, // 100
        b20: 5, // 100
        b10: 10, // 100
        b5: 4, // 20
      };

      const total = financeService.calculateCashTotal(breakdown);
      expect(total).toBe(1820);
    });

    it('should calculate total from coin denominations', () => {
      const breakdown = {
        m2: 5, // 10
        m1: 10, // 10
        m050: 4, // 2
        m020: 5, // 1
        m010: 10, // 1
        m005: 4, // 0.20
        m002: 5, // 0.10
        m001: 10, // 0.10
      };

      const total = financeService.calculateCashTotal(breakdown);
      expect(total).toBe(24.4);
    });

    it('should handle mixed bills and coins', () => {
      const breakdown = {
        b50: 1, // 50
        b20: 2, // 40
        b10: 1, // 10
        m2: 2, // 4
        m1: 3, // 3
        m050: 2, // 1
      };

      const total = financeService.calculateCashTotal(breakdown);
      expect(total).toBe(108);
    });

    it('should handle empty breakdown', () => {
      const total = financeService.calculateCashTotal({});
      expect(total).toBe(0);
    });

    it('should ignore invalid or missing values', () => {
      const breakdown = {
        b50: 1, // 50
        b20: null, // 0
        b10: undefined, // 0
        m1: 'abc', // 0
      };

      const total = financeService.calculateCashTotal(breakdown as any);
      expect(total).toBe(50);
    });

    it('should handle decimal quantities', () => {
      const breakdown = {
        b50: 1.5, // 75
        b20: 2.7, // 54
      };

      const total = financeService.calculateCashTotal(breakdown);
      expect(total).toBe(129);
    });
  });

  describe('saveClosing()', () => {
    const baseClosingData = {
      fecha: '2024-01-15',
      turno: 'comida',
      desgloseEfectivo: {
        b50: 2,
        b20: 5,
        b10: 10,
        m2: 5,
        m1: 10,
      },
      datafonos: [
        { terminal: 'Terminal 1', importe: 250 },
        { terminal: 'Terminal 2', importe: 150 },
      ],
      otrosMedios: [{ medio: 'Bizum', importe: 50 }],
      realDelivery: 100,
      posEfectivo: 300,
      posTarjetas: 400,
      posDelivery: 100,
      posTickets: 25,
      posExtras: 50,
    };

    it('should save new closing with all calculations', async () => {
      const result = await financeService.saveClosing(baseClosingData);

      expect(result.success).toBe(true);
      expect(db.cierres).toHaveLength(1);

      const saved = db.cierres[0] as any;
      expect(saved.fecha).toBe('2024-01-15');
      expect(saved.turno).toBe('comida');
      expect(saved.efectivoContado).toBe(320); // 100 + 100 + 100 + 10 + 10
      expect(saved.totalDatafonos).toBe(400);
      expect(saved.totalOtrosMedios).toBe(50);
      expect(saved.realDelivery).toBe(100);
      expect(saved.totalReal).toBe(870); // 320 + 400 + 50 + 100
      expect(saved.totalPos).toBe(850); // 300 + 400 + 100 + 50
      expect(saved.descuadreTotal).toBe(20); // 870 - 850
    });

    it('should calculate cash total correctly', async () => {
      const data = {
        ...baseClosingData,
        desgloseEfectivo: {
          b50: 1,
          b20: 2,
          b10: 3,
        },
      };

      await financeService.saveClosing(data);
      const saved = db.cierres[0] as any;

      expect(saved.efectivoContado).toBe(120); // 50 + 40 + 30
    });

    it('should calculate datafonos total correctly', async () => {
      const data = {
        ...baseClosingData,
        datafonos: [
          { terminal: 'T1', importe: 100 },
          { terminal: 'T2', importe: 200 },
          { terminal: 'T3', importe: 150 },
        ],
      };

      await financeService.saveClosing(data);
      const saved = db.cierres[0] as any;

      expect(saved.datafonos).toHaveLength(3);
      expect(saved.totalDatafonos).toBe(450);
    });

    it('should calculate otros medios total correctly', async () => {
      const data = {
        ...baseClosingData,
        otrosMedios: [
          { medio: 'Bizum', importe: 75 },
          { medio: 'Transfer', importe: 25 },
        ],
      };

      await financeService.saveClosing(data);
      const saved = db.cierres[0] as any;

      expect(saved.otrosMedios).toHaveLength(2);
      expect(saved.totalOtrosMedios).toBe(100);
    });

    it('should calculate descuadre as difference between real and POS', async () => {
      const data = {
        ...baseClosingData,
        desgloseEfectivo: { b50: 10 }, // 500
        datafonos: [{ terminal: 'T1', importe: 300 }],
        otrosMedios: [],
        realDelivery: 200,
        posEfectivo: 400,
        posTarjetas: 300,
        posDelivery: 200,
        posExtras: 50,
      };

      await financeService.saveClosing(data);
      const saved = db.cierres[0] as any;

      expect(saved.totalReal).toBe(1000); // 500 + 300 + 0 + 200
      expect(saved.totalPos).toBe(950); // 400 + 300 + 200 + 50
      expect(saved.descuadreTotal).toBe(50); // 1000 - 950
    });

    it('should handle negative descuadre', async () => {
      const data = {
        ...baseClosingData,
        desgloseEfectivo: { b50: 2 }, // 100
        datafonos: [],
        otrosMedios: [],
        realDelivery: 0,
        posEfectivo: 150,
        posTarjetas: 0,
        posDelivery: 0,
        posExtras: 0,
      };

      await financeService.saveClosing(data);
      const saved = db.cierres[0] as any;

      expect(saved.totalReal).toBe(100);
      expect(saved.totalPos).toBe(150);
      expect(saved.descuadreTotal).toBe(-50);
    });

    it('should handle zero values', async () => {
      const data = {
        ...baseClosingData,
        desgloseEfectivo: {},
        datafonos: [],
        otrosMedios: [],
        realDelivery: 0,
        posEfectivo: 0,
        posTarjetas: 0,
        posDelivery: 0,
        posTickets: 0,
        posExtras: 0,
      };

      await financeService.saveClosing(data);
      const saved = db.cierres[0] as any;

      expect(saved.totalReal).toBe(0);
      expect(saved.totalPos).toBe(0);
      expect(saved.descuadreTotal).toBe(0);
    });

    it('should update existing closing when editId provided', async () => {
      // Create initial closing
      const initial = await financeService.saveClosing(baseClosingData);
      expect(db.cierres).toHaveLength(1);

      // Update it
      const updated = await financeService.saveClosing(
        {
          ...baseClosingData,
          turno: 'cena',
          posEfectivo: 500,
        },
        initial.data?.id as number
      );

      expect(updated.success).toBe(true);
      expect(db.cierres).toHaveLength(1);

      const saved = db.cierres[0] as any;
      expect(saved.turno).toBe('cena');
      expect(saved.posEfectivo).toBe(500);
    });

    it('should preserve desgloseEfectivo in saved closing', async () => {
      const desgloseEfectivo = {
        b500: 1,
        b200: 2,
        b100: 3,
        b50: 4,
        m2: 10,
        m1: 20,
      };

      await financeService.saveClosing({ ...baseClosingData, desgloseEfectivo: desgloseEfectivo });
      const saved = db.cierres[0] as any;

      expect(saved.desgloseEfectivo).toEqual(desgloseEfectivo);
    });

    it('should return error if fecha is missing', async () => {
      const data = { ...baseClosingData, fecha: '' };
      const result = await financeService.saveClosing(data);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(db.cierres).toHaveLength(0);
    });
  });

  describe('getClosings()', () => {
    beforeEach(async () => {
      // Add test closings with different dates
      // Using today's date for 'mes' period to work
      const today = new Date();
      const thisMonth = today.toISOString().slice(0, 7); // YYYY-MM
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15)
        .toISOString()
        .slice(0, 10);

      await db.add('cierres', {
        fecha: `${thisMonth}-15`,
        turno: 'comida',
        totalReal: 1000,
        totalPos: 950,
        descuadreTotal: 50,
      } as any);

      await db.add('cierres', {
        fecha: `${thisMonth}-16`,
        turno: 'cena',
        totalReal: 1200,
        totalPos: 1200,
        descuadreTotal: 0,
      } as any);

      await db.add('cierres', {
        fecha: lastMonth,
        turno: 'comida',
        totalReal: 800,
        totalPos: 850,
        descuadreTotal: -50,
      } as any);
    });

    it('should get closings for current month', () => {
      const closings = financeService.getClosings('mes');

      expect(closings.length).toBeGreaterThanOrEqual(2);
    });

    it('should get all closings for "todo" period', () => {
      const closings = financeService.getClosings('todo');

      expect(closings.length).toBeGreaterThanOrEqual(3);
    });

    it('should get closings for current year', () => {
      const closings = financeService.getClosings('anio');

      expect(closings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getClosing()', () => {
    let closingId: number;

    beforeEach(async () => {
      const closing = await db.add('cierres', {
        fecha: '2024-01-15',
        turno: 'comida',
        totalReal: 1000,
        totalPos: 950,
        descuadreTotal: 50,
      } as any);
      closingId = closing.id as number;
    });

    it('should get closing by id', () => {
      const closing = financeService.getClosing(closingId);

      expect(closing).toBeDefined();
      expect(closing?.id).toBe(closingId);
      expect((closing as any).fecha).toBe('2024-01-15');
    });

    it('should return undefined for non-existent id', () => {
      const closing = financeService.getClosing(999999);
      expect(closing).toBeUndefined();
    });
  });

  describe('deleteClosing()', () => {
    let closingId: number;

    beforeEach(async () => {
      const closing = await db.add('cierres', {
        fecha: '2024-01-15',
        turno: 'comida',
        totalReal: 1000,
        totalPos: 950,
        descuadreTotal: 50,
      } as any);
      closingId = closing.id as number;
    });

    it('should delete closing by id', async () => {
      expect(db.cierres).toHaveLength(1);

      financeService.deleteClosing(closingId);
      // deleteClosing fires async db.delete without await, flush microtasks
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(db.cierres).toHaveLength(0);
    });

    it('should return true on successful deletion', () => {
      const result = financeService.deleteClosing(closingId);
      expect(result).toBe(true);
    });

    it('should handle deleting non-existent closing gracefully', async () => {
      // This will attempt to delete but should not throw
      financeService.deleteClosing(999999);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(db.cierres).toHaveLength(1); // Original still there
    });
  });
});
