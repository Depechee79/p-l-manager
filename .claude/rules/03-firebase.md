---
description: "Firebase patterns. Firestore queries, rules, multi-restaurant, Cloud Functions."
paths:
  - "src/core/services/**/*"
  - "src/config/**/*"
  - "firestore.rules"
  - "firestore.indexes.json"
  - "firebase.json"
---

# Firebase Rules -- P&L Manager

## Project Configuration

- **Project ID:** pylhospitality
- **Region:** europe-west1 (for Cloud Functions and Storage)
- **Environment variables:** `.env` with `VITE_FIREBASE_*` prefix
- **Config file:** `src/config/firebase.config.ts`

## Firestore Initialization

### Singleton Pattern

Always obtain the Firestore instance inside function bodies via `getFirestoreInstance()`. Never at module level.

```typescript
// src/config/firebase.config.ts
import { getFirestore, Firestore } from 'firebase/firestore';
import { app } from './firebase.app';

let firestoreInstance: Firestore | null = null;

export function getFirestoreInstance(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}
```

```typescript
// CORRECT -- inside function body
export async function getProductos(restaurantId: string): Promise<Producto[]> {
  const db = getFirestoreInstance();
  const ref = collection(db, 'productos');
  // ...
}

// WRONG -- module-level
const db = getFirestoreInstance();
```

## Multi-Restaurant Architecture

### Document Structure

Every business document MUST include a `restaurantId` field for multi-tenant isolation.

```typescript
interface FirestoreDocument {
  id: string;
  restaurantId: string;  // REQUIRED on all business documents
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Query Pattern

Always filter by `restaurantId` first:

```typescript
const q = query(
  collection(db, 'productos'),
  where('restaurantId', '==', restaurantId),
  orderBy('nombre'),
  limit(50)
);
```

### Security Rules

Rules MUST enforce `restaurantId` ownership:

```
match /productos/{productoId} {
  allow read, write: if request.auth != null
    && hasRestaurantAccess(request.auth.uid, resource.data.restaurantId);
}
```

## Collections Reference

### Core Business Collections

| Collection       | Description                    | Key Fields                           |
|------------------|--------------------------------|--------------------------------------|
| `productos`      | Product catalog                | nombre, categoria, precio, restaurantId |
| `proveedores`    | Supplier directory             | nombre, cif, contacto, restaurantId  |
| `facturas`       | Supplier invoices              | proveedorId, total, fecha, restaurantId |
| `albaranes`      | Delivery notes                 | proveedorId, facturaId, restaurantId |
| `inventarios`    | Inventory snapshots            | fecha, items[], restaurantId         |
| `escandallos`    | Recipe cost calculations       | productoId, ingredientes[], restaurantId |
| `cierres`        | Daily/period closings          | fecha, totals, restaurantId          |

### HR and Operations Collections

| Collection       | Description                    | Key Fields                           |
|------------------|--------------------------------|--------------------------------------|
| `usuarios`       | App users                      | email, role, restaurantId            |
| `roles`          | Role definitions               | nombre, permisos[], restaurantId     |
| `companies`      | Company entities               | nombre, cif, direccion               |
| `restaurants`    | Restaurant profiles            | nombre, companyId, config            |
| `workers`        | Employee records               | nombre, puesto, restaurantId         |
| `fichajes`       | Time clock entries             | workerId, entrada, salida, restaurantId |
| `nominas`        | Payroll records                | workerId, mes, bruto, neto, restaurantId |
| `gastosFijos`    | Fixed expenses                 | concepto, importe, periodicidad, restaurantId |

## Query Best Practices

### Always Use limit()

Never fetch unbounded collections. Always apply `limit()`:

```typescript
// CORRECT
const q = query(
  collection(db, 'productos'),
  where('restaurantId', '==', restaurantId),
  limit(100)
);

// WRONG -- unbounded query
const q = query(
  collection(db, 'productos'),
  where('restaurantId', '==', restaurantId)
);
```

### Compound Indexes

When combining `where()` with `orderBy()`, a compound index is required:

```typescript
// Requires compound index: restaurantId ASC, fecha DESC
const q = query(
  collection(db, 'facturas'),
  where('restaurantId', '==', restaurantId),
  orderBy('fecha', 'desc'),
  limit(50)
);
```

Document required indexes in `firestore.indexes.json`. If a query fails with a missing index error, add the index before proceeding.

### Pagination

Use cursor-based pagination with `startAfter()`:

```typescript
const firstPage = query(
  collection(db, 'productos'),
  where('restaurantId', '==', restaurantId),
  orderBy('nombre'),
  limit(25)
);

// Next page
const nextPage = query(
  collection(db, 'productos'),
  where('restaurantId', '==', restaurantId),
  orderBy('nombre'),
  startAfter(lastDoc),
  limit(25)
);
```

## Write Operations

### Batch Writes

Use `writeBatch()` for bulk operations. Maximum 500 operations per batch.

```typescript
const db = getFirestoreInstance();
const batch = writeBatch(db);

items.forEach((item) => {
  const ref = doc(collection(db, 'productos'));
  batch.set(ref, prepareForFirestore(item));
});

await batch.commit();
```

### Data Preparation

Always sanitize data before writing with `prepareForFirestore()`:

```typescript
export function prepareForFirestore<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return {
    ...cleaned,
    updatedAt: serverTimestamp(),
  };
}
```

**Rules:**
- Strip `undefined` values (Firestore rejects them).
- Always set `updatedAt` with `serverTimestamp()`.
- Set `createdAt` with `serverTimestamp()` on new documents.
- Use `serverTimestamp()` instead of `new Date()` for consistency.

### Timestamps

- **Read:** Firestore returns `Timestamp` objects. Convert with `timestamp.toDate()`.
- **Write:** Use `serverTimestamp()` for server-side timestamps.
- **Display:** Convert to locale string via `formatDateLocale()` utility.

## Realtime Listeners

### onSnapshot Pattern

Always clean up listeners in `useEffect` return and handle errors:

```typescript
useEffect(() => {
  const db = getFirestoreInstance();
  const q = query(
    collection(db, 'productos'),
    where('restaurantId', '==', restaurantId),
    limit(100)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Producto[];
      setProductos(items);
      setLoading(false);
    },
    (error) => {
      logError(error, 'onSnapshot:productos');
      showToast.error('Error loading products');
      setLoading(false);
    }
  );

  return unsubscribe;
}, [restaurantId]);
```

**Rules:**
- ALWAYS return the unsubscribe function from useEffect.
- ALWAYS provide an error callback (second argument to onSnapshot).
- ALWAYS set loading to false in both success and error paths.

## Security Rules Structure

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Deny by default
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function hasRestaurantAccess(userId, restaurantId) {
      return exists(/databases/$(database)/documents/usuarios/$(userId))
        && get(/databases/$(database)/documents/usuarios/$(userId)).data.restaurantId == restaurantId;
    }

    // Collection rules
    match /productos/{productoId} {
      allow read: if isAuthenticated()
        && hasRestaurantAccess(request.auth.uid, resource.data.restaurantId);
      allow create: if isAuthenticated()
        && hasRestaurantAccess(request.auth.uid, request.resource.data.restaurantId);
      allow update: if isAuthenticated()
        && hasRestaurantAccess(request.auth.uid, resource.data.restaurantId);
      allow delete: if isAuthenticated()
        && hasRestaurantAccess(request.auth.uid, resource.data.restaurantId);
    }
  }
}
```

**Rules:**
- Deny by default at the top level.
- Every collection has explicit read/write rules.
- Authentication check on every rule.
- Ownership verification via `hasRestaurantAccess()`.
- Field validation on creates and updates where appropriate.

## Cloud Functions (Future)

When Cloud Functions are added:

- **Region:** `europe-west1`
- **Runtime:** Node.js 20+
- **Secrets:** Use `defineSecret()`, never hardcode.
- **Idempotency:** Every function MUST be idempotent (safe to retry).
- **Error handling:** Try/catch with structured logging.
- **Timeout:** Set explicit timeouts per function.

## Claude API Vision for Documents

OCR/document processing uses Cloud Functions with the Anthropic SDK (Claude Vision API), replacing client-side Tesseract.js:

- Upload document to Firebase Storage.
- Cloud Function triggers on upload.
- Function calls Claude API with the image.
- Extracted data is written to Firestore.

## Storage Rules

File paths follow the pattern:

```
/{entity}/{restaurantId}/{subpath}/{filename}

Examples:
/facturas/rest_001/2024-01/factura_001.pdf
/albaranes/rest_001/2024-01/albaran_001.jpg
/logos/rest_001/logo.png
```

**Rules:**
- Always include `restaurantId` in the path for isolation.
- Use meaningful entity prefixes.
- Include date-based subpaths for time-series documents.

## Environment Variables

All Firebase config is loaded from `.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=pylhospitality
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Rules:**
- Never commit `.env` to git.
- `.env.example` documents required variables (without values).
- Access via `import.meta.env.VITE_FIREBASE_*`.
