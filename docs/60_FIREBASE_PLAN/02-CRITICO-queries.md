# TAREA 2: AGREGAR FILTROS A LAS QUERIES

## Tiempo estimado: 3 horas
## Complejidad: Media-Alta
## Prerequisitos: TAREA 1 completada (reglas de seguridad)

---

## QUE VAMOS A HACER

Actualmente, cuando abres la seccion de Facturas, la app hace esto:
```
"Dame TODAS las facturas de la base de datos"
```

Despues de este cambio, hara esto:
```
"Dame las facturas del Restaurante X, ordenadas por fecha, maximo 100"
```

**Beneficios:**
- Menos datos descargados = App mas rapida
- Menos lecturas = Menos coste en Firebase
- Solo ves TUS datos = Mas privacidad

---

## IMPACTO DE NO ARREGLARLO

- COSTE: Pagas por leer datos que no necesitas
- VELOCIDAD: La app tarda mas en cargar
- PRIVACIDAD: Puedes ver datos de otros restaurantes
- ESCALA: Con muchos restaurantes, la app sera muy lenta

---

## ARCHIVOS A MODIFICAR

| Archivo | Ubicacion | Que cambiaremos |
|---------|-----------|-----------------|
| FirestoreService.ts | src/core/services/ | Agregar metodos con filtros |

---

## PASO A PASO

### PASO 1: Abrir el archivo

1. Abre tu editor de codigo (VS Code, Cursor, etc.)
2. Navega a: `src/core/services/FirestoreService.ts`
3. Este es el archivo que controla todas las operaciones con Firebase

### PASO 2: Hacer backup del archivo actual

Antes de modificar:
1. Copia todo el contenido del archivo
2. Crea un archivo nuevo: `FirestoreService.ts.backup`
3. Pega el contenido ahi

### PASO 3: Reemplazar el archivo completo

1. Selecciona TODO el contenido de `FirestoreService.ts`
2. Borralo
3. Copia el codigo nuevo de abajo
4. Pegalo

**CODIGO NUEVO COMPLETO:**

```typescript
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
  filters?: Record<string, any>;
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
 */
const SHARED_COLLECTIONS: CollectionName[] = [
  'productos',
  'proveedores',
  'escandallos',
  'companies',
  'restaurants',
  'usuarios',
  'roles',
];

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
    } catch (error) {
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
   * CAMBIO: Ahora valida que documentos de colecciones filtradas tengan restaurantId
   */
  async add<T extends Record<string, any>>(
    collectionName: CollectionName,
    data: T,
    customId?: string
  ): Promise<FirebaseResponse<T & { id: string }>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    // CAMBIO 1: Validar que tenga restaurantId si es requerido
    if (this.requiresRestaurantFilter(collectionName) && !data.restaurantId) {
      logger.error(`❌ Missing restaurantId for ${collectionName}`);
      return {
        success: false,
        error: `El campo restaurantId es obligatorio para ${collectionName}`,
      };
    }

    try {
      // CAMBIO 2: Agregar timestamps automaticamente
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
    } catch (error) {
      logger.error(`Firebase error adding to ${collectionName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update a document in a collection
   * CAMBIO: Agrega updatedAt automaticamente
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

      // CAMBIO: Agregar timestamp de actualizacion
      const dataWithTimestamp = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(docRef, dataWithTimestamp as any);
      logger.info(`Updated in Firebase: ${collectionName}/${id}`);
      return { success: true };
    } catch (error) {
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
    } catch (error) {
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
        const data = { id: docSnap.id, ...docSnap.data() } as T;
        this.validateDocumentStructure(collectionName, data);
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
    } catch (error) {
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
  private validateDocumentStructure(collectionName: CollectionName, data: any): void {
    const requiredFields: Record<CollectionName, string[]> = {
      productos: ['nombre', 'proveedorId'],
      proveedores: ['nombre', 'cif'],
      facturas: ['numeroFactura', 'proveedorId', 'fecha', 'total', 'restaurantId'],
      albaranes: ['numeroFactura', 'proveedorId', 'fecha', 'restaurantId'],
      inventarios: ['fecha', 'productos', 'restaurantId'],
      cierres: ['fecha', 'turno', 'restaurantId'],
      escandallos: ['nombre', 'pvpConIVA'],
      delivery: ['fecha', 'plataforma', 'restaurantId'],
      usuarios: ['nombre', 'rolId'],
      roles: ['nombre', 'permisos'],
      companies: ['nombre'],
      restaurants: ['nombre', 'companyId'],
      transfers: ['origenId', 'destinoId', 'items'],
      fichajes: ['workerId', 'date'],
      mermas: ['fecha', 'productoId', 'restaurantId'],
      orders: ['fecha', 'proveedorId', 'restaurantId'],
      workers: ['nombre', 'companyId'],
      pnl_adjustments: ['period', 'amount', 'category', 'restaurantId'],
      absences: ['workerId', 'startDate', 'endDate', 'type'],
      vacation_requests: ['workerId', 'startDate', 'endDate', 'daysCount'],
      gastosFijos: ['tipo', 'descripcion', 'importeMensual', 'restaurantId'],
      nominas: ['mes', 'trabajadorId', 'importeBruto', 'restaurantId']
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
   * METODO ANTIGUO - Get all documents (SIN FILTRO)
   * ADVERTENCIA: Solo usar para colecciones compartidas
   * @deprecated Usar getByRestaurant() para colecciones filtradas
   */
  async getAll<T>(collectionName: CollectionName): Promise<FirebaseResponse<T[]>> {
    if (!this.db) {
      return { success: false, error: 'Firestore not initialized' };
    }

    // CAMBIO: Advertir si se usa getAll en coleccion que deberia filtrarse
    if (this.requiresRestaurantFilter(collectionName)) {
      logger.warn(
        `[PERFORMANCE] getAll() usado en ${collectionName}. ` +
        `Considera usar getByRestaurant() para mejor rendimiento.`
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
    } catch (error) {
      logger.error(`Firebase error fetching ${collectionName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * METODO NUEVO - Get documents by restaurant
   * Este es el metodo principal para obtener datos filtrados
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
    } catch (error) {
      logger.error(`Firebase error fetching ${collectionName}:`, error);

      // Si el error es por falta de indice, dar instrucciones
      if (error instanceof Error && error.message.includes('index')) {
        return {
          success: false,
          error: `Falta un indice en Firebase. Ve a Firebase Console > Firestore > Indices y crealo.`,
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
```

### PASO 4: Guardar el archivo

1. Guarda el archivo (Ctrl+S o Cmd+S)
2. Si hay errores de TypeScript, revisalos

---

## COMO USAR LOS NUEVOS METODOS

### Antes (codigo viejo):
```typescript
// Esto cargaba TODAS las facturas de TODOS los restaurantes
const result = await firestoreService.getAll('facturas');
```

### Despues (codigo nuevo):
```typescript
// Esto carga solo las facturas de TU restaurante
const result = await firestoreService.getByRestaurant('facturas', currentRestaurantId);
```

### Con opciones adicionales:
```typescript
// Facturas del ultimo mes, ordenadas por fecha, maximo 50
const result = await firestoreService.getByRestaurant('facturas', currentRestaurantId, {
  orderByField: 'fecha',
  orderDirection: 'desc',
  limitCount: 50,
});
```

---

## DONDE CAMBIAR LAS LLAMADAS

Despues de modificar FirestoreService, hay que actualizar los lugares donde se usa.
Busca en el proyecto todas las llamadas a `getAll()` y cambialas por `getByRestaurant()`.

### Archivos que probablemente usan getAll():

| Archivo | Buscar | Cambiar por |
|---------|--------|-------------|
| Paginas de listado | `.getAll('facturas')` | `.getByRestaurant('facturas', restaurantId)` |
| Hooks de datos | `.getAll('inventarios')` | `.getByRestaurant('inventarios', restaurantId)` |
| Servicios | `.getAll('cierres')` | `.getByRestaurant('cierres', restaurantId)` |

### Como buscar:

1. En VS Code, presiona `Ctrl+Shift+F` (buscar en todos los archivos)
2. Busca: `getAll(`
3. Revisa cada resultado
4. Si es una coleccion que debe filtrarse, cambiala

---

## VERIFICACION

### Como saber que funciona:

1. **Abre la consola del navegador** (F12 > Console)
2. **Navega a una seccion** (ej: Facturas)
3. **Busca el log:** `Fetched X docs from facturas (restaurant: XXX, limit: 100)`
4. **El numero X debe ser menor** que antes (solo tus facturas, no todas)

### Si ves advertencias:

Si ves este mensaje en la consola:
```
[PERFORMANCE] getAll() usado en facturas. Considera usar getByRestaurant()
```

Significa que todavia hay algun lugar del codigo usando el metodo viejo. Buscalo y cambialo.

---

## ERRORES COMUNES

### Error: "Falta un indice en Firebase"

**Causa:** Firebase necesita un indice para hacer la query eficientemente.

**Solucion:** Ve a la TAREA 3 (indices) y despliega los indices faltantes.

### Error: "restaurantId is required"

**Causa:** Estas llamando a getByRestaurant() sin pasar el restaurantId.

**Solucion:** Asegurate de obtener el restaurantId del contexto:
```typescript
const { currentRestaurant } = useRestaurantContext();
const restaurantId = currentRestaurant?.id;
```

### Error: "Missing required fields: restaurantId"

**Causa:** Estas intentando guardar un documento sin restaurantId.

**Solucion:** Agrega el restaurantId antes de guardar:
```typescript
const nuevaFactura = {
  ...datosFactura,
  restaurantId: currentRestaurant.id, // AGREGAR ESTO
};
await firestoreService.add('facturas', nuevaFactura);
```

---

## SIGUIENTE PASO

Continua con: **`03-ALTO-indices.md`**

Los indices son necesarios para que las nuevas queries funcionen rapido.

---

## TIEMPO REAL EMPLEADO

- [ ] Modificar FirestoreService: ___ minutos
- [ ] Buscar y reemplazar llamadas getAll: ___ minutos
- [ ] Verificar en navegador: ___ minutos
- [ ] Corregir errores: ___ minutos
- [ ] **TOTAL:** ___ minutos
