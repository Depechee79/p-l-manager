---
name: firebase-guide
description: |
  P&L Manager Firebase architecture: collections, relationships, indexes, security rules, query patterns.
  USE WHEN working with Firestore, Cloud Functions, security rules, database queries,
  or when user says "firebase", "firestore", "coleccion", "query", "rules".
---

# Firebase Guide — P&L Manager

## FUENTE DE VERDAD

El contrato completo esta en `docs/contracts/FIREBASE_CONTRACT.md`.
**SIEMPRE leer el contrato antes de cualquier operacion Firebase.**

Este skill es una referencia rapida. Ante duda, el contrato prevalece.

---

## PROYECTO FIREBASE

- **Proyecto:** `pylhospitality`
- **Region Cloud Functions:** `europe-west1`
- **Emulador:** configurado para desarrollo local

---

## COLECCIONES — Referencia rapida

| Coleccion | Descripcion | Clave de relacion |
|-----------|-------------|-------------------|
| `productos` | Ingredientes y productos del restaurante | `proveedorId` FK a proveedores |
| `proveedores` | Proveedores del restaurante | 14 campos, `restaurantId` |
| `facturas` | Facturas de compra recibidas | `InvoiceProduct[]`, `proveedorId` |
| `albaranes` | Notas de entrega | Similar a facturas |
| `inventarios` | Conteos de stock periodicos | `InventoryProductCount[]` |
| `escandallos` | Recetas con coste calculado | `Ingredient[]`, margenes |
| `cierres` | Cierres de caja diarios | `Datafono[]`, `OtroMetodo[]`, `Delivery[]` |
| `usuarios` | Usuarios del sistema | `role` FK, `restaurantId` |
| `roles` | Roles y permisos configurables | `Permission[]` |
| `companies` | Empresas (multi-tenant root) | `restaurantIds[]` |
| `restaurants` | Restaurantes individuales | `companyId` FK |
| `workers` | Personal/plantilla | Fichajes, ausencias |
| `fichajes` | Registro de jornada laboral | Entradas/salidas por trabajador |
| `nominas` | Nominas mensuales | Calculos Seguridad Social |
| `gastosFijos` | Gastos fijos recurrentes | Tipo, importe, periodo |

---

## PATRON MULTI-RESTAURANTE

**CRITICO:** Toda query DEBE filtrar por `restaurantId`.

```typescript
// CORRECTO
const q = query(
  collection(db, 'productos'),
  where('restaurantId', '==', currentRestaurantId),
  limit(100)
);

// INCORRECTO — expone datos de otros restaurantes
const q = query(collection(db, 'productos'));
```

**Jerarquia de aislamiento:**
```
Company (empresa)
  └── Restaurant (restaurante)
        └── Todos los datos operativos (productos, cierres, etc.)
```

Un usuario puede pertenecer a multiples restaurantes de la misma empresa.
El `restaurantId` activo se gestiona via `RestaurantContext`.

---

## PATRONES DE QUERY OBLIGATORIOS

### Lectura con limit
```typescript
// SIEMPRE limit() en colecciones que pueden crecer
const q = query(
  collection(db, 'productos'),
  where('restaurantId', '==', restaurantId),
  orderBy('nombre'),
  limit(100)
);
```

### Real-time con cleanup
```typescript
useEffect(() => {
  const q = query(/* ... */);
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // handle data
    },
    (error) => {
      logError(error, 'products-listener');
      showToast.error('Error cargando productos');
    }
  );
  return () => unsubscribe(); // CLEANUP obligatorio
}, [restaurantId]);
```

### Bulk writes con writeBatch
```typescript
const batch = writeBatch(db);
items.forEach((item, index) => {
  if (index > 0 && index % 500 === 0) {
    // Firestore limit: 500 ops per batch
    await batch.commit();
    batch = writeBatch(db);
  }
  batch.set(doc(collection(db, 'productos')), item);
});
await batch.commit();
```

### Timestamps
```typescript
// En cliente
import { Timestamp } from 'firebase/firestore';
const data = { createdAt: Timestamp.now() };

// En Cloud Functions
import { FieldValue } from 'firebase-admin/firestore';
const data = { createdAt: FieldValue.serverTimestamp() };
```

---

## SECURITY RULES — Estructura

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny by default (implicit)

    // Helper functions
    function isAuthenticated() { ... }
    function isOwner(restaurantId) { ... }
    function hasRole(role) { ... }

    // Per-collection rules
    match /productos/{docId} {
      allow read: if isAuthenticated() && isOwner(resource.data.restaurantId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.restaurantId);
      allow update: if isAuthenticated() && isOwner(resource.data.restaurantId);
      allow delete: if isAuthenticated() && isOwner(resource.data.restaurantId) && hasRole('director');
    }
  }
}
```

**Principios:**
- Deny by default (Firestore ya lo hace, pero ser explicito)
- Ownership check: `restaurantId` del documento coincide con el del usuario
- Field whitelist en creates/updates cuando sea posible
- Deletes restringidos a roles de direccion
- NUNCA confiar solo en el cliente; rules son la primera linea de defensa

---

## INDICES — Referencia

Los indices compuestos estan en `firestore.indexes.json`.

**Cuando crear un indice nuevo:**
- Toda query con `where()` + `orderBy()` sobre campos distintos
- Toda query con multiples `where()` sobre campos distintos
- Firestore lanzara error en consola si falta un indice

**Deploy de indices:**
```bash
npx firebase deploy --only firestore:indexes --project pylhospitality
```

**Deploy de rules:**
```bash
npx firebase deploy --only firestore:rules --project pylhospitality
```

---

## CLOUD FUNCTIONS

- **Region:** `europe-west1` (siempre)
- **Runtime:** Node.js (version segun package.json de functions/)
- **Patron:** funciones idempotentes, error handling completo
- **Estado actual:** 0 funciones desplegadas (se anaden cuando proceda)

---

## PROHIBICIONES FIREBASE

| Prohibicion | Alternativa |
|-------------|-------------|
| Query sin `limit()` en colecciones grandes | Siempre `limit(N)` |
| `Promise.all(N updateDoc())` | `writeBatch` |
| `setInterval` para datos Firestore | `onSnapshot` |
| `onSnapshot` sin cleanup | Return `unsubscribe()` en useEffect |
| `onSnapshot` sin error callback | Segundo parametro con handler |
| Query sin `restaurantId` filter | SIEMPRE filtrar por restaurante |
| Secrets en codigo cliente | Variables de entorno / Cloud Functions |
| `getDocs` para datos que cambian en tiempo real | `onSnapshot` |

---

## REFERENCIA RAPIDA: DONDE LEER MAS

- **Contrato completo:** `docs/contracts/FIREBASE_CONTRACT.md`
- **Tipos de dominio:** `src/types/` (6 archivos)
- **Servicios Firebase:** `src/core/services/`
- **Contextos:** `src/core/context/` (DatabaseContext, RestaurantContext)
- **Hooks:** `src/core/hooks/` (useDatabase, useRestaurant)
- **Security rules:** `firestore.rules`
- **Indices:** `firestore.indexes.json`
