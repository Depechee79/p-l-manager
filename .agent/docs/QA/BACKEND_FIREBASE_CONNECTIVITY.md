# 🔌 Backend Firebase Connectivity - P&L Manager

**Fecha**: 2026-01-02  
**Estado**: Verificación Documental Completa

---

## 1. Configuración Firebase

### 1.1 Archivos de Configuración

| Archivo | Ubicación | Estado |
|---------|-----------|--------|
| `firebase.json` | `/firebase.json` | ✅ Presente |
| `firestore.rules` | `/firestore.rules` | ✅ Presente (155 líneas) |
| `firestore.indexes.json` | `/firestore.indexes.json` | ✅ Presente (3 índices) |
| `firebase.config.ts` | `/src/config/firebase.config.ts` | ✅ Presente (84 líneas) |
| `.env` | `/.env` | ✅ Presente (469 bytes) |
| `.env.example` | `/.env.example` | ✅ Presente |

### 1.2 Variables de Entorno Requeridas

```bash
VITE_FIREBASE_API_KEY=<api_key>
VITE_FIREBASE_AUTH_DOMAIN=<project_id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project_id>
VITE_FIREBASE_STORAGE_BUCKET=<project_id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
VITE_FIREBASE_APP_ID=<app_id>
VITE_FIREBASE_MEASUREMENT_ID=<measurement_id>  # Opcional
```

### 1.3 Inicialización Firebase

```typescript
// src/config/firebase.config.ts

export const initializeFirebase = (): FirebaseApp => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    // Analytics si disponible
  }
  return app;
};

export const getFirestoreInstance = (): Firestore => {
  if (!db) {
    const firebaseApp = initializeFirebase();
    db = getFirestore(firebaseApp);
  }
  return db;
};

export const isFirebaseConfigured = (): boolean => {
  return (
    firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
    firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
  );
};
```

---

## 2. Configuración de Emuladores

```json
// firebase.json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true }
  }
}
```

### Comando para Arrancar Emuladores
```bash
firebase emulators:start
```

---

## 3. Procedimiento de Smoke Test

### 3.1 Prerequisitos
- [ ] `.env` configurado con credenciales válidas
- [ ] `npm install` completado
- [ ] Firebase CLI instalado (opcional para emuladores)

### 3.2 Pasos de Verificación

#### Paso 1: Verificar Configuración
```typescript
import { isFirebaseConfigured } from '@/config/firebase.config';

if (!isFirebaseConfigured()) {
  console.error('❌ Firebase not configured');
}
```

#### Paso 2: Test de Conexión
```typescript
import { FirestoreService } from './FirestoreService';

const firestore = new FirestoreService();
const result = await firestore.testConnection();

if (result.success) {
  console.log('✅ Firebase connected');
} else {
  console.error('❌ Connection failed:', result.error);
}
```

#### Paso 3: Operación Simple de Lectura
```typescript
const result = await firestore.getAll('proveedores');

if (result.success) {
  console.log(`✅ Read ${result.data?.length || 0} proveedores`);
} else {
  console.error('❌ Read failed:', result.error);
}
```

### 3.3 Diagnóstico de Errores Comunes

| Error | Causa Probable | Solución |
|-------|----------------|----------|
| `Firestore not initialized` | Credenciales inválidas | Verificar `.env` |
| `permission-denied` | Reglas de seguridad | Verificar auth o mode desarrollo |
| `Missing or insufficient permissions` | Usuario no autenticado | Implementar login o usar modo dev |
| `CORS error` | Dominio no autorizado | Añadir dominio en Firebase Console |
| `Network timeout` | Conectividad | Verificar firewall/proxy |

---

## 4. Test de Conectividad Existente

### Archivo: `FirestoreService.connection.test.ts`

```typescript
// src/services/FirestoreService.connection.test.ts

describe('FirestoreService Connection', () => {
  it('should verify Firebase is configured', () => {
    const configured = isFirebaseConfigured();
    expect(configured).toBe(true);
  });

  it('should successfully connect to Firestore', async () => {
    const result = await firestore.testConnection();
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });
});
```

### Ejecutar Tests de Conexión
```bash
npm run test -- --grep "Connection"
```

---

## 5. Logs de Conectividad

### Ubicación de Logs
- **Console del navegador**: Mensajes `[SYNC]`, `[LOAD]`, `[STARTUP]`
- **LoggerService**: Prefijos `✅`, `⚠️`, `❌`

### Ejemplo de Log Exitoso
```
🚀 [STARTUP] Loading critical configuration...
✅ [LOAD] companies: 2 items loaded
✅ [LOAD] restaurants: 3 items loaded
✅ [LOAD] roles: 4 items loaded
✅ [LOAD] usuarios: 5 items loaded
✅ [LOAD] gastosFijos: 8 items loaded
✅ [STARTUP] Critical configuration loaded
```

### Ejemplo de Log de Error
```
⚠️ [LOAD] cierres: Missing or insufficient permissions
❌ [SYNC] ADD cierres/1735818000001 failed after 4 attempts: permission-denied
```

---

## 6. Estado Actual

### ✅ Verificado en Código
- Configuración Firebase completa
- Inicialización lazy (on-demand)
- Retry logic con exponential backoff
- Logging completo
- Tests de integración existentes

### ⚠️ Requiere Verificación en Runtime
- Credenciales `.env` válidas (no inspeccionadas por seguridad)
- Reglas desplegadas en Firebase Console
- Índices desplegados

### 📋 Checklist de Verificación Runtime

- [ ] Ejecutar `npm run dev`
- [ ] Abrir app en navegador
- [ ] Verificar console: `[STARTUP] Critical configuration loaded`
- [ ] Navegar a una página con datos (ej: Proveedores)
- [ ] Verificar: datos cargados sin errores
- [ ] Crear/editar un registro
- [ ] Verificar console: `✅ [SYNC] ADD/UPDATE ... → Firebase`

---

## 7. Modo Desarrollo (Sin Auth)

Si `permission-denied` persiste sin auth implementada:

### Opción A: Reglas Abiertas (Solo Dev)
```javascript
// En Firebase Console > Firestore > Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Opción B: Usar Emuladores
```bash
firebase emulators:start
```

Luego configurar app para usar emuladores (requiere código adicional).
