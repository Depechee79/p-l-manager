import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Firestore,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import type { CollectionName, FirebaseResponse } from '@/types';
import { getFirestoreInstance } from '@/config/firebase.config';
import { logger } from './LoggerService';

/**
 * Opciones para filtrar queries
 */
interface QueryOptions {
  /** ID del restaurante para filtrar */
  restaurantId?: string;
  /** Campo por el cual ordenar */
  orderByField?: string;
  /** Direccion del ordenamiento: 'asc' o 'desc' */
  orderDirection?: 'asc' | 'desc';
  /** Numero maximo de documentos a retornar */
  limitCount?: number;
  /** Filtros adicionales: { campo: valor } */
  filters?: Record<string, unknown>;
}

/**
 * Colecciones que requieren filtro por restaurantId
 */
const RESTAURANT_FILTERED_COLLECTIONS: CollectionName[] = [
  'facturas',
  'albaranes',
  'inventarios',
  'cierres',
  'delivery',
  'mermas',
  'orders',
  'gastosFijos',
  'pnl_adjustments',
  'nominas',
];

/**
 * Colecciones que se comparten (no requieren filtro por restaurante)
 * @internal Used for documentation/reference
 */
const _SHARED_COLLECTIONS: CollectionName[] = [
  'productos',
  'proveedores',
  'escandallos',
  'companies',
  'restaurants',
  'usuarios',
  'roles',
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void _SHARED_COLLECTIONS; // Suppress unused warning - kept for documentation

/**
 * Colecciones de RRHH (filtran por companyId o workerId)
 */
const HR_COLLECTIONS: CollectionName[] = [
  'workers',
  'fichajes',
  'absences',
  'vacation_requests',
];

/**
 * Firestore Service
 * Handles Firebase Firestore operations with restaurant filtering
 */
export class FirestoreService {
  private db: Firestore | null = null;

  constructor() {
    try {
      this.db = getFirestoreInstance();
    } catch (error: unknown) {
      logger.warn('Firestore failed to initialize (Offline mode):', error);
    }
  }

  /**
   * Verifica si una coleccion requiere filtro por restaurantId
   */
  private requiresRestaurantFilter(collectionName: CollectionName): boolean {
    return RESTAURANT_FILTERED_COLLECTIONS.includes(collectionName);
  }

  /**
   * Add a document to a collection
   */
  async add<T extends Record<string, unknown>>(
    collectionName: CollectionName,
    data: T,
    customId?: string
  ): Promise<FirebaseResponse<T & { id: string }>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    // Validar que tenga restaurantId si es requerido
    if (this.requiresRestaurantFilter(collectionName) && !data.restaurantId) {
      logger.error(`Missing restaurantId for ${collectionName}`);
      return {
        success: false,
        error: `El campo restaurantId es obligatorio para ${collectionName}`,
      };
    }

    try {
      // Agregar timestamps automaticamente
      const dataWithTimestamp = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (customId) {
        const docRef = doc(this.db, collectionName, customId);
        await setDoc(docRef, dataWithTimestamp);
        logger.info(`Synced to Firebase (Custom ID): ${collectionName}/${customId}`);
        return {
          success: true,
          data: { ...dataWithTimestamp, id: customId } as T & { id: string },
        };
      } else {
        const collectionRef = collection(this.db, collectionName);
        const docRef = await addDoc(collectionRef, dataWithTimestamp);
        logger.info(`Synced to Firebase: ${collectionName}/${docRef.id}`);
        return {
          success: true,
          data: { ...dataWithTimestamp, id: docRef.id } as T & { id: string },
        };
      }
    } catch (error: unknown) {
      logger.error(`Firebase error adding to ${collectionName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a document in a collection
   */
  async update<T>(
    collectionName: CollectionName,
    id: string,
    data: Partial<T>
  ): Promise<FirebaseResponse<T>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    try {
      const docRef = doc(this.db, collectionName, id);

      // Agregar timestamp de actualizacion
      const dataWithTimestamp = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, dataWithTimestamp as Record<string, unknown>);
      logger.info(`Updated in Firebase: ${collectionName}/${id}`);
      return { success: true };
    } catch (error: unknown) {
      logger.error(`Firebase error updating ${collectionName}/${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a document from a collection
   */
  async delete(
    collectionName: CollectionName,
    id: string
  ): Promise<FirebaseResponse<void>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    try {
      const docRef = doc(this.db, collectionName, id);
      await deleteDoc(docRef);
      logger.info(`Deleted from Firebase: ${collectionName}/${id}`);
      return { success: true };
    } catch (error: unknown) {
      logger.error(`Firebase error deleting ${collectionName}/${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a document by ID
   */
  async get<T>(
    collectionName: CollectionName,
    id: string
  ): Promise<FirebaseResponse<T>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    try {
      const docRef = doc(this.db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rawData: Record<string, unknown> = { id: docSnap.id, ...docSnap.data() };
        this.validateDocumentStructure(collectionName, rawData);
        const data = rawData as T;
        return {
          success: true,
          data,
        };
      } else {
        return {
          success: false,
          error: 'Document not found',
        };
      }
    } catch (error: unknown) {
      logger.error(`Firebase error getting ${collectionName}/${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate document structure and types from Firebase
   */
  private validateDocumentStructure(collectionName: CollectionName, data: Record<string, unknown>): void {
    const requiredFields: Record<CollectionName, string[]> = {
      productos: ['nombre', 'proveedorId'],
      proveedores: ['nombre', 'cif'],
      facturas: ['numeroFactura', 'proveedorId', 'fecha', 'total'],
      albaranes: ['numeroFactura', 'proveedorId', 'fecha'],
      inventarios: ['fecha', 'productos'],
      cierres: ['fecha', 'turno'],
      escandallos: ['nombre', 'pvpConIVA'],
      delivery: ['fecha', 'plataforma'],
      usuarios: ['nombre', 'rolId'],
      roles: ['nombre', 'permisos'],
      companies: ['nombre'],
      restaurants: ['nombre', 'companyId'],
      transfers: ['origenId', 'destinoId', 'items'],
      fichajes: ['workerId', 'date'],
      mermas: ['fecha', 'productoId'],
      orders: ['fecha', 'proveedorId'],
      workers: ['nombre', 'companyId'],
      pnl_adjustments: ['period', 'amount', 'category'],
      absences: ['workerId', 'startDate', 'endDate', 'type'],
      vacation_requests: ['workerId', 'startDate', 'endDate', 'daysCount'],
      gastosFijos: ['tipo', 'descripcion', 'importeMensual', 'restaurantId'],
      nominas: ['mes', 'trabajadorId', 'importeBruto']
    };

    const required = requiredFields[collectionName] || [];
    const missing: string[] = [];

    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      logger.warn(
        `[VALIDATION] ${collectionName}[${data.id}]: Missing required fields: ${missing.join(', ')}`
      );
    }

    if (data.id && typeof data.id !== 'string' && typeof data.id !== 'number') {
      logger.warn(`[VALIDATION] ${collectionName}[${data.id}]: ID type is ${typeof data.id}, expected string or number`);
    }
  }

  /**
   * Get all documents from a collection (sin filtro)
   * AUDIT-FIX: P2.2 - Documented acceptable use cases
   *
   * Acceptable use cases:
   * - Shared collections: productos, proveedores, escandallos, roles, usuarios
   * - System collections: companies, restaurants
   * - Initial data sync for critical data
   *
   * @param collectionName - Collection to fetch
   * @param silent - If true, suppress performance warning (for known acceptable uses)
   */
  async getAll<T>(
    collectionName: CollectionName,
    silent: boolean = false
  ): Promise<FirebaseResponse<T[]>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    // AUDIT-FIX: P2.2 - Only warn for truly filterable collections when not silent
    if (!silent && this.requiresRestaurantFilter(collectionName)) {
      // This warning helps identify places where getByRestaurant() should be used
      // Silent mode should be used for critical data sync where all data is needed
      logger.debug(
        `[SYNC] getAll() on ${collectionName} - use getByRestaurant() for filtered queries`
      );
    }

    try {
      const collectionRef = collection(this.db, collectionName);
      const snapshot = await getDocs(collectionRef);
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as T[];

      return { success: true, data };
    } catch (error: unknown) {
      logger.error(`Firebase error fetching ${collectionName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get documents by restaurant - METODO PRINCIPAL para datos filtrados
   */
  async getByRestaurant<T>(
    collectionName: CollectionName,
    restaurantId: string,
    options?: Omit<QueryOptions, 'restaurantId'>
  ): Promise<FirebaseResponse<T[]>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    if (!restaurantId) {
      return { success: false, error: 'restaurantId is required' };
    }

    try {
      const collectionRef = collection(this.db, collectionName);
      const constraints: QueryConstraint[] = [];

      // Filtro principal por restaurante
      constraints.push(where('restaurantId', '==', restaurantId));

      // Filtros adicionales
      if (options?.filters) {
        for (const [field, value] of Object.entries(options.filters)) {
          constraints.push(where(field, '==', value));
        }
      }

      // Ordenamiento
      if (options?.orderByField) {
        constraints.push(
          orderBy(options.orderByField, options.orderDirection || 'desc')
        );
      } else {
        // Por defecto, ordenar por fecha descendente si existe el campo
        if (this.hasDateField(collectionName)) {
          constraints.push(orderBy('fecha', 'desc'));
        }
      }

      // Limite de documentos
      const maxDocs = options?.limitCount || 100;
      constraints.push(limit(maxDocs));

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as T[];

      logger.info(
        `Fetched ${data.length} docs from ${collectionName} ` +
        `(restaurant: ${restaurantId}, limit: ${maxDocs})`
      );

      return { success: true, data };
    } catch (error: unknown) {
      logger.error(`Firebase error fetching ${collectionName}:`, error);

      // Si el error es por falta de indice, dar instrucciones
      if (error instanceof Error && error.message.includes('index')) {
        return {
          success: false,
          error: `Falta un indice en Firebase. Ejecuta: firebase deploy --only firestore:indexes`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get documents with custom query options
   */
  async getWithQuery<T>(
    collectionName: CollectionName,
    options: QueryOptions
  ): Promise<FirebaseResponse<T[]>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    try {
      const collectionRef = collection(this.db, collectionName);
      const constraints: QueryConstraint[] = [];

      // Filtro por restaurante si se proporciona
      if (options.restaurantId) {
        constraints.push(where('restaurantId', '==', options.restaurantId));
      }

      // Filtros adicionales
      if (options.filters) {
        for (const [field, value] of Object.entries(options.filters)) {
          constraints.push(where(field, '==', value));
        }
      }

      // Ordenamiento
      if (options.orderByField) {
        constraints.push(
          orderBy(options.orderByField, options.orderDirection || 'desc')
        );
      }

      // Limite
      if (options.limitCount) {
        constraints.push(limit(options.limitCount));
      } else {
        constraints.push(limit(100)); // Limite por defecto
      }

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as T[];

      return { success: true, data };
    } catch (error: unknown) {
      logger.error(`Firebase error in custom query for ${collectionName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get documents by worker (for HR collections)
   */
  async getByWorker<T>(
    collectionName: CollectionName,
    workerId: string,
    options?: Omit<QueryOptions, 'restaurantId'>
  ): Promise<FirebaseResponse<T[]>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    if (!HR_COLLECTIONS.includes(collectionName)) {
      return {
        success: false,
        error: `${collectionName} no es una coleccion de RRHH`
      };
    }

    try {
      const collectionRef = collection(this.db, collectionName);
      const constraints: QueryConstraint[] = [];

      constraints.push(where('workerId', '==', workerId));

      if (options?.orderByField) {
        constraints.push(
          orderBy(options.orderByField, options.orderDirection || 'desc')
        );
      } else {
        constraints.push(orderBy('date', 'desc'));
      }

      const maxDocs = options?.limitCount || 50;
      constraints.push(limit(maxDocs));

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as T[];

      return { success: true, data };
    } catch (error: unknown) {
      logger.error(`Firebase error fetching ${collectionName} by worker:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get documents by company (for shared collections)
   */
  async getByCompany<T>(
    collectionName: CollectionName,
    companyId: string,
    options?: Omit<QueryOptions, 'restaurantId'>
  ): Promise<FirebaseResponse<T[]>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    try {
      const collectionRef = collection(this.db, collectionName);
      const constraints: QueryConstraint[] = [];

      constraints.push(where('companyId', '==', companyId));

      if (options?.orderByField) {
        constraints.push(
          orderBy(options.orderByField, options.orderDirection || 'desc')
        );
      }

      const maxDocs = options?.limitCount || 100;
      constraints.push(limit(maxDocs));

      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as T[];

      return { success: true, data };
    } catch (error: unknown) {
      logger.error(`Firebase error fetching ${collectionName} by company:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determina si una coleccion tiene campo 'fecha'
   */
  private hasDateField(collectionName: CollectionName): boolean {
    const collectionsWithDate: CollectionName[] = [
      'facturas',
      'albaranes',
      'inventarios',
      'cierres',
      'delivery',
      'mermas',
      'orders',
    ];
    return collectionsWithDate.includes(collectionName);
  }

  /**
   * Check if Firestore connection is working
   */
  async testConnection(): Promise<FirebaseResponse<boolean>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized', data: false };
    }

    try {
      const testCollection = collection(this.db, 'test_connection');
      await getDocs(query(testCollection));
      return {
        success: true,
        data: true,
      };
    } catch (error: unknown) {
      logger.error('Firebase connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        data: false,
      };
    }
  }

  /**
   * Count documents in a collection (for analytics)
   */
  async countByRestaurant(
    collectionName: CollectionName,
    restaurantId: string
  ): Promise<FirebaseResponse<number>> {
    const result = await this.getByRestaurant(collectionName, restaurantId);
    if (result.success && result.data) {
      return { success: true, data: result.data.length };
    }
    return { success: false, error: result.error, data: 0 };
  }
}
