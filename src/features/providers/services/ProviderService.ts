import type { Provider, Invoice } from '@/types';
import { DatabaseService } from '@core';
import { logger } from '@core/services/LoggerService';

/**
 * Provider data for saving
 */
export interface ProviderData {
  nombre: string;
  cif: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  telefono?: string;
  email?: string;
  contacto: string;
  notas?: string;
}

/**
 * Result of save operation
 */
export interface SaveProviderResult {
  success: boolean;
  data?: Provider;
  error?: string;
}

/**
 * Provider statistics
 */
export interface ProviderStats {
  total: number;
  withInvoices: number;
  withoutInvoices: number;
  totalSpent: number;
}

/**
 * Provider Service
 * Handles provider CRUD operations and related queries
 */
export class ProviderService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Get all providers
   */
  getAll(): Provider[] {
    return (this.db.proveedores as Provider[]) || [];
  }

  /**
   * Get provider by ID
   */
  getById(id: number | string): Provider | undefined {
    return this.db.proveedores.find((p) => p.id === id) as Provider | undefined;
  }

  /**
   * Save provider (create or update)
   */
  async save(provider: ProviderData, editId?: number | string): Promise<SaveProviderResult> {
    // Validate required fields
    if (!provider.nombre || provider.nombre.trim() === '') {
      return {
        success: false,
        error: 'Nombre is required',
      };
    }

    if (!provider.cif || provider.cif.trim() === '') {
      return {
        success: false,
        error: 'CIF is required',
      };
    }

    try {
      const data: Partial<Provider> = {
        ...provider,
        fechaModificacion: new Date().toISOString(),
      };

      let saved: Provider;

      if (editId) {
        // Update existing provider
        const existing = this.getById(editId);
        if (existing) {
          data.fechaAlta = existing.fechaAlta;
        }
        saved = await this.db.update('proveedores', editId, data) as Provider;
      } else {
        // Create new provider
        data.fechaAlta = new Date().toISOString().split('T')[0];
        // Type assertion needed because ProviderData is partial match for Provider, but DatabaseService validates
        saved = await this.db.add('proveedores', data as Omit<Provider, 'id'>);
      }

      return {
        success: true,
        data: saved,
      };
    } catch (error: unknown) {
      logger.error('Error saving provider:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Delete provider by ID
   */
  async delete(id: number | string): Promise<boolean> {
    try {
      await this.db.delete('proveedores', id);
      return true;
    } catch (error: unknown) {
      logger.error('Error deleting provider:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Search providers by name, CIF, or city
   */
  search(query: string): Provider[] {
    if (!query || query.trim() === '') {
      return this.getAll();
    }

    const searchTerm = query.toLowerCase();
    const providers = this.getAll();

    return providers.filter((p) => {
      const nombre = p.nombre?.toLowerCase() || '';
      const cif = p.cif?.toLowerCase() || '';
      const ciudad = p.ciudad?.toLowerCase() || '';

      return (
        nombre.includes(searchTerm) ||
        cif.includes(searchTerm) ||
        ciudad.includes(searchTerm)
      );
    });
  }

  /**
   * Get provider statistics
   */
  getStats(): ProviderStats {
    const providers = this.getAll();
    const invoices = this.db.facturas as Invoice[];

    // Count providers with at least one invoice
    const providerIdsWithInvoices = new Set(
      invoices.map((inv) => inv.proveedorId)
    );

    const withInvoices = providers.filter((p) =>
      providerIdsWithInvoices.has(p.id)
    ).length;

    // Calculate total spent
    const totalSpent = invoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0
    );

    return {
      total: providers.length,
      withInvoices,
      withoutInvoices: providers.length - withInvoices,
      totalSpent,
    };
  }
}
