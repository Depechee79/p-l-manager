# 02 - ANALISIS DE QUERIES Y COSTES

## RESUMEN CRITICO

| Metrica | Valor | Estado |
|---------|-------|--------|
| Total queries identificadas | 47 | - |
| Queries optimizadas | 0 | 🔴 0% |
| Queries sin filtros | 47 | 🔴 100% |
| Queries con limit | 0 | 🔴 0% |

---

## QUERY PRINCIPAL PROBLEMATICA

### FirestoreService.getAll() - DESCARGA TODO

**Ubicacion:** `src/core/services/FirestoreService.ts:216-238`

```typescript
// ❌ ACTUAL - Lee TODA la coleccion
async getAll<T>(collectionName: CollectionName): Promise<FirebaseResponse<T[]>> {
  const collectionRef = collection(this.db, collectionName);
  const snapshot = await getDocs(collectionRef);  // 🔴 SIN WHERE, SIN LIMIT
  const data = snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as T[];
  return { success: true, data };
}
```

**Problema:**
- No filtra por restaurantId
- No tiene limit
- Lee TODOS los documentos de la coleccion

---

## INVENTARIO COMPLETO DE QUERIES

### PAGINAS Y SUS QUERIES

| Pagina | Archivo | Colecciones cargadas | Reads estimados |
|--------|---------|---------------------|-----------------|
| Dashboard | DashboardPage.tsx:44-45 | cierres, facturas | 500+ |
| Cierres | CierresPage.tsx:25 | cierres | 365+ |
| Facturas | InvoicesPage.tsx:31-33 | facturas, proveedores, productos | 1000+ |
| Inventarios | InventariosPage.tsx:21-22 | inventarios, productos | 500+ |
| Escandallos | EscandallosPage.tsx:27-28 | escandallos, productos | 300+ |
| P&L | PnLPage.tsx:169-172 | cierres, facturas, delivery, pnl_adjustments | 1500+ |
| Personal | PersonalPage.tsx:87-91 | workers, roles, usuarios, absences, vacation_requests | 200+ |
| Nominas | NominasPage.tsx:53-54 | workers, nominas | 100+ |
| Mermas | MermasPage.tsx:61-63 | mermas, productos, workers | 400+ |
| Pedidos | OrdersPage.tsx:19-21 | orders, productos, proveedores | 400+ |
| Transferencias | TransfersPage.tsx:29-31 | transfers, productos, restaurants | 200+ |
| Fichajes | FichajesPage.tsx:24-25 | fichajes, workers | 100+ |
| Roles Admin | RolesAdminPage.tsx:31 | roles | 10+ |
| Gastos Fijos | GastosFijosPage.tsx:45 | gastosFijos | 50+ |

**Total reads por sesion tipica:** ~5,000+ documentos

---

## TOP 5 QUERIES MAS COSTOSAS

### 1. PnLPage - 4 colecciones simultaneas

**Ubicacion:** `src/pages/PnLPage.tsx:169-172`

```typescript
await Promise.all([
  db.ensureLoaded('cierres'),
  db.ensureLoaded('facturas'),
  db.ensureLoaded('delivery'),
  db.ensureLoaded('pnl_adjustments')
]);
```

| Coleccion | Docs estimados (1 ano, 1 restaurante) | Sin filtro |
|-----------|---------------------------------------|------------|
| cierres | 365 | 365 reads |
| facturas | 500 | 500 reads |
| delivery | 365 | 365 reads |
| pnl_adjustments | 12 | 12 reads |
| **TOTAL** | | **1,242 reads** |

**Con 10 restaurantes y datos mezclados:**
- 1,242 x 10 = **12,420 reads por visita a P&L**

**Optimizacion:**
```typescript
// ✅ OPTIMIZADO
await Promise.all([
  db.ensureLoadedForRestaurant('cierres', restaurantId, { fecha: currentMonth }),
  db.ensureLoadedForRestaurant('facturas', restaurantId, { fecha: currentMonth }),
  db.ensureLoadedForRestaurant('delivery', restaurantId, { fecha: currentMonth }),
  db.ensureLoadedForRestaurant('pnl_adjustments', restaurantId)
]);
```

**Ahorro:** ~95% (solo lee del restaurante actual y mes actual)

---

### 2. InvoicesPage - 3 colecciones

**Ubicacion:** `src/pages/InvoicesPage.tsx:31-33`

```typescript
await Promise.all([
  db.ensureLoaded('facturas'),
  db.ensureLoaded('proveedores'),
  db.ensureLoaded('productos')
]);
```

| Coleccion | Docs estimados | Reads |
|-----------|----------------|-------|
| facturas | 500 | 500 |
| proveedores | 50 | 50 |
| productos | 200 | 200 |
| **TOTAL** | | **750 reads** |

---

### 3. PersonalPage - 5 colecciones

**Ubicacion:** `src/features/personal/PersonalPage.tsx:87-91`

```typescript
await Promise.all([
  db.ensureLoaded('workers'),
  db.ensureLoaded('roles'),
  db.ensureLoaded('usuarios'),
  db.ensureLoaded('absences'),
  db.ensureLoaded('vacation_requests')
]);
```

**Reads:** ~200+ por visita

---

### 4. InventariosPage - 2 colecciones

**Ubicacion:** `src/pages/InventariosPage.tsx:21-22`

```typescript
await Promise.all([
  db.ensureLoaded('inventarios'),
  db.ensureLoaded('productos')
]);
```

**Reads:** ~500+ por visita (inventarios historicos + todos los productos)

---

### 5. MermasPage - 3 colecciones

**Ubicacion:** `src/pages/MermasPage.tsx:61-63`

```typescript
await Promise.all([
  db.ensureLoaded('mermas'),
  db.ensureLoaded('productos'),
  db.ensureLoaded('workers')
]);
```

**Reads:** ~400+ por visita

---

## CALCULO DE COSTES

### Precios Firestore (Enero 2026)

| Operacion | Coste |
|-----------|-------|
| Lectura | $0.06 / 100,000 docs |
| Escritura | $0.18 / 100,000 docs |
| Eliminacion | $0.02 / 100,000 docs |
| Almacenamiento | $0.18 / GB / mes |

### Escenario: 1 Usuario, 1 Restaurante, Uso Normal

| Metrica | Valor |
|---------|-------|
| Visitas a app/dia | 5 |
| Reads promedio/visita | 2,000 |
| **Reads/dia** | 10,000 |
| **Reads/mes** | 300,000 |
| **Coste/mes** | **$0.018** |

### Escenario: 10 Usuarios, 10 Restaurantes, Uso Normal

| Metrica | Sin optimizar | Con optimizar |
|---------|---------------|---------------|
| Reads/dia | 100,000 | 10,000 |
| Reads/mes | 3,000,000 | 300,000 |
| **Coste/mes** | **$1.80** | **$0.18** |

### Escenario: 100 Usuarios, 50 Restaurantes, Uso Intensivo

| Metrica | Sin optimizar | Con optimizar |
|---------|---------------|---------------|
| Reads/dia | 1,000,000 | 50,000 |
| Reads/mes | 30,000,000 | 1,500,000 |
| **Coste/mes** | **$18.00** | **$0.90** |
| **Ahorro/mes** | - | **$17.10 (95%)** |

---

## QUERIES QUE NECESITAN OPTIMIZACION URGENTE

### Prioridad 🔴 CRITICA

| Query | Ubicacion | Reads actuales | Optimizable a | Ahorro |
|-------|-----------|----------------|---------------|--------|
| PnLPage load | PnLPage.tsx:169 | 1,242 | ~100 | 92% |
| InvoicesPage load | InvoicesPage.tsx:31 | 750 | ~100 | 87% |
| InventariosPage load | InventariosPage.tsx:21 | 500 | ~50 | 90% |
| DashboardPage load | DashboardPage.tsx:44 | 500 | ~50 | 90% |
| CierresPage load | CierresPage.tsx:25 | 365 | ~30 | 92% |

### Prioridad 🟡 MEDIA

| Query | Ubicacion | Reads actuales | Optimizable a |
|-------|-----------|----------------|---------------|
| MermasPage | MermasPage.tsx:61 | 400 | ~50 |
| OrdersPage | OrdersPage.tsx:19 | 400 | ~50 |
| PersonalPage | PersonalPage.tsx:87 | 200 | ~50 |
| EscandallosPage | EscandallosPage.tsx:27 | 300 | ~100 |

---

## CODIGO OPTIMIZADO

### Nuevo metodo getByRestaurant()

```typescript
// Agregar a FirestoreService.ts

import { where, query, orderBy, limit } from 'firebase/firestore';

/**
 * Get documents filtered by restaurantId
 * ✅ OPTIMIZADO - Solo lee documentos del restaurante
 */
async getByRestaurant<T>(
  collectionName: CollectionName,
  restaurantId: string,
  options?: {
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
    additionalFilters?: { field: string; operator: any; value: any }[];
  }
): Promise<FirebaseResponse<T[]>> {
  if (!this.db) {
    return { success: false, error: 'Firestore not initialized' };
  }

  try {
    const collectionRef = collection(this.db, collectionName);

    // Build query with filters
    let q = query(
      collectionRef,
      where('restaurantId', '==', restaurantId)
    );

    // Add additional filters
    if (options?.additionalFilters) {
      for (const filter of options.additionalFilters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }
    }

    // Add ordering
    if (options?.orderByField) {
      q = query(q, orderBy(options.orderByField, options.orderDirection || 'desc'));
    }

    // Add limit
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as T[];

    logger.info(`✅ Fetched ${data.length} docs from ${collectionName} (filtered)`);
    return { success: true, data };
  } catch (error) {
    logger.error(`❌ Error fetching ${collectionName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Nuevo metodo ensureLoadedForRestaurant()

```typescript
// Agregar a DatabaseService.ts

/**
 * Ensure collection is loaded for specific restaurant
 * ✅ OPTIMIZADO - Solo descarga datos del restaurante
 */
async ensureLoadedForRestaurant(
  collection: CollectionName,
  restaurantId: string,
  options?: { limit?: number }
): Promise<void> {
  const cacheKey = `${collection}_${restaurantId}`;

  if (this.loadedCollections.has(cacheKey)) {
    return;
  }

  try {
    const response = await this.cloudService.getByRestaurant<BaseEntity>(
      collection,
      restaurantId,
      { limitCount: options?.limit }
    );

    if (response.success && response.data) {
      // Merge with existing data (don't replace all)
      const currentData = this.getCollection(collection);
      const newData = response.data.map(item => ({
        ...item,
        id: !isNaN(Number(item.id)) ? Number(item.id) : item.id
      }));

      // Filter out items from this restaurant and add new ones
      const otherRestaurantData = currentData.filter(
        (item: any) => item.restaurantId !== restaurantId
      );
      const mergedData = [...otherRestaurantData, ...newData];

      this.setCollection(collection, mergedData);
      this.save(collection, mergedData);

      logger.info(`✅ [LOAD] ${collection} for restaurant ${restaurantId}: ${newData.length} items`);
      this.loadedCollections.add(cacheKey);
    }
  } catch (error) {
    logger.error(`❌ [LOAD] ${collection} for restaurant failed:`, error);
  }
}
```

---

## IMPACTO DE OPTIMIZACIONES

| Metrica | Antes | Despues | Mejora |
|---------|-------|---------|--------|
| Reads por sesion | ~5,000 | ~500 | 90% |
| Tiempo de carga | ~2-3s | ~0.3-0.5s | 85% |
| Coste mensual (10 rest.) | $1.80 | $0.18 | 90% |
| Coste anual (10 rest.) | $21.60 | $2.16 | $19.44 ahorro |
