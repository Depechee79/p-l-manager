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

import { Timestamp } from 'firebase/firestore';

import { FirestoreService } from './FirestoreService';
import { DataIntegrityService } from './DataIntegrityService';
import { logger } from './LoggerService';
import { ToastService } from './ToastService';
import { toDate } from '@shared/utils/dateUtils';

/**
 * Maps each collection name to its concrete entity type.
 * Used to make setCollection type-safe without per-case casts.
 */
interface CollectionTypeMap {
  cierres: Cierre;
  facturas: Invoice;
  albaranes: Invoice;
  proveedores: Provider;
  productos: Product;
  escandallos: Escandallo;
  inventarios: InventoryItem;
  delivery: DeliveryRecord;
  usuarios: AppUser;
  roles: Role;
  companies: Company;
  restaurants: Restaurant;
  transfers: Transfer;
  workers: Worker;
  mermas: BaseEntity;
  orders: BaseEntity;
  pnl_adjustments: BaseEntity;
  absences: Absence;
  vacation_requests: VacationRequest;
  gastosFijos: GastoFijo;
  nominas: BaseEntity;
  fichajes: BaseEntity;
}

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
    // Only shared/global collections here. Restaurant-filtered collections
    // (like gastosFijos) must NOT be loaded at startup because Firestore rules
    // require restaurantId ownership checks, which fail before user profile is
    // resolved. They are loaded on-demand via ensureLoaded() in each page.
    const criticalCollections: CollectionName[] = [
      'companies',
      'restaurants',
      'roles',
      'usuarios',
    ];

    logger.info('🚀 [STARTUP] Loading critical configuration...');

    await Promise.all(
      criticalCollections.map(col => this.syncCollection(col))
    );

    logger.info('✅ [STARTUP] Critical configuration loaded');
  }

  /**
   * Sync a single collection from cloud
   * AUDIT-FIX: P2.2 - Using silent mode for sync to avoid console spam
   */
  async syncCollection(col: CollectionName): Promise<void> {
    try {
      if (this.loadedCollections.has(col)) {
        // Already loading or loaded?
        // For now, simpler: allow re-sync if called explicitly
      }

      // AUDIT-FIX: P2.2 - Pass silent=true to suppress performance warnings during sync
      const response = await this.cloudService.getAll<BaseEntity>(col, true);
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
    } catch (error: unknown) {
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
   * Save data to localStorage.
   * Converts Firestore Timestamps to ISO strings before serializing,
   * because JSON.stringify(Timestamp) produces {seconds,nanoseconds}
   * which loses the Timestamp prototype and breaks instanceof checks.
   */
  private save(key: string, data: BaseEntity[]): void {
    const serializable = data.map(item => ({
      ...item,
      createdAt: item.createdAt instanceof Timestamp
        ? item.createdAt.toDate().toISOString()
        : item.createdAt,
      updatedAt: item.updatedAt instanceof Timestamp
        ? item.updatedAt.toDate().toISOString()
        : item.updatedAt,
    }));
    localStorage.setItem(key, JSON.stringify(serializable));
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
   * Set collection by name (type-safe via CollectionTypeMap).
   * Single cast point: `this` is indexed dynamically, concentrating the
   * unavoidable runtime-safe assertion in ONE place instead of 17+ cases.
   */
  private setCollection<K extends keyof CollectionTypeMap>(
    name: K,
    data: CollectionTypeMap[K][]
  ): void {
    (this as Record<string, unknown>)[name] = data;
  }

  /**
   * Access a dynamic field on an entity item.
   * Entity subtypes carry additional fields not in the base interface;
   * this helper reads them via Object.entries which returns string-keyed pairs.
   */
  private getField(item: object, field: string): unknown {
    return Object.fromEntries(Object.entries(item))[field];
  }

  /**
   * Convert an entity to a Record<string, unknown> for Firestore operations.
   * Object.fromEntries(Object.entries(...)) produces a clean Record<string, unknown>.
   */
  private toRecord(item: object): Record<string, unknown> {
    return Object.fromEntries(Object.entries(item));
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
    _options: { silent?: boolean } = {}
  ): Promise<T> {
    // Session 006: Disabled automatic toasts - too noisy. Only show errors.
    const toastId = null;

    try {
      // Validate foreign keys before adding
      const relationships = this.getRelationshipsMap();
      const collectionRelations = relationships[collection];

      if (collectionRelations) {
        for (const [field, config] of Object.entries(collectionRelations)) {
          const value = this.getField(item, field) as string | number | null | undefined;
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
      this.validateNestedReferences(collection, this.toRecord(item));

      const newItem = {
        ...item,
        id: this.generateId(),
        _synced: true,
        createdAt: Timestamp.now(),
      } as T;

      const firestoreId = String(newItem.id);

      // CLOUD-FIRST: Send to Firebase first
      const result = await this.cloudService.add(collection, this.toRecord(newItem), firestoreId);

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
        // Session 006: Removed success toast - too noisy. Only show errors.
      }

      return newItem;
    } catch (error: unknown) {
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
   * Validate nested references in item (arrays with foreign keys)
   */
  private validateNestedReferences(collection: CollectionName, item: Record<string, unknown>): void {
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
    _options: { silent?: boolean } = {}
  ): Promise<T | null> {
    const currentCollection = this.getCollection(collection);
    const index = currentCollection.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    // Session 006: Disabled automatic toasts - too noisy. Only show errors.
    const toastId = null;

    try {
      const oldItem = currentCollection[index];
      const updated = {
        ...oldItem,
        ...updatedItem,
        id, // Preserve id
        _synced: true,
        updatedAt: Timestamp.now(),
      } as T;

      // Validate foreign keys if they are being updated
      const relationships = this.getRelationshipsMap();
      const collectionRelations = relationships[collection];

      if (collectionRelations) {
        for (const [field, config] of Object.entries(collectionRelations)) {
          // Only validate if the field is being updated
          if (field in updatedItem) {
            const value = this.getField(updated, field) as string | number | null | undefined;
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
      const partialRecord = this.toRecord(updatedItem as BaseEntity);
      if (partialRecord.productos || partialRecord.ingredientes) {
        this.validateNestedReferences(collection, this.toRecord(updated));
      }

      const firestoreId = String(id);

      // CLOUD-FIRST: Send to Firebase first
      const result = await this.cloudService.update(collection, firestoreId, this.toRecord(updated));

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar en Firebase');
      }

      // Firebase success: update local state
      currentCollection[index] = updated;
      this.save(collection, currentCollection);

      logger.info(`✅ [UPDATE] ${collection}/${id} → Firebase OK`);

      if (toastId) {
        ToastService.dismiss(toastId);
        // Session 006: Removed success toast - too noisy. Only show errors.
      }

      return updated;
    } catch (error: unknown) {
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
   * Delete item from collection (CLOUD-FIRST)
   * Sends to Firebase FIRST, then updates local state
   * Throws error if there are active references or Firebase fails
   */
  async delete(
    collection: CollectionName,
    id: number | string,
    _options: { silent?: boolean } = {}
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

    // Session 006: Disabled automatic toasts - too noisy. Only show errors.
    const toastId = null;

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
        // Session 006: Removed success toast - too noisy. Only show errors.
      }
    } catch (error: unknown) {
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
   * Get items by period filter
   */
  getByPeriod(collection: CollectionName, period: Period): BaseEntity[] {
    const now = new Date();
    const items = this.getCollection(collection);

    return items.filter((item) => {
      const fecha = this.getField(item, 'fecha');
      if (!fecha) return true;

      const itemDate = new Date(fecha as string);
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
        const localUpdated = local.updatedAt ? (toDate(local.updatedAt)?.getTime() ?? 0) : 0;
        const cloudUpdated = cloud.updatedAt ? (toDate(cloud.updatedAt)?.getTime() ?? 0) : 0;

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
          const value = this.getField(item, field);
          if (value !== undefined && value !== null && config.required) {
            const targetCollection = this.getCollection(config.target);
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
