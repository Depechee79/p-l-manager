import type {
  BaseEntity,
  CollectionName,
  Period,
  Cierre,
  Invoice,
  Provider,
  Product,
  InventoryItem,
  Escandallo,
  DeliveryRecord,
  AppUser,
  Role,
  Company,
  Restaurant,
  Transfer,
  Worker,
  Absence,
  VacationRequest,
  GastoFijo
} from '@types';

import { FirestoreService } from './FirestoreService';
import { DataIntegrityService } from './DataIntegrityService';
import { logger } from './LoggerService';
import { ToastService } from './ToastService';

type Collections = {
  [K in CollectionName]: BaseEntity[];
};

/**
 * Database Service
 * Architecture: Cloud-First with Optimistic UI
 * All write operations go to Firebase FIRST, then update local state
 * This ensures data integrity and provides clear feedback to users
 * 
 * RELATIONSHIPS MAP:
 * ==================
 * 
 * Product.proveedorId -> Provider.id (REQUIRED)
 *   - Product must reference an existing Provider
 *   - Cannot delete Provider if Products reference it
 * 
 * Invoice.proveedorId -> Provider.id (REQUIRED)
 *   - Invoice must reference an existing Provider
 *   - Cannot delete Provider if Invoices reference it
 * 
 * InvoiceProduct.productoId -> Product.id (OPTIONAL)
 *   - May reference Product for price/stock updates
 *   - If provided, must reference existing Product
 * 
 * InventoryProductCount.productoId -> Product.id (REQUIRED)
 *   - Must reference an existing Product
 *   - Cannot delete Product if referenced in active InventoryItem
 * 
 * Escandallo.ingredientes[].productoId -> Product.id (REQUIRED)
 *   - Each ingredient must reference an existing Product
 *   - Cannot delete Product if referenced in Escandallo
 * 
 * AppUser.rolId -> Role.id (REQUIRED)
 *   - User must reference an existing Role
 *   - Cannot delete Role if Users reference it
 * 
 * Product.proveedor -> Provider.nombre (DENORMALIZED)
 *   - Kept in sync with Provider.nombre for performance
 *   - Should be updated when Provider.nombre changes
 */
export class DatabaseService implements Collections {
  // Collections
  public cierres: Cierre[] = [];
  public facturas: Invoice[] = [];
  public albaranes: Invoice[] = [];
  public proveedores: Provider[] = [];
  public productos: Product[] = [];
  public escandallos: Escandallo[] = [];
  public inventarios: InventoryItem[] = [];
  public delivery: DeliveryRecord[] = [];
  public usuarios: AppUser[] = [];
  public roles: Role[] = [];
  // Multi-restaurant collections
  public companies: Company[] = [];
  public restaurants: Restaurant[] = [];
  public transfers: Transfer[] = [];
  public workers: Worker[] = [];
  // Additional collections
  public mermas: BaseEntity[] = [];
  public orders: BaseEntity[] = [];
  public pnl_adjustments: BaseEntity[] = [];
  public absences: Absence[] = [];
  public vacation_requests: VacationRequest[] = [];
  public gastosFijos: GastoFijo[] = [];
  public nominas: BaseEntity[] = [];
  public fichajes: BaseEntity[] = [];

  // Cloud service
  public cloudService: FirestoreService;

  // Data integrity service
  private integrityService: DataIntegrityService;

  // Counter to ensure unique IDs when adding items rapidly
  private idCounter: number = 0;

  constructor() {
    // Initialize cloud service
    this.cloudService = new FirestoreService();

    // Initialize collections as empty - ONLY Firebase data will be loaded
    this.cierres = [];
    this.facturas = [];
    this.companies = [];
    this.restaurants = [];
    this.transfers = [];
    this.workers = [];
    this.mermas = [];
    this.orders = [];
    this.pnl_adjustments = [];
    this.absences = [];
    this.vacation_requests = [];
    this.fichajes = [];
    this.albaranes = [];
    this.proveedores = [];
    this.productos = [];
    this.escandallos = [];
    this.inventarios = [];
    this.delivery = [];
    this.usuarios = [];
    this.roles = [];

    // Initialize integrity service
    this.integrityService = new DataIntegrityService(this);

    // Clear any old localStorage data to ensure only Firebase data is used
    const collections: CollectionName[] = [
      'cierres', 'facturas', 'albaranes', 'proveedores',
      'productos', 'escandallos', 'inventarios', 'delivery',
      'usuarios', 'roles', 'companies', 'restaurants', 'transfers', 'workers',
      'mermas', 'orders', 'pnl_adjustments', 'absences', 'vacation_requests', 'fichajes'
    ];

    collections.forEach(col => {
      localStorage.removeItem(`db_${col}`);
    });

    // STARTUP: Only sync critical configuration data
    // Heavy data (invoices, closings) must be loaded on-demand
    this.syncCriticalData();
  }

  /**
   * Track which collections have been loaded from cloud
   */
  private loadedCollections: Set<CollectionName> = new Set();

  /**
   * Ensure a collection is loaded from cloud before accessing
   * Implements "On-Demand" loading pattern (R-14)
   */
  async ensureLoaded(collection: CollectionName): Promise<void> {
    if (this.loadedCollections.has(collection)) {
      return;
    }

    await this.syncCollection(collection);
  }

  /**
   * Sync specific critical collections needed for app startup
   */
  private async syncCriticalData(): Promise<void> {
    const criticalCollections: CollectionName[] = [
      'companies',
      'restaurants',
      'roles',
      'usuarios',
      'gastosFijos'
    ];

    logger.info('🚀 [STARTUP] Loading critical configuration...');

    await Promise.all(
      criticalCollections.map(col => this.syncCollection(col))
    );

    logger.info('✅ [STARTUP] Critical configuration loaded');
  }

  /**
   * Sync a single collection from cloud
   */
  async syncCollection(col: CollectionName): Promise<void> {
    try {
      if (this.loadedCollections.has(col)) {
        // Already loading or loaded? 
        // For now, simpler: allow re-sync if called explicitly
      }

      const response = await this.cloudService.getAll<BaseEntity>(col);
      if (response.success && response.data) {
        // Convert IDs back to numbers if they are numeric strings
        const cloudData = response.data.map(item => ({
          ...item,
          id: !isNaN(Number(item.id)) ? Number(item.id) : item.id
        }));

        const localData = this.getCollection(col);
        const mergedData = this.mergeLocalAndCloud(localData, cloudData, col);

        this.setCollection(col, mergedData);
        this.save(col, mergedData);

        logger.info(`✅ [LOAD] ${col}: ${mergedData.length} items loaded`);

        this.loadedCollections.add(col);
      } else if (response.error) {
        logger.warn(`⚠️ [LOAD] ${col}: ${response.error}`);
      }
    } catch (error) {
      logger.error(`❌ [LOAD] ${col} failed:`, error);
    }
  }

  /**
   * Get relationships map for validation
   * Returns map of collection -> field -> target collection
   */
  getRelationshipsMap(): Record<string, Record<string, { target: CollectionName; required: boolean }>> {
    return {
      productos: {
        proveedorId: { target: 'proveedores', required: true },
      },
      facturas: {
        proveedorId: { target: 'proveedores', required: true },
      },
      albaranes: {
        proveedorId: { target: 'proveedores', required: true },
      },
      inventarios: {
        // productos array contains productoId references
      },
      escandallos: {
        // ingredientes array contains productoId references
      },
      usuarios: {
        rolId: { target: 'roles', required: true },
      },
    };
  }

  /**
   * Get reverse relationships (which collections reference a given collection)
   */
  getReverseRelationships(targetCollection: CollectionName): Array<{ collection: CollectionName; field: string; required: boolean }> {
    const relationships: Array<{ collection: CollectionName; field: string; required: boolean }> = [];
    const map = this.getRelationshipsMap();

    for (const [collection, fields] of Object.entries(map)) {
      for (const [field, config] of Object.entries(fields)) {
        if (config.target === targetCollection) {
          relationships.push({
            collection: collection as CollectionName,
            field,
            required: config.required,
          });
        }
      }
    }

    // Special cases for nested references
    if (targetCollection === 'productos') {
      relationships.push(
        { collection: 'inventarios', field: 'productos[].productoId', required: true },
        { collection: 'escandallos', field: 'ingredientes[].productoId', required: true },
        { collection: 'facturas', field: 'productos[].productoId', required: false },
        { collection: 'albaranes', field: 'productos[].productoId', required: false }
      );
    }

    return relationships;
  }


  /**
   * Save data to localStorage
   */
  private save(key: string, data: BaseEntity[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Get collection by name
   */
  /**
   * Get collection by name
   */
  private getCollection(name: CollectionName): BaseEntity[] {
    switch (name) {
      case 'cierres': return this.cierres;
      case 'facturas': return this.facturas;
      case 'albaranes': return this.albaranes;
      case 'proveedores': return this.proveedores;
      case 'productos': return this.productos;
      case 'escandallos': return this.escandallos;
      case 'inventarios': return this.inventarios;
      case 'delivery': return this.delivery;
      case 'usuarios': return this.usuarios;
      case 'roles': return this.roles;
      case 'companies': return this.companies;
      case 'restaurants': return this.restaurants;
      case 'transfers': return this.transfers;
      case 'workers': return this.workers;
      case 'mermas': return this.mermas;
      case 'orders': return this.orders;
      case 'pnl_adjustments': return this.pnl_adjustments;
      case 'absences': return this.absences;
      case 'vacation_requests': return this.vacation_requests;
      case 'gastosFijos': return this.gastosFijos;
      case 'nominas': return this.nominas;
      case 'fichajes': return this.fichajes;
      default: return [];
    }
  }

  /**
   * Set collection by name
   */
  private setCollection(name: CollectionName, data: BaseEntity[]): void {
    switch (name) {
      case 'cierres': this.cierres = data as any; break;
      case 'facturas': this.facturas = data as any; break;
      case 'albaranes': this.albaranes = data as any; break;
      case 'proveedores': this.proveedores = data as any; break;
      case 'productos': this.productos = data as any; break;
      case 'escandallos': this.escandallos = data as any; break;
      case 'inventarios': this.inventarios = data as any; break;
      case 'delivery': this.delivery = data as any; break;
      case 'usuarios': this.usuarios = data as any; break;
      case 'roles': this.roles = data as any; break;
      case 'companies': this.companies = data as any; break;
      case 'restaurants': this.restaurants = data as any; break;
      case 'transfers': this.transfers = data as any; break;
      case 'workers': this.workers = data as any; break;
      case 'mermas': this.mermas = data as any; break;
      case 'orders': this.orders = data as any; break;
      case 'pnl_adjustments': this.pnl_adjustments = data as any; break;
      case 'absences': this.absences = data as any; break;
      case 'vacation_requests': this.vacation_requests = data as any; break;
      case 'gastosFijos': this.gastosFijos = data as any; break;
      case 'nominas': this.nominas = data as any; break;
      case 'fichajes': this.fichajes = data as any; break;
    }
  }

  /**
   * Generate unique ID
   * Uses timestamp + counter to avoid collisions on rapid additions
   */
  private generateId(): number {
    const timestamp = Date.now();
    this.idCounter = (this.idCounter + 1) % 1000;
    return timestamp * 1000 + this.idCounter;
  }

  /**
   * Add item to collection (CLOUD-FIRST)
   * Sends to Firebase FIRST, then updates local state
   * Returns Promise with the added item
   * Throws error if validation or Firebase fails
   */
  async add<T extends BaseEntity>(
    collection: CollectionName,
    item: Omit<T, 'id'>,
    options: { silent?: boolean } = {}
  ): Promise<T> {
    const toastId = options.silent ? null : ToastService.saving('Guardando...');

    try {
      // Validate foreign keys before adding
      const relationships = this.getRelationshipsMap();
      const collectionRelations = relationships[collection];

      if (collectionRelations) {
        for (const [field, config] of Object.entries(collectionRelations)) {
          const value = (item as any)[field];
          const validation = this.integrityService.validateForeignKey(
            collection,
            field,
            value,
            config.required
          );

          if (!validation.valid) {
            throw new Error(
              `Validation failed for ${collection}.${field}: ${validation.errors.join(', ')}`
            );
          }
        }
      }

      // Validate nested references
      this.validateNestedReferences(collection, item);

      const newItem = {
        ...item,
        id: this.generateId(),
        _synced: true,
        createdAt: new Date().toISOString(),
      } as T;

      const firestoreId = String(newItem.id);

      // CLOUD-FIRST: Send to Firebase first
      const result = await this.cloudService.add(collection, newItem, firestoreId);

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar en Firebase');
      }

      // Firebase success: update local state
      const currentCollection = this.getCollection(collection);
      currentCollection.push(newItem);
      this.save(collection, currentCollection);

      logger.info(`✅ [ADD] ${collection}/${newItem.id} → Firebase OK`);

      if (toastId) {
        ToastService.dismiss(toastId);
        ToastService.success('Guardado correctamente');
      }

      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error(`❌ [ADD] ${collection} failed:`, errorMessage);

      if (toastId) {
        ToastService.dismiss(toastId);
        ToastService.error(`Error: ${errorMessage}`);
      }

      throw error;
    }
  }

  /**
   * Add item synchronously (legacy support)
   * @deprecated Use add() instead. This method saves locally first.
   */
  addSync<T extends BaseEntity>(
    collection: CollectionName,
    item: Omit<T, 'id'>
  ): T {
    // Validate foreign keys before adding
    const relationships = this.getRelationshipsMap();
    const collectionRelations = relationships[collection];

    if (collectionRelations) {
      for (const [field, config] of Object.entries(collectionRelations)) {
        const value = (item as any)[field];
        const validation = this.integrityService.validateForeignKey(
          collection,
          field,
          value,
          config.required
        );

        if (!validation.valid) {
          throw new Error(
            `Validation failed for ${collection}.${field}: ${validation.errors.join(', ')}`
          );
        }
      }
    }

    // Validate nested references
    this.validateNestedReferences(collection, item);

    const newItem = {
      ...item,
      id: this.generateId(),
      _synced: false,
      createdAt: new Date().toISOString(),
    } as T;

    const currentCollection = this.getCollection(collection);
    currentCollection.push(newItem);
    this.save(collection, currentCollection);

    // Async cloud sync (background)
    this._syncToCloud(collection, 'ADD', newItem);

    return newItem;
  }

  /**
   * Validate nested references in item (arrays with foreign keys)
   */
  private validateNestedReferences(collection: CollectionName, item: any): void {
    if (collection === 'inventarios' && item.productos && Array.isArray(item.productos)) {
      const productos = this.productos as BaseEntity[];
      const productoIds = new Set(productos.map(p => String(p.id)));

      for (const producto of item.productos) {
        if (producto.productoId && !productoIds.has(String(producto.productoId))) {
          throw new Error(
            `Validation failed: productoId ${producto.productoId} in inventarios.productos does not exist`
          );
        }
      }
    }

    if (collection === 'escandallos' && item.ingredientes && Array.isArray(item.ingredientes)) {
      const productos = this.productos as BaseEntity[];
      const productoIds = new Set(productos.map(p => String(p.id)));

      for (const ingrediente of item.ingredientes) {
        if (ingrediente.productoId && !productoIds.has(String(ingrediente.productoId))) {
          throw new Error(
            `Validation failed: productoId ${ingrediente.productoId} in escandallos.ingredientes does not exist`
          );
        }
      }
    }

    if ((collection === 'facturas' || collection === 'albaranes') && item.productos && Array.isArray(item.productos)) {
      const productos = this.productos as BaseEntity[];
      const productoIds = new Set(productos.map(p => String(p.id)));

      for (const producto of item.productos) {
        // productoId is optional in invoices, but if provided must be valid
        if (producto.productoId && !productoIds.has(String(producto.productoId))) {
          logger.warn(
            `Warning: productoId ${producto.productoId} in ${collection}.productos does not exist (optional field)`
          );
        }
      }
    }
  }

  /**
   * Update item in collection (CLOUD-FIRST)
   * Sends to Firebase FIRST, then updates local state
   * Returns Promise with updated item or null if not found
   * Throws error if validation or Firebase fails
   */
  async update<T extends BaseEntity>(
    collection: CollectionName,
    id: number | string,
    updatedItem: Partial<T>,
    options: { silent?: boolean } = {}
  ): Promise<T | null> {
    const currentCollection = this.getCollection(collection);
    const index = currentCollection.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const toastId = options.silent ? null : ToastService.saving('Actualizando...');

    try {
      const oldItem = currentCollection[index];
      const updated = {
        ...oldItem,
        ...updatedItem,
        id, // Preserve id
        _synced: true,
        updatedAt: new Date().toISOString(),
      } as T;

      // Validate foreign keys if they are being updated
      const relationships = this.getRelationshipsMap();
      const collectionRelations = relationships[collection];

      if (collectionRelations) {
        for (const [field, config] of Object.entries(collectionRelations)) {
          // Only validate if the field is being updated
          if (field in updatedItem) {
            const value = (updated as any)[field];
            const validation = this.integrityService.validateForeignKey(
              collection,
              field,
              value,
              config.required
            );

            if (!validation.valid) {
              throw new Error(
                `Validation failed for ${collection}.${field}: ${validation.errors.join(', ')}`
              );
            }
          }
        }
      }

      // Validate nested references if they are being updated
      if ((updatedItem as any).productos || (updatedItem as any).ingredientes) {
        this.validateNestedReferences(collection, updated);
      }

      const firestoreId = String(id);

      // CLOUD-FIRST: Send to Firebase first
      const result = await this.cloudService.update(collection, firestoreId, updated);

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar en Firebase');
      }

      // Firebase success: update local state
      currentCollection[index] = updated;
      this.save(collection, currentCollection);

      logger.info(`✅ [UPDATE] ${collection}/${id} → Firebase OK`);

      if (toastId) {
        ToastService.dismiss(toastId);
        ToastService.success('Actualizado correctamente');
      }

      return updated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error(`❌ [UPDATE] ${collection}/${id} failed:`, errorMessage);

      if (toastId) {
        ToastService.dismiss(toastId);
        ToastService.error(`Error: ${errorMessage}`);
      }

      throw error;
    }
  }

  /**
   * Update item synchronously (legacy support)
   * @deprecated Use update() instead. This method saves locally first.
   */
  updateSync<T extends BaseEntity>(
    collection: CollectionName,
    id: number | string,
    updatedItem: Partial<T>
  ): T | null {
    const currentCollection = this.getCollection(collection);
    const index = currentCollection.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const oldItem = currentCollection[index];
    const updated = {
      ...oldItem,
      ...updatedItem,
      id, // Preserve id
      _synced: false,
      updatedAt: new Date().toISOString(),
    } as T;

    // Validate foreign keys if they are being updated
    const relationships = this.getRelationshipsMap();
    const collectionRelations = relationships[collection];

    if (collectionRelations) {
      for (const [field, config] of Object.entries(collectionRelations)) {
        if (field in updatedItem) {
          const value = (updated as any)[field];
          const validation = this.integrityService.validateForeignKey(
            collection,
            field,
            value,
            config.required
          );

          if (!validation.valid) {
            throw new Error(
              `Validation failed for ${collection}.${field}: ${validation.errors.join(', ')}`
            );
          }
        }
      }
    }

    if ((updatedItem as any).productos || (updatedItem as any).ingredientes) {
      this.validateNestedReferences(collection, updated);
    }

    currentCollection[index] = updated;
    this.save(collection, currentCollection);

    // Async cloud sync (background)
    this._syncToCloud(collection, 'UPDATE', updated);

    return updated;
  }

  /**
   * Delete item from collection (CLOUD-FIRST)
   * Sends to Firebase FIRST, then updates local state
   * Throws error if there are active references or Firebase fails
   */
  async delete(
    collection: CollectionName,
    id: number | string,
    options: { silent?: boolean } = {}
  ): Promise<void> {
    // Check if item can be safely deleted
    const canDelete = this.integrityService.canDelete(collection, id);

    if (!canDelete.canDelete) {
      const blockingInfo = canDelete.blockingReferences
        .map(ref => `${ref.collection}[${ref.id}].${ref.field}`)
        .join(', ');
      throw new Error(
        `Cannot delete ${collection}[${id}]: referenced by ${blockingInfo}. ` +
        `Please remove or update these references first.`
      );
    }

    const toastId = options.silent ? null : ToastService.saving('Eliminando...');

    try {
      const firestoreId = String(id);

      // CLOUD-FIRST: Send to Firebase first
      const result = await this.cloudService.delete(collection, firestoreId);

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar en Firebase');
      }

      // Firebase success: update local state
      const currentCollection = this.getCollection(collection);
      const filtered = currentCollection.filter((item) => item.id !== id);
      this.setCollection(collection, filtered);
      this.save(collection, filtered);

      logger.info(`✅ [DELETE] ${collection}/${id} → Firebase OK`);

      if (toastId) {
        ToastService.dismiss(toastId);
        ToastService.success('Eliminado correctamente');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error(`❌ [DELETE] ${collection}/${id} failed:`, errorMessage);

      if (toastId) {
        ToastService.dismiss(toastId);
        ToastService.error(`Error: ${errorMessage}`);
      }

      throw error;
    }
  }

  /**
   * Delete item synchronously (legacy support)
   * @deprecated Use delete() instead. This method deletes locally first.
   */
  deleteSync(collection: CollectionName, id: number | string): void {
    const canDelete = this.integrityService.canDelete(collection, id);

    if (!canDelete.canDelete) {
      const blockingInfo = canDelete.blockingReferences
        .map(ref => `${ref.collection}[${ref.id}].${ref.field}`)
        .join(', ');
      throw new Error(
        `Cannot delete ${collection}[${id}]: referenced by ${blockingInfo}. ` +
        `Please remove or update these references first.`
      );
    }

    const currentCollection = this.getCollection(collection);
    const filtered = currentCollection.filter((item) => item.id !== id);
    this.setCollection(collection, filtered);
    this.save(collection, filtered);

    // Async cloud sync (background)
    this._syncToCloud(collection, 'DELETE', { id });
  }

  /**
   * Get items by period filter
   */
  getByPeriod(collection: CollectionName, period: Period): BaseEntity[] {
    const now = new Date();
    const items = this.getCollection(collection);

    return items.filter((item: any) => {
      if (!item.fecha) return true;

      const itemDate = new Date(item.fecha);
      if (isNaN(itemDate.getTime())) return false;

      switch (period) {
        case 'dia':
          return itemDate.toDateString() === now.toDateString();

        case 'semana': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        }

        case 'mes':
          return (
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear()
          );

        case 'anio':
          return itemDate.getFullYear() === now.getFullYear();

        case 'todo':
        default:
          return true;
      }
    });
  }

  /**
   * Sync to cloud (async)
   * Waits for Firebase confirmation before marking as synced
   * Retries on failure up to 3 times
   */
  private async _syncToCloud(
    collectionName: CollectionName,
    action: 'ADD' | 'UPDATE' | 'DELETE',
    data: any,
    retryCount: number = 0
  ): Promise<void> {
    const maxRetries = 3;
    const firestoreId = String(data.id);

    try {
      let result;

      if (action === 'ADD') {
        result = await this.cloudService.add(collectionName, data, firestoreId);
        if (!result.success) {
          throw new Error(result.error || 'Add operation failed');
        }
      } else if (action === 'UPDATE') {
        result = await this.cloudService.update(collectionName, firestoreId, data);
        if (!result.success) {
          throw new Error(result.error || 'Update operation failed');
        }
      } else if (action === 'DELETE') {
        result = await this.cloudService.delete(collectionName, firestoreId);
        if (!result.success) {
          throw new Error(result.error || 'Delete operation failed');
        }
      }

      // Mark as synced only after successful Firebase confirmation
      if (action !== 'DELETE') {
        const currentCollection = this.getCollection(collectionName);
        const index = currentCollection.findIndex((i) => i.id === data.id);
        if (index !== -1) {
          currentCollection[index]._synced = true;
          currentCollection[index].updatedAt = new Date().toISOString();
          this.save(collectionName, currentCollection);
          logger.info(`✅ [SYNC] ${action} ${collectionName}/${data.id} → Firebase`);
        }
      } else {
        logger.info(`✅ [SYNC] ${action} ${collectionName}/${firestoreId} → Firebase`);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        logger.warn(
          `⚠️ [SYNC] ${action} ${collectionName}/${firestoreId} failed (attempt ${retryCount + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`,
          errorMessage
        );

        await new Promise(resolve => setTimeout(resolve, delay));
        return this._syncToCloud(collectionName, action, data, retryCount + 1);
      } else {
        // Max retries reached, mark as not synced and log error
        logger.error(
          `❌ [SYNC] ${action} ${collectionName}/${firestoreId} failed after ${maxRetries + 1} attempts:`,
          errorMessage
        );

        // Keep _synced as false so we can retry later
        if (action !== 'DELETE') {
          const currentCollection = this.getCollection(collectionName);
          const index = currentCollection.findIndex((i) => i.id === data.id);
          if (index !== -1) {
            currentCollection[index]._synced = false;
            this.save(collectionName, currentCollection);
          }
        }
      }
    }
  }

  /**
   * DEPRECATED: Sync from cloud (download all data)
   * @deprecated Use ensureLoaded(collection) instead. Violates R-14.
   */
  async syncFromCloud(): Promise<void> {
    logger.warn('⚠️ [DEPRECATED] syncFromCloud called. This triggers a full DB download. Use ensureLoaded() instead.');

    const collections: CollectionName[] = [
      'cierres', 'facturas', 'albaranes', 'proveedores',
      'productos', 'escandallos', 'inventarios', 'delivery',
      'transfers', 'workers', 'mermas', 'orders'
    ];

    for (const col of collections) {
      await this.syncCollection(col);
    }

    // Validate integrity after sync
    this.validateIntegrity();
  }

  /**
   * Validate integrity of all loaded data
   */
  validateIntegrity(): void {
    logger.info('🔍 [INTEGRITY] Validating loaded data...');
    const collections = Array.from(this.loadedCollections);
    for (const col of collections) {
      const data = this.getCollection(col);
      this.validateMergedData(data, col);
    }
  }

  /**
   * Merge local and cloud data, resolving conflicts
   * Firebase version wins if more recent, otherwise keep local if not synced
   */
  private mergeLocalAndCloud(
    localData: BaseEntity[],
    cloudData: BaseEntity[],
    collection: CollectionName
  ): BaseEntity[] {
    const merged: BaseEntity[] = [];
    const localMap = new Map<string | number, BaseEntity>();
    const cloudMap = new Map<string | number, BaseEntity>();

    // Index local data
    for (const item of localData) {
      localMap.set(item.id, item);
    }

    // Index cloud data
    for (const item of cloudData) {
      cloudMap.set(item.id, item);
    }

    // Process all unique IDs
    const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);

    for (const id of allIds) {
      const local = localMap.get(id);
      const cloud = cloudMap.get(id);

      if (!local && cloud) {
        // Only in cloud: add it
        merged.push({ ...cloud, _synced: true });
      } else if (local && !cloud) {
        // Only in local: keep if not synced, otherwise it might have been deleted
        if (local._synced === false) {
          // Keep local unsynced data
          merged.push(local);
        } else {
          // Was synced but not in cloud - might have been deleted, keep for now
          merged.push(local);
        }
      } else if (local && cloud) {
        // In both: resolve conflict
        const localUpdated = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        const cloudUpdated = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;

        if (cloudUpdated > localUpdated) {
          // Cloud is more recent: use cloud version
          merged.push({ ...cloud, _synced: true });
          logger.debug(`🔄 [SYNC] Conflict resolved: ${collection}[${id}] - using cloud version (newer)`);
        } else if (local._synced === false) {
          // Local has unsynced changes: keep local, will sync later
          merged.push(local);
          logger.warn(`⚠️ [SYNC] Conflict: ${collection}[${id}] - keeping local unsynced version`);
        } else {
          // Local is same or newer and synced: use local
          merged.push(local);
        }
      }
    }

    // Don't validate here - will validate after all collections are synced
    return merged;
  }

  /**
   * Validate merged data for integrity issues
   * Only logs warnings, doesn't throw errors
   */
  private validateMergedData(data: BaseEntity[], collection: CollectionName): void {
    // Quick validation: check for orphaned records in this collection
    const relationships = this.getRelationshipsMap();
    const collectionRelations = relationships[collection];

    if (collectionRelations) {
      for (const item of data) {
        for (const [field, config] of Object.entries(collectionRelations)) {
          const value = (item as any)[field];
          if (value !== undefined && value !== null && config.required) {
            const targetCollection = (this as any)[config.target] as BaseEntity[];
            if (!targetCollection || targetCollection.length === 0) {
              // Target collection not loaded yet, skip validation
              continue;
            }

            // Normalize IDs for comparison (handle both string and number IDs)
            const normalizedValue = typeof value === 'string' && !isNaN(Number(value))
              ? Number(value)
              : value;

            const exists = targetCollection.some(t => {
              const normalizedTargetId = typeof t.id === 'string' && !isNaN(Number(t.id))
                ? Number(t.id)
                : t.id;
              return String(normalizedTargetId) === String(normalizedValue) ||
                normalizedTargetId === normalizedValue;
            });

            if (!exists) {
              // Only warn if target collection has items (to avoid false positives during initial load)
              if (targetCollection.length > 0) {
                logger.warn(
                  `⚠️ [INTEGRITY] ${collection}[${item.id}].${field} → ${config.target}[${value}] (missing after merge)`
                );
              }
            }
          }
        }
      }
    }
  }
}
