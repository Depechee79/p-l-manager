# REGLA: Firebase

---

## Cuando aplica
- Firestore Database
- Firebase Authentication
- Cloud Functions
- Storage

---

## FIRESTORE: ESTRUCTURA

```typescript
// Colecciones en plural, documentos con ID
// /users/{userId}
// /users/{userId}/orders/{orderId}

// Interfaces tipadas
interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Converter para tipado
const userConverter: FirestoreDataConverter<User> = {
  toFirestore: (user) => ({ ...user }),
  fromFirestore: (snap) => ({ id: snap.id, ...snap.data() } as User),
};
```

---

## FIRESTORE: OPERACIONES

```typescript
// Lectura con tipo
const userRef = doc(db, 'users', id).withConverter(userConverter);
const userSnap = await getDoc(userRef);
const user = userSnap.data(); // Tipado como User

// Escritura
await setDoc(doc(db, 'users', id), {
  email,
  displayName,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

// Update parcial
await updateDoc(doc(db, 'users', id), {
  displayName: newName,
  updatedAt: serverTimestamp(),
});

// Queries
const q = query(
  collection(db, 'orders'),
  where('userId', '==', userId),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc'),
  limit(10)
);
```

---

## SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funciones helper
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }

    // Users: solo el propio usuario
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if isAuthenticated() && isOwner(userId);
    }

    // Orders: usuario propietario o admin
    match /orders/{orderId} {
      allow read: if isAuthenticated() &&
        (resource.data.userId == request.auth.uid || hasRole('admin'));
      allow create: if isAuthenticated() &&
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## AUTHENTICATION

```typescript
// Listener de auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuario logueado
    console.log('Logged in:', user.uid);
  } else {
    // Usuario no logueado
    console.log('Logged out');
  }
});

// Login
await signInWithEmailAndPassword(auth, email, password);

// Registro
await createUserWithEmailAndPassword(auth, email, password);

// Logout
await signOut(auth);

// Google Sign In
const provider = new GoogleAuthProvider();
await signInWithPopup(auth, provider);
```

---

## CLOUD FUNCTIONS

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// HTTP Function
export const api = functions.https.onRequest(async (req, res) => {
  // Validar metodo
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  // Procesar
  const result = await processData(req.body);
  res.json(result);
});

// Firestore Trigger
export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const user = snap.data();
    await sendWelcomeEmail(user.email);
  });
```

---

## ERRORES COMUNES

```typescript
// MAL: Sin manejo de errores
const doc = await getDoc(ref);
const data = doc.data(); // Puede ser undefined!

// BIEN: Verificar existencia
const doc = await getDoc(ref);
if (!doc.exists()) {
  throw new Error('Document not found');
}
const data = doc.data();

// MAL: Queries sin indice
// Firestore requiere indices compuestos para queries complejas
// Verificar consola de Firebase para crear indices necesarios
```

---

## Verificacion

- [ ] Security Rules configuradas?
- [ ] Converters con tipado?
- [ ] serverTimestamp() en fechas?
- [ ] Manejo de doc.exists()?
- [ ] Indices creados para queries?

