import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderService } from './ProviderService';
import { DatabaseService } from '@core';


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

    it('should return all providers', () => {
      db.add('proveedores', {
        nombre: 'Provider 1',
        cif: 'A12345678',
        contacto: 'contact1@test.com',
      } as any);

      db.add('proveedores', {
        nombre: 'Provider 2',
        cif: 'B87654321',
        contacto: 'contact2@test.com',
      } as any);

      const providers = providerService.getAll();
      expect(providers).toHaveLength(2);
      expect(providers[0]).toMatchObject({ nombre: 'Provider 1' });
      expect(providers[1]).toMatchObject({ nombre: 'Provider 2' });
    });
  });

  describe('getById()', () => {
    it('should return provider by id', () => {
      const added = db.add('proveedores', {
        nombre: 'Test Provider',
        cif: 'A12345678',
        contacto: 'test@provider.com',
      } as any);

      const provider = providerService.getById(added.id);

      expect(provider).toBeDefined();
      expect(provider?.id).toBe(added.id);
      expect((provider as any).nombre).toBe('Test Provider');
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

    it('should save new provider with generated id', () => {
      const result = providerService.save(baseProvider);

      expect(result.success).toBe(true);
      expect(db.proveedores).toHaveLength(1);

      const saved = db.proveedores[0] as any;
      expect(saved.nombre).toBe('Test Provider');
      expect(saved.cif).toBe('A12345678');
      expect(saved.id).toBeDefined();
    });

    it('should add fechaAlta when creating new provider', () => {
      providerService.save(baseProvider);

      const saved = db.proveedores[0] as any;
      expect(saved.fechaAlta).toBeDefined();
      expect(saved.fechaAlta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should add fechaModificacion when creating new provider', () => {
      providerService.save(baseProvider);

      const saved = db.proveedores[0] as any;
      expect(saved.fechaModificacion).toBeDefined();
      expect(saved.fechaModificacion).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should update existing provider when editId provided', () => {
      const initial = db.add('proveedores', {
        ...baseProvider,
        fechaAlta: '2024-01-01',
      } as any);

      const result = providerService.save(
        {
          ...baseProvider,
          nombre: 'Updated Provider',
          email: 'updated@provider.com',
        },
        initial.id
      );

      expect(result.success).toBe(true);
      expect(db.proveedores).toHaveLength(1);

      const updated = db.proveedores[0] as any;
      expect(updated.id).toBe(initial.id);
      expect(updated.nombre).toBe('Updated Provider');
      expect(updated.email).toBe('updated@provider.com');
    });

    it('should preserve fechaAlta when updating', () => {
      const initial = db.add('proveedores', {
        ...baseProvider,
        fechaAlta: '2024-01-01',
      } as any);

      providerService.save(
        {
          ...baseProvider,
          nombre: 'Updated Provider',
        },
        initial.id
      );

      const updated = db.proveedores[0] as any;
      expect(updated.fechaAlta).toBe('2024-01-01');
    });

    it('should update fechaModificacion when updating', () => {
      const initial = db.add('proveedores', {
        ...baseProvider,
        fechaModificacion: '2024-01-01T00:00:00.000Z',
      } as any);

      const now = new Date();
      providerService.save(
        {
          ...baseProvider,
          nombre: 'Updated Provider',
        },
        initial.id
      );

      const updated = db.proveedores[0] as any;
      expect(updated.fechaModificacion).not.toBe('2024-01-01T00:00:00.000Z');
      expect(new Date(updated.fechaModificacion).getTime()).toBeGreaterThan(
        now.getTime() - 1000
      );
    });

    it('should return provider data on successful save', () => {
      const result = providerService.save(baseProvider);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.nombre).toBe('Test Provider');
    });

    it('should validate required nombre field', () => {
      const result = providerService.save({
        ...baseProvider,
        nombre: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(db.proveedores).toHaveLength(0);
    });

    it('should validate required cif field', () => {
      const result = providerService.save({
        ...baseProvider,
        cif: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(db.proveedores).toHaveLength(0);
    });

    it('should handle partial provider data', () => {
      const result = providerService.save({
        nombre: 'Minimal Provider',
        cif: 'A12345678',
        contacto: 'contact@test.com',
      });

      expect(result.success).toBe(true);
      expect(db.proveedores).toHaveLength(1);

      const saved = db.proveedores[0] as any;
      expect(saved.nombre).toBe('Minimal Provider');
    });
  });

  describe('delete()', () => {
    it('should delete provider by id', () => {
      const provider = db.add('proveedores', {
        nombre: 'Test Provider',
        cif: 'A12345678',
        contacto: 'test@provider.com',
      } as any);

      expect(db.proveedores).toHaveLength(1);

      providerService.delete(provider.id);

      expect(db.proveedores).toHaveLength(0);
    });

    it('should return true on successful deletion', () => {
      const provider = db.add('proveedores', {
        nombre: 'Test Provider',
        cif: 'A12345678',
        contacto: 'test@provider.com',
      } as any);

      const result = providerService.delete(provider.id);
      expect(result).toBe(true);
    });

    it('should handle deleting non-existent provider gracefully', () => {
      providerService.delete(999999);
      // Should not throw
      expect(db.proveedores).toHaveLength(0);
    });
  });

  describe('search()', () => {
    beforeEach(() => {
      db.add('proveedores', {
        nombre: 'Acme Corporation',
        cif: 'A12345678',
        contacto: 'john@acme.com',
        ciudad: 'Madrid',
      } as any);

      db.add('proveedores', {
        nombre: 'Beta Solutions',
        cif: 'B87654321',
        contacto: 'info@beta.com',
        ciudad: 'Barcelona',
      } as any);

      db.add('proveedores', {
        nombre: 'Gamma Industries',
        cif: 'C11111111',
        contacto: 'contact@gamma.com',
        ciudad: 'Madrid',
      } as any);
    });

    it('should search by nombre (case insensitive)', () => {
      const results = providerService.search('acme');
      expect(results).toHaveLength(1);
      expect((results[0] as any).nombre).toBe('Acme Corporation');
    });

    it('should search by cif', () => {
      const results = providerService.search('B87654321');
      expect(results).toHaveLength(1);
      expect((results[0] as any).nombre).toBe('Beta Solutions');
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
      expect((results[0] as any).nombre).toBe('Beta Solutions');
    });
  });

  describe('getStats()', () => {
    beforeEach(() => {
      db.add('proveedores', {
        nombre: 'Provider 1',
        cif: 'A12345678',
        contacto: 'p1@test.com',
      } as any);

      db.add('proveedores', {
        nombre: 'Provider 2',
        cif: 'B87654321',
        contacto: 'p2@test.com',
      } as any);

      db.add('proveedores', {
        nombre: 'Provider 3',
        cif: 'C11111111',
        contacto: 'p3@test.com',
      } as any);

      // Add invoices for stats
      const p1 = db.proveedores[0];
      const p2 = db.proveedores[1];

      db.add('facturas', {
        proveedorId: p1.id,
        fecha: '2024-01-15',
        total: 1000,
      } as any);

      db.add('facturas', {
        proveedorId: p1.id,
        fecha: '2024-01-20',
        total: 500,
      } as any);

      db.add('facturas', {
        proveedorId: p2.id,
        fecha: '2024-01-18',
        total: 750,
      } as any);
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
