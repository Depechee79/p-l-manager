# Firebase Architecture Contract — P&L Antigravity

> **Project ID:** `pylhospitality`
> **Region:** `europe-west1` (for Cloud Functions when deployed)
> **Source of truth:** `firestore.rules`, `firestore.indexes.json`
> **Enforced by:** Supreme Rule Section "DATA Firebase"

---

## 1. Collections

### 1.1 Configuration Collections

| Collection | Description | Key Fields | Access |
|-----------|-------------|------------|--------|
| `companies` | Multi-tenant companies/groups | `name`, `restaurantIds[]`, `createdAt` | Auth read/write, Director delete |
| `restaurants` | Individual restaurants | `companyId` FK, `name`, `address`, `config` | Auth read/write, Director delete |
| `usuarios` | User accounts (primary) | `uid`, `email`, `rolId`, `restaurantId`, `restaurantIds[]` | Self-write, Director manage |
| `roles` | Role definitions | `id`, `nombre`, `nivel`, `permisos[]`, `accesoMultiRestaurante` | Auth read, Director write |
| `invitations` | Pending user invitations | `email`, `rolId`, `restaurantId`, `invitedBy`, `status` | Auth read/write, Director delete |

### 1.2 Operations Collections

| Collection | Description | Key Fields | Index |
|-----------|-------------|------------|-------|
| `cierres` | Daily cash closings | `restaurantId`, `fecha`, `efectivo`, `datafono[]`, `otrosMetodos[]`, `delivery[]` | `restaurantId` ASC + `fecha` DESC |
| `facturas` | Received invoices | `restaurantId`, `fecha`, `proveedorId`, `productos[]`, `total`, `iva` | `restaurantId` ASC + `fecha` DESC |
| `albaranes` | Delivery notes | `restaurantId`, `fecha`, `proveedorId`, `productos[]`, `total` | `restaurantId` ASC + `fecha` DESC |
| `inventarios` | Stock counts | `restaurantId`, `fecha`, `zona`, `productos[]`, `tipo` | `restaurantId` ASC + `fecha` DESC |
| `delivery` | Delivery platform income | `restaurantId`, `fecha`, `plataforma`, `importe` | `restaurantId` ASC + `fecha` DESC |
| `mermas` | Waste/shrinkage records | `restaurantId`, `fecha`, `producto`, `cantidad`, `motivo` | `restaurantId` ASC + `fecha` DESC |
| `orders` | Purchase orders | `restaurantId`, `fecha`, `proveedorId`, `productos[]`, `estado` | `restaurantId` ASC + `fecha` DESC |
| `transfers` | Inter-location transfers | `restaurantId`, `fecha`, `origen`, `destino`, `productos[]` | `restaurantId` ASC + `fecha` DESC |
| `gastosFijos` | Fixed expenses | `restaurantId`, `tipo`, `importe`, `periodo`, `descripcion` | `restaurantId` ASC + `tipo` ASC |
| `pnl_adjustments` | P&L manual adjustments | `restaurantId`, `fecha`, `tipo`, `importe`, `descripcion` | (same pattern) |

### 1.3 Shared Data Collections

| Collection | Description | Key Fields |
|-----------|-------------|------------|
| `productos` | Ingredients/products catalog | `nombre`, `categoria`, `unidad`, `proveedorId`, `precioUnitario`, `restaurantId` |
| `proveedores` | Suppliers | `nombre`, `cif`, `telefono`, `email`, `direccion`, `contacto`, `restaurantId` |
| `escandallos` | Recipes with costing | `nombre`, `categoria`, `ingredientes[]`, `rendimiento`, `costePorcion`, `margen` |

### 1.4 HR Collections

| Collection | Description | Key Fields |
|-----------|-------------|------------|
| `workers` | Staff members | `nombre`, `puesto`, `restaurantId`, `salario`, `fechaAlta` |
| `fichajes` | Time entries | `workerId`, `restaurantId`, `fecha`, `entrada`, `salida` |
| `absences` | Absences | `workerId`, `restaurantId`, `fecha`, `tipo`, `motivo` |
| `vacation_requests` | Vacation requests | `workerId`, `restaurantId`, `fechaInicio`, `fechaFin`, `estado` |
| `nominas` | Payroll records | `workerId`, `restaurantId`, `periodo`, `salarioBruto`, `retencion` |

---

## 2. Multi-Restaurant Architecture

### 2.1 Data Isolation

Every operational document **must** have a `restaurantId` field. This is the primary isolation mechanism.

```typescript
// CORRECT: Always filter by restaurantId
const q = query(
  collection(db, 'cierres'),
  where('restaurantId', '==', currentRestaurantId),
  orderBy('fecha', 'desc'),
  limit(50)
);

// WRONG: Never query without restaurant filter
const q = query(collection(db, 'cierres')); // FORBIDDEN
```

### 2.2 Access Control Helper

```typescript
// hasRestaurantAccess() in firestore.rules
function hasRestaurantAccess(restaurantId) {
  return isAuthenticated() && (
    isDirector() ||
    restaurantId in getUserData().restaurantIds ||
    getUserData().restaurantId == restaurantId
  );
}
```

### 2.3 User Restaurant Assignment

- `director_operaciones`: Access to ALL restaurants via `restaurantIds[]` array.
- `director_restaurante`: Access to their assigned restaurant via `restaurantId`.
- All other roles: Single `restaurantId` only.

---

## 3. Security Rules

### 3.1 Philosophy: Deny by Default

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // No match = denied (Firestore default)
  }
}
```

### 3.2 Core Helper Functions

| Function | Purpose |
|----------|---------|
| `isAuthenticated()` | `request.auth != null` |
| `getUserData()` | Reads user document from `usuarios/{uid}` |
| `isDirector()` | Checks for `director_operaciones`, `director_restaurante`, or `admin` role |
| `hasRestaurantAccess(restaurantId)` | Director OR user has restaurant in their assignments |
| `canAccessDocument()` | Director OR document's `restaurantId` is in user's list (with legacy null fallback) |
| `hasRequiredFields(fields)` | Validates that write includes specified field names |

### 3.3 Current Rules Pattern

> **NOTA (Sesion #007):** Las reglas fueron endurecidas. Las colecciones operativas ya usan `canAccessDocument()` + `hasRestaurantAccess()` en lugar del patron basico `isAuthenticated()`. Sesion #008 anadio ownership checks en `companies`, `restaurants` e `invitations`.

Operations collections follow this pattern (post-hardening):
```
allow read: if canAccessDocument();
allow create: if hasRestaurantAccess(request.resource.data.restaurantId);
allow update: if canAccessDocument();
allow delete: if isDirector() && canAccessDocument();
```

Sensitive collections (nominas) are Director-only for writes:
```
allow read: if canAccessDocument();
allow create, update, delete: if isDirector() && canAccessDocument();
```

Configuration collections (`companies`, `restaurants`, `invitations`) tienen ownership checks adicionales (Sesion #008).

### 3.4 Remaining Hardening (Planned)

- Add field-level validation with `hasRequiredFields()` on creates.
- Add `restaurantId` immutability check on updates (`request.resource.data.restaurantId == resource.data.restaurantId`).

---

## 4. Index Requirements

### 4.1 Compound Indexes

Every collection that uses `where('restaurantId', '==', ...) + orderBy('fecha', 'desc')` needs a compound index. Currently deployed indexes (in `firestore.indexes.json`):

| Collection | Fields | Status |
|-----------|--------|--------|
| `cierres` | `restaurantId` ASC + `fecha` DESC | Deployed |
| `facturas` | `restaurantId` ASC + `fecha` DESC | Deployed |
| `nominas` | `restaurantId` ASC + `periodo` DESC | Deployed |
| `inventarios` | `restaurantId` ASC + `fecha` DESC | Deployed |
| `delivery` | `restaurantId` ASC + `fecha` DESC | Deployed |
| `mermas` | `restaurantId` ASC + `fecha` DESC | Deployed |
| `orders` | `restaurantId` ASC + `fecha` DESC | Deployed |
| `albaranes` | `restaurantId` ASC + `fecha` DESC | Deployed |

### 4.2 Adding New Indexes

When adding a new query pattern:
1. Add the index to `firestore.indexes.json`.
2. Deploy: `npx firebase deploy --only firestore:indexes --project pylhospitality`
3. Wait for index to build before using the query in production.

---

## 5. Query Patterns

### 5.1 Always Use `limit()`

```typescript
// CORRECT
const q = query(collection(db, 'cierres'), where(...), orderBy(...), limit(50));

// WRONG — full collection scan
const q = query(collection(db, 'cierres'), where(...));
```

### 5.2 Pagination with Cursors

```typescript
// First page
const first = query(cierresRef, orderBy('fecha', 'desc'), limit(25));

// Next page
const next = query(cierresRef, orderBy('fecha', 'desc'), startAfter(lastDoc), limit(25));
```

### 5.3 Error Handling on Queries

```typescript
try {
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} catch (error: unknown) {
  logger.error('Failed to fetch cierres', { error, restaurantId });
  throw error; // Let the calling hook handle UI feedback
}
```

---

## 6. Write Patterns

### 6.1 Single Document Writes

```typescript
import { doc, setDoc, Timestamp } from 'firebase/firestore';

await setDoc(doc(db, 'cierres', cierreId), {
  ...cierreData,
  restaurantId: currentRestaurantId,  // ALWAYS include
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  createdBy: currentUser.uid,
});
```

### 6.2 Batch Writes (Bulk Operations)

```typescript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);
const MAX_BATCH = 500;

for (let i = 0; i < items.length; i += MAX_BATCH) {
  const chunk = items.slice(i, i + MAX_BATCH);
  const batchInstance = writeBatch(db);

  for (const item of chunk) {
    const ref = doc(db, 'productos', item.id);
    batchInstance.update(ref, { stock: item.newStock, updatedAt: Timestamp.now() });
  }

  await batchInstance.commit();
}
```

**Rules:**
- Use `writeBatch` for any operation touching 2+ documents atomically.
- Never use `Promise.all(items.map(item => updateDoc(...)))` — use batch.
- Max 500 operations per batch. Loop for larger sets.

### 6.3 Timestamps

- Always use `Timestamp.now()` for client-created timestamps.
- Use `serverTimestamp()` when server-generated time is critical.
- Never use `new Date()` for Firestore fields.

---

## 7. Realtime Listeners

### 7.1 When to Use `onSnapshot`

- Data that can change externally (e.g., another user modifying same restaurant's data).
- Dashboard KPIs that need live updates.
- Any list view where multiple users might be editing.

### 7.2 Cleanup Pattern

```typescript
useEffect(() => {
  const q = query(collection(db, 'cierres'), where('restaurantId', '==', rid), limit(50));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCierres(data);
      setLoading(false);
    },
    (error) => {
      logger.error('Realtime listener error', { error, collection: 'cierres' });
      setError('Error al cargar los cierres');
      setLoading(false);
    }
  );

  return () => unsubscribe(); // ALWAYS cleanup
}, [rid]);
```

**Rules:**
- Always return `unsubscribe` in `useEffect` cleanup.
- Always provide error callback (second argument to `onSnapshot`).
- Never leave listeners dangling.

---

## 8. Cloud Functions (Future)

### 8.1 Configuration

- **Region:** `europe-west1`
- **Runtime:** Node.js 20
- **Secrets:** Use `defineSecret()` for API keys (e.g., Claude API key for OCR).

### 8.2 Design Principles

- **Idempotent:** Running the same function twice with the same input produces the same result.
- **Single responsibility:** One function, one job.
- **Error handling:** Always catch, log, and return appropriate HTTP status.

### 8.3 Planned Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `processDocument` | HTTP callable | Send image to Claude Vision API for document recognition |
| `calculateDailyReport` | Scheduled (daily) | Aggregate day's data into director summary |
| `sendNotification` | Firestore trigger | Notify director of anomalies (e.g., cash variance) |

---

## 9. Cost Optimization

- **Never** read full collections. Always use `where()` + `limit()`.
- **Never** use `onSnapshot` without `limit()` on large collections.
- **Prefer** `getDocs` over `onSnapshot` for data that rarely changes (e.g., `proveedores`).
- **Cache** infrequently changing data in-memory (roles, restaurant config).
- **Denormalize** when it avoids a join. Firestore charges per read, not per field.
- **Use** compound queries instead of client-side filtering.

---

## 10. Verification Checklist

Before any PR touching Firebase:

- [ ] All queries include `restaurantId` filter (multi-restaurant isolation)
- [ ] All queries include `limit()` clause
- [ ] Compound queries have matching index in `firestore.indexes.json`
- [ ] Write operations use `writeBatch` for multi-document updates
- [ ] Timestamps use `Timestamp.now()` (not `new Date()`)
- [ ] `onSnapshot` listeners have cleanup in `useEffect` return
- [ ] `onSnapshot` listeners have error callback
- [ ] Error handling: `catch(error: unknown)` with `logger.error()`
- [ ] Security rules reviewed for new collections/operations
- [ ] No full collection scans (no queries without `where` + `limit`)
