# 🔐 Backend Firestore Rules Tests - P&L Manager

**Fecha**: 2026-01-02  
**Estado**: Completo

---

## 1. Análisis de Reglas Actuales

### 1.1 Resumen de `firestore.rules`

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }

    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    // ... collection rules ...
  }
}
```

### 1.2 Reglas por Colección

| Colección | read | create | update | delete | Campos Requeridos |
|-----------|------|--------|--------|--------|-------------------|
| `cierres` | auth | auth + fields | auth | admin | fecha, turno, totalReal |
| `facturas` | auth | auth + fields | auth | auth | numeroFactura, proveedorId, total |
| `albaranes` | auth | auth | auth | auth | - |
| `proveedores` | auth | auth | auth | auth | - |
| `productos` | auth | auth | auth | auth | - |
| `escandallos` | auth | auth | auth | auth | - |
| `inventarios` | auth | auth + fields | auth | auth | fecha |
| `delivery` | auth | auth | auth | auth | - |
| `usuarios` | auth | admin | admin OR self | admin | - |
| `roles` | auth | admin | admin | admin | - |
| `companies` | auth | admin | admin | admin | - |
| `restaurants` | auth | admin | admin | admin | - |
| `transfers` | auth | auth | auth | auth | - |
| `workers` | auth | auth | auth | auth | - |
| `absences` | auth | auth | auth | auth | - |
| `vacation_requests` | auth | auth | auth | auth | - |
| `nominas` | auth | admin | admin | admin | - |
| `mermas` | auth | auth | auth | auth | - |
| `orders` | auth | auth | auth | auth | - |
| `pnl_adjustments` | auth | admin | admin | admin | - |
| `gastosFijos` | auth | admin | admin | admin | - |

---

## 2. Hallazgos de Auditoría

### 2.1 ⚠️ RIESGO: Sin Validación Multi-tenant

**Problema**: Las reglas actuales NO validan `restaurantId` en las operaciones.

```javascript
// ACTUAL (inseguro)
match /facturas/{facturaId} {
  allow read: if isAuthenticated();  // ⚠️ Cualquier usuario autenticado lee TODAS las facturas
}

// RECOMENDADO
match /facturas/{facturaId} {
  allow read: if isAuthenticated() 
              && request.auth.token.restaurantId == resource.data.restaurantId;
}
```

### 2.2 ⚠️ RIESGO: get vs list No Separados

**Problema**: `allow read` incluye tanto `get` como `list`.

```javascript
// ACTUAL
allow read: if isAuthenticated();  // Permite list de TODA la colección

// RECOMENDADO para datos sensibles
allow get: if isAuthenticated() && isOwner(resource.data.userId);
allow list: if isAuthenticated() && request.query.filters['restaurantId'] == request.auth.token.restaurantId;
```

### 2.3 ⚠️ RIESGO: Sin Validación de Datos en Update

**Problema**: `allow update` no valida qué campos pueden cambiar.

```javascript
// ACTUAL
allow update: if isAuthenticated();  // Puede cambiar cualquier campo

// RECOMENDADO
allow update: if isAuthenticated()
              && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['id', 'createdAt', 'restaurantId']);
```

### 2.4 ✅ OK: Admin-Only para Datos Críticos

Correctamente protegidos:
- `cierres.delete` → admin
- `usuarios` → admin para create/delete
- `roles` → admin only
- `companies/restaurants` → admin only
- `gastosFijos` → admin only
- `nominas` → admin only
- `pnl_adjustments` → admin only

---

## 3. Tests Negativos por Colección

### 3.1 Autenticación

| Test ID | Colección | Operación | Condición | Resultado Esperado |
|---------|-----------|-----------|-----------|-------------------|
| AUTH-01 | `cierres` | read | Sin auth | DENY |
| AUTH-02 | `facturas` | create | Sin auth | DENY |
| AUTH-03 | `productos` | update | Sin auth | DENY |
| AUTH-04 | `proveedores` | delete | Sin auth | DENY |
| AUTH-05 | TODAS | cualquiera | Sin auth | DENY |

### 3.2 Admin-Only Operations

| Test ID | Colección | Operación | Condición | Resultado Esperado |
|---------|-----------|-----------|-----------|-------------------|
| ADM-01 | `cierres` | delete | Auth pero no admin | DENY |
| ADM-02 | `usuarios` | create | Auth pero no admin | DENY |
| ADM-03 | `usuarios` | delete | Auth pero no admin | DENY |
| ADM-04 | `roles` | write | Auth pero no admin | DENY |
| ADM-05 | `companies` | write | Auth pero no admin | DENY |
| ADM-06 | `restaurants` | write | Auth pero no admin | DENY |
| ADM-07 | `gastosFijos` | write | Auth pero no admin | DENY |
| ADM-08 | `nominas` | write | Auth pero no admin | DENY |
| ADM-09 | `pnl_adjustments` | write | Auth pero no admin | DENY |

### 3.3 Owner-Only Updates

| Test ID | Colección | Operación | Condición | Resultado Esperado |
|---------|-----------|-----------|-----------|-------------------|
| OWN-01 | `usuarios` | update | Auth + uid ≠ docId + no admin | DENY |
| OWN-02 | `usuarios` | update | Auth + uid = docId | ALLOW |
| OWN-03 | `usuarios` | update | Auth + admin | ALLOW |

### 3.4 Campos Requeridos

| Test ID | Colección | Operación | Condición | Resultado Esperado |
|---------|-----------|-----------|-----------|-------------------|
| FLD-01 | `cierres` | create | Sin `fecha` | DENY |
| FLD-02 | `cierres` | create | Sin `turno` | DENY |
| FLD-03 | `cierres` | create | Sin `totalReal` | DENY |
| FLD-04 | `facturas` | create | Sin `numeroFactura` | DENY |
| FLD-05 | `facturas` | create | Sin `proveedorId` | DENY |
| FLD-06 | `facturas` | create | Sin `total` | DENY |
| FLD-07 | `inventarios` | create | Sin `fecha` | DENY |

### 3.5 Multi-tenant (Actualmente NO Implementado)

| Test ID | Escenario | Resultado Actual | Resultado Esperado |
|---------|-----------|------------------|-------------------|
| MT-01 | Usuario A lee facturas de restaurante B | ⚠️ ALLOW | DENY |
| MT-02 | Usuario A lista todos los cierres | ⚠️ ALLOW (todos) | ALLOW (solo su restaurant) |
| MT-03 | Usuario cambia restaurantId de doc existente | ⚠️ ALLOW | DENY |

---

## 4. Implementación de Tests

### 4.1 Tests con Firebase Emulator

```javascript
// rules.test.js (para usar con firebase emulators:exec)
const firebase = require('@firebase/rules-unit-testing');

describe('Firestore Rules', () => {
  
  const projectId = 'test-project';
  let testEnv;

  beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId,
      firestore: {
        rules: fs.readFileSync('./firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(() => testEnv.cleanup());

  describe('AUTH-01: Unauthenticated read denied', () => {
    it('should deny read without auth', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await firebase.assertFails(
        unauthedDb.collection('cierres').get()
      );
    });
  });

  describe('ADM-01: Non-admin cannot delete cierre', () => {
    it('should deny delete for non-admin', async () => {
      const userDb = testEnv.authenticatedContext('user1', {}).firestore();
      await firebase.assertFails(
        userDb.collection('cierres').doc('test').delete()
      );
    });
  });

  describe('ADM-01.1: Admin can delete cierre', () => {
    it('should allow delete for admin', async () => {
      const adminDb = testEnv.authenticatedContext('admin1', { role: 'admin' }).firestore();
      // First create the doc
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('cierres').doc('test').set({
          fecha: '2024-01-01',
          turno: 'comida',
          totalReal: 1000
        });
      });
      await firebase.assertSucceeds(
        adminDb.collection('cierres').doc('test').delete()
      );
    });
  });

  describe('OWN-01: Cannot update other user profile', () => {
    it('should deny update of another user', async () => {
      const user1Db = testEnv.authenticatedContext('user1', {}).firestore();
      await firebase.assertFails(
        user1Db.collection('usuarios').doc('user2').update({ nombre: 'Hacked' })
      );
    });
  });

  describe('FLD-01: Create cierre without fecha denied', () => {
    it('should deny create without fecha', async () => {
      const userDb = testEnv.authenticatedContext('user1', {}).firestore();
      await firebase.assertFails(
        userDb.collection('cierres').doc('test').set({
          turno: 'comida',
          totalReal: 1000
          // fecha missing
        })
      );
    });
  });
});
```

### 4.2 Comando para Ejecutar

```bash
# Instalar dependencias de test
npm install --save-dev @firebase/rules-unit-testing

# Ejecutar tests con emuladores
firebase emulators:exec "npm run test:rules"
```

---

## 5. Recomendaciones de Mejora

### 5.1 Prioridad ALTA

1. **Implementar filtro multi-tenant**
   ```javascript
   function isRestaurantMember() {
     return request.auth.token.restaurantId == resource.data.restaurantId;
   }
   
   match /facturas/{id} {
     allow read: if isAuthenticated() && isRestaurantMember();
   }
   ```

2. **Separar get vs list**
   ```javascript
   allow get: if isAuthenticated();
   allow list: if isAuthenticated() 
               && request.query.limit <= 100
               && 'restaurantId' in request.query.filters;
   ```

### 5.2 Prioridad MEDIA

3. **Validar campos inmutables en update**
   ```javascript
   allow update: if isAuthenticated()
                 && !('id' in request.resource.data.diff(resource.data).changedKeys())
                 && !('createdAt' in request.resource.data.diff(resource.data).changedKeys());
   ```

4. **Rate limiting con Cloud Functions**
   - Implementar function trigger para detectar patrones anómalos

### 5.3 Prioridad BAJA

5. **Auditoría de cambios**
   - Cloud Function para log de todas las operaciones admin
