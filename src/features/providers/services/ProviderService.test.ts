import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderService } from './ProviderService';
import { DatabaseService } from '@core';
import type { Provider } from '@types';

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

describe('ProviderService', () => {
  let providerService: ProviderService;
  let db: DatabaseService;

  beforeEach(() => {
    localStorage.clear();
    db = new DatabaseService();
    providerService = new ProviderService(db);
  });

  describe('getAll()', () => {
    it('should return empty array when no providers exist', () => {
      const providers = providerService.getAll();
      expect(providers).toEqual([]);
    });

    it('should return all providers', async () => {
      await db.add('proveedores', {
        nombre: 'Provider 1',
        cif: 'A12345678',
        contacto: 'contact1@test.com',
      } as Omit<Provider, 'id'>);

      await db.add('proveedores', {
        nombre: 'Provider 2',
        cif: 'B87654321',
        contacto: 'contact2@test.com',
      } as Omit<Provider, 'id'>);

      const providers = providerService.getAll();
      expect(providers).toHaveLength(2);
      expect(providers[0]).toMatchObject({ nombre: 'Provider 1' });
      expect(providers[1]).toMatchObject({ nombre: 'Provider 2' });
    });
  });

  describe('getById()', () => {
    it('should return provider by id', async () => {
      const added = await db.add('proveedores', {
        nombre: 'Test Provider',
        cif: 'A12345678',
        contacto: 'test@provider.com',
      } as Omit<Provider, 'id'>);

      const provider = providerService.getById(added.id);

      expect(provider).toBeDefined();
      expect(provider?.id).toBe(added.id);
      expect(provider?.nombre).toBe('Test Provider');
    });

    it('should return undefined for non-existent id', () => {
      const provider = providerService.getById(999999);
      expect(provider).toBeUndefined();
    });
  });

  describe('save()', () => {
    const baseProvider = {
      nombre: 'Test Provider',
      cif: 'A12345678',
      direccion: 'Test Street 123',
      ciudad: 'Test City',
      provincia: 'Test Province',
      codigoPostal: '28001',
      telefono: '123456789',
      email: 'test@provider.com',
      contacto: 'John Doe',
      notas: 'Test notes',
    };

    it('should save new provider with generated id', async () => {
      const result = await providerService.save(baseProvider);

      expect(result.success).toBe(true);
      expect(db.proveedores).toHaveLength(1);

      const saved = db.proveedores[0] as Provider;
      expect(saved.nombre).toBe('Test Provider');
      expect(saved.cif).toBe('A12345678');
      expect(saved.id).toBeDefined();
    });

    it('should add fechaAlta when creating new provider', async () => {
      await providerService.save(baseProvider);

      const saved = db.proveedores[0] as Provider;
      expect(saved.fechaAlta).toBeDefined();
      expect(saved.fechaAlta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should add fechaModificacion when creating new provider', async () => {
      await providerService.save(baseProvider);

      const saved = db.proveedores[0] as Provider;
      expect(saved.fechaModificacion).toBeDefined();
      expect(saved.fechaModificacion).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should update existing provider when editId provided', async () => {
      const initial = await db.add('proveedores', {
        ...baseProvider,
        fechaAlta: '2024-01-01',
      } as Omit<Provider, 'id'>);

      const result = await providerService.save(
        {
          ...baseProvider,
          nombre: 'Updated Provider',
          email: 'updated@provider.com',
        },
        initial.id
      );

      expect(result.success).toBe(true);
      expect(db.proveedores).toHaveLength(1);

      const updated = db.proveedores[0] as Provider;
      expect(updated.id).toBe(initial.id);
      expect(updated.nombre).toBe('Updated Provider');
      expect(updated.email).toBe('updated@provider.com');
    });

    it('should preserve fechaAlta when updating', async () => {
      const initial = await db.add('proveedores', {
        ...baseProvider,
        fechaAlta: '2024-01-01',
      } as Omit<Provider, 'id'>);

      await providerService.save(
        {
          ...baseProvider,
          nombre: 'Updated Provider',
        },
        initial.id
      );

      const updated = db.proveedores[0] as Provider;
      expect(updated.fechaAlta).toBe('2024-01-01');
    });

    it('should update fechaModificacion when updating', async () => {
      const initial = await db.add('proveedores', {
        ...baseProvider,
        fechaModificacion: '2024-01-01T00:00:00.000Z',
      } as Omit<Provider, 'id'>);

      const now = new Date();
      await providerService.save(
        {
          ...baseProvider,
          nombre: 'Updated Provider',
        },
        initial.id
      );

      const updated = db.proveedores[0] as Provider;
      expect(updated.fechaModificacion).not.toBe('2024-01-01T00:00:00.000Z');
      expect(new Date(updated.fechaModificacion).getTime()).toBeGreaterThan(
        now.getTime() - 1000
      );
    });

    it('should return provider data on successful save', async () => {
      const result = await providerService.save(baseProvider);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.nombre).toBe('Test Provider');
    });

    it('should validate required nombre field', async () => {
      const result = await providerService.save({
        ...baseProvider,
        nombre: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(db.proveedores).toHaveLength(0);
    });

    it('should validate required cif field', async () => {
      const result = await providerService.save({
        ...baseProvider,
        cif: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(db.proveedores).toHaveLength(0);
    });

    it('should handle partial provider data', async () => {
      const result = await providerService.save({
        nombre: 'Minimal Provider',
        cif: 'A12345678',
        contacto: 'contact@test.com',
      });

      expect(result.success).toBe(true);
      expect(db.proveedores).toHaveLength(1);

      const saved = db.proveedores[0] as Provider;
      expect(saved.nombre).toBe('Minimal Provider');
    });
  });

  describe('delete()', () => {
    it('should delete provider by id', async () => {
      const provider = await db.add('proveedores', {
        nombre: 'Test Provider',
        cif: 'A12345678',
        contacto: 'test@provider.com',
      } as Omit<Provider, 'id'>);

      expect(db.proveedores).toHaveLength(1);

      await providerService.delete(provider.id);

      expect(db.proveedores).toHaveLength(0);
    });

    it('should return true on successful deletion', async () => {
      const provider = await db.add('proveedores', {
        nombre: 'Test Provider',
        cif: 'A12345678',
        contacto: 'test@provider.com',
      } as Omit<Provider, 'id'>);

      const result = await providerService.delete(provider.id);
      expect(result).toBe(true);
    });

    it('should handle deleting non-existent provider gracefully', async () => {
      await providerService.delete(999999);
      // Should not throw
      expect(db.proveedores).toHaveLength(0);
    });
  });

  describe('search()', () => {
    beforeEach(async () => {
      await db.add('proveedores', {
        nombre: 'Acme Corporation',
        cif: 'A12345678',
        contacto: 'john@acme.com',
        ciudad: 'Madrid',
      } as Omit<Provider, 'id'>);

      await db.add('proveedores', {
        nombre: 'Beta Solutions',
        cif: 'B87654321',
        contacto: 'info@beta.com',
        ciudad: 'Barcelona',
      } as Omit<Provider, 'id'>);

      await db.add('proveedores', {
        nombre: 'Gamma Industries',
        cif: 'C11111111',
        contacto: 'contact@gamma.com',
        ciudad: 'Madrid',
      } as Omit<Provider, 'id'>);
    });

    it('should search by nombre (case insensitive)', () => {
      const results = providerService.search('acme');
      expect(results).toHaveLength(1);
      expect(results[0].nombre).toBe('Acme Corporation');
    });

    it('should search by cif', () => {
      const results = providerService.search('B87654321');
      expect(results).toHaveLength(1);
      expect(results[0].nombre).toBe('Beta Solutions');
    });

    it('should search by ciudad', () => {
      const results = providerService.search('madrid');
      expect(results).toHaveLength(2);
    });

    it('should return all providers when query is empty', () => {
      const results = providerService.search('');
      expect(results).toHaveLength(3);
    });

    it('should return empty array when no matches found', () => {
      const results = providerService.search('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should match partial strings', () => {
      const results = providerService.search('Beta');
      expect(results).toHaveLength(1);
      expect(results[0].nombre).toBe('Beta Solutions');
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      await db.add('proveedores', {
        nombre: 'Provider 1',
        cif: 'A12345678',
        contacto: 'p1@test.com',
      } as Omit<Provider, 'id'>);

      await db.add('proveedores', {
        nombre: 'Provider 2',
        cif: 'B87654321',
        contacto: 'p2@test.com',
      } as Omit<Provider, 'id'>);

      await db.add('proveedores', {
        nombre: 'Provider 3',
        cif: 'C11111111',
        contacto: 'p3@test.com',
      } as Omit<Provider, 'id'>);

      // Add invoices for stats
      const p1 = db.proveedores[0];
      const p2 = db.proveedores[1];

      await db.add('facturas', {
        proveedorId: p1.id,
        fecha: '2024-01-15',
        total: 1000,
      } as Omit<Provider, 'id'>);

      await db.add('facturas', {
        proveedorId: p1.id,
        fecha: '2024-01-20',
        total: 500,
      } as Omit<Provider, 'id'>);

      await db.add('facturas', {
        proveedorId: p2.id,
        fecha: '2024-01-18',
        total: 750,
      } as Omit<Provider, 'id'>);
    });

    it('should return total providers count', () => {
      const stats = providerService.getStats();
      expect(stats.total).toBe(3);
    });

    it('should return providers with invoices', () => {
      const stats = providerService.getStats();
      expect(stats.withInvoices).toBe(2);
    });

    it('should return providers without invoices', () => {
      const stats = providerService.getStats();
      expect(stats.withoutInvoices).toBe(1);
    });

    it('should calculate total spent correctly', () => {
      const stats = providerService.getStats();
      expect(stats.totalSpent).toBe(2250); // 1000 + 500 + 750
    });

    it('should handle empty database', () => {
      localStorage.clear();
      db = new DatabaseService();
      providerService = new ProviderService(db);

      const stats = providerService.getStats();
      expect(stats.total).toBe(0);
      expect(stats.withInvoices).toBe(0);
      expect(stats.withoutInvoices).toBe(0);
      expect(stats.totalSpent).toBe(0);
    });
  });
});
