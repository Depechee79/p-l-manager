# AUDITORIA COMPLETA FIREBASE - P&L ANTIGRAVITY

**Fecha:** Enero 2026
**Proyecto:** pylhospitality
**Objetivo:** Migrar a arquitectura Cloud-First profesional

---

## RESUMEN EJECUTIVO

### Estado Actual
- **Arquitectura:** Local-First con Cloud Sync (datos pasan por memoria antes de Firebase)
- **Problema:** Posible desincronizacion si Firebase falla
- **Solucion:** Migrar a Cloud-First (Firebase como fuente de verdad)

### Metricas Clave

| Metrica | Valor |
|---------|-------|
| Colecciones en Firestore | 19 |
| Queries sin filtro restaurantId | 15+ |
| Indices existentes | 3 |
| Indices faltantes | 11 |
| Reglas de seguridad | Basicas (solo autenticacion) |

---

## 1. ARQUITECTURA DE DATOS

### Flujo Actual (Local-First)

```
Usuario crea dato
      |
      v
[1] Guarda en MEMORIA (instantaneo)
      |
      v
[2] Guarda en localStorage (backup)
      |
      v
[3] Envia a Firebase (asincrono)
      |
      v
[4] Si OK: _synced = true
    Si FALLA: reintenta (max 3 veces)
```

### Flujo Recomendado (Cloud-First)

```
Usuario crea dato
      |
      v
[1] UI muestra "Guardando..."
      |
      v
[2] Envia a Firebase (await)
      |
      v
[3] Firebase confirma -> "Guardado OK"
    Firebase falla -> "Error, reintentar?"
      |
      v
[4] Actualiza estado local
```

---

## 2. COLECCIONES FIRESTORE

### Listado Completo

| # | Coleccion | Campos Clave | Multi-tenant |
|---|-----------|--------------|--------------|
| 1 | companies | nombre | - |
| 2 | restaurants | nombre, companyId | Si |
| 3 | usuarios | nombre, rolId | - |
| 4 | roles | nombre, permisos | - |
| 5 | productos | nombre, proveedorId | No* |
| 6 | proveedores | nombre, cif | No* |
| 7 | facturas | numeroFactura, proveedorId, fecha, total, restaurantId | Si |
| 8 | albaranes | numeroFactura, proveedorId, fecha | No* |
| 9 | inventarios | fecha, productos, restaurantId | Si |
| 10 | cierres | fecha, turno, totalReal, restaurantId | Si |
| 11 | escandallos | nombre, pvpConIVA | No* |
| 12 | delivery | fecha, plataforma, restaurantId | Si |
| 13 | transfers | origenId, destinoId, items | Si |
| 14 | workers | nombre, companyId | Si |
| 15 | fichajes | workerId, date | Si |
| 16 | absences | workerId, startDate, endDate, type | Si |
| 17 | vacation_requests | workerId, startDate, endDate, daysCount | Si |
| 18 | nominas | mes, trabajadorId, importeBruto, restaurantId | Si |
| 19 | gastosFijos | tipo, descripcion, importeMensual, restaurantId | Si |
| 20 | mermas | fecha, productoId, restaurantId | Si |
| 21 | orders | fecha, proveedorId, restaurantId | Si |
| 22 | pnl_adjustments | period, amount, category, restaurantId | Si |

*No*: Deberia tener restaurantId pero no lo tiene actualmente

---

## 3. QUERIES PROBLEMATICAS

### Queries sin filtro por restaurantId

Estas queries cargan TODOS los documentos de la coleccion:

```typescript
// FirestoreService.ts - getAll()
const collectionRef = collection(this.db, collectionName);
const snapshot = await getDocs(collectionRef);
```

**Colecciones afectadas:**
- productos
- proveedores
- albaranes
- escandallos

**Impacto:**
- Cargan datos de TODOS los restaurantes
- Coste innecesario de reads
- Problemas de privacidad multi-tenant

### Solucion

Cambiar todas las queries a:

```typescript
const q = query(
  collection(this.db, collectionName),
  where('restaurantId', '==', currentRestaurantId),
  orderBy('fecha', 'desc'),
  limit(100)
);
```

---

## 4. INDICES FIRESTORE

### Indices Actuales (3)

| Coleccion | Campos | Estado |
|-----------|--------|--------|
| cierres | restaurantId + fecha | OK |
| facturas | restaurantId + fecha | OK |
| nominas | restaurantId + periodo | OK |

### Indices Faltantes (11)

#### Prioridad CRITICA

| Coleccion | Campos |
|-----------|--------|
| inventarios | restaurantId + fecha DESC |
| delivery | restaurantId + fecha DESC |
| mermas | restaurantId + fecha DESC |
| orders | restaurantId + fecha DESC |
| gastosFijos | restaurantId + tipo ASC |
| pnl_adjustments | restaurantId + period DESC |

#### Prioridad MEDIA

| Coleccion | Campos |
|-----------|--------|
| productos | proveedorId + nombre ASC |
| facturas | proveedorId + fecha DESC |
| workers | companyId + activo |
| fichajes | workerId + date DESC |
| absences | workerId + startDate DESC |

### Archivo firestore.indexes.json Recomendado

```json
{
  "indexes": [
    {
      "collectionGroup": "cierres",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "facturas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "nominas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "periodo", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "inventarios",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "delivery",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "mermas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "gastosFijos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "tipo", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "pnl_adjustments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "period", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "productos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "proveedorId", "order": "ASCENDING" },
        { "fieldPath": "nombre", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "facturas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "proveedorId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "workers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "companyId", "order": "ASCENDING" },
        { "fieldPath": "activo", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "fichajes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workerId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "absences",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workerId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## 5. REGLAS DE SEGURIDAD

### Analisis del firestore.rules Actual

| Aspecto | Estado | Problema |
|---------|--------|----------|
| Autenticacion | OK | Todas las rutas requieren auth |
| Validacion de campos | PARCIAL | Solo algunas colecciones validan |
| Aislamiento multi-tenant | NO | No verifica restaurantId del usuario |
| Roles granulares | NO | Solo admin vs authenticated |

### Vulnerabilidades Detectadas

1. **Cualquier usuario autenticado puede leer TODOS los datos**
   ```javascript
   allow read: if isAuthenticated(); // Muy permisivo
   ```

2. **No hay verificacion de propiedad**
   - Usuario de Restaurante A puede ver datos de Restaurante B

3. **Deletes permitidos sin restriccion**
   ```javascript
   allow delete: if isAuthenticated(); // En varias colecciones
   ```

### Reglas Recomendadas

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rolId == 'admin';
    }

    function hasRestaurantAccess(restaurantId) {
      return isAuthenticated() &&
             restaurantId in get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.restaurantIds;
    }

    function ownsDocument(restaurantId) {
      return hasRestaurantAccess(restaurantId);
    }

    // Facturas - con aislamiento multi-tenant
    match /facturas/{facturaId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Aplicar patron similar a todas las colecciones...
  }
}
```

---

## 6. ESTIMACION DE COSTES

### Escenario: 10 Restaurantes Activos

#### Reads Mensuales (Estimacion)

| Operacion | Frecuencia | Reads/mes |
|-----------|------------|-----------|
| Login + carga inicial | 300 usuarios x 20 dias | 6,000 |
| Navegacion entre secciones | 50 veces/dia x 20 dias x 10 rest | 10,000 |
| Consultas de datos | 100/dia x 20 dias x 10 rest | 20,000 |
| **TOTAL READS** | | **~36,000** |

#### Writes Mensuales (Estimacion)

| Operacion | Frecuencia | Writes/mes |
|-----------|------------|------------|
| Cierres de caja | 2/dia x 30 dias x 10 rest | 600 |
| Facturas | 5/dia x 20 dias x 10 rest | 1,000 |
| Inventarios | 1/semana x 4 sem x 10 rest | 40 |
| Fichajes | 20/dia x 20 dias x 10 rest | 4,000 |
| **TOTAL WRITES** | | **~5,640** |

#### Coste Mensual (Plan Spark - Gratis)

| Recurso | Gratis | Uso Estimado | Estado |
|---------|--------|--------------|--------|
| Reads | 50,000/dia | ~1,200/dia | OK |
| Writes | 20,000/dia | ~188/dia | OK |
| Deletes | 20,000/dia | ~50/dia | OK |
| Storage | 1 GB | ~100 MB | OK |

**Conclusion:** Con 10 restaurantes, el plan gratuito es SUFICIENTE.

#### Proyeccion a 100 Restaurantes

| Recurso | Uso Estimado | Coste Blaze |
|---------|--------------|-------------|
| Reads | ~12,000/dia | $0.036/dia |
| Writes | ~1,880/dia | $0.034/dia |
| Storage | ~1 GB | $0.18/mes |
| **TOTAL** | | **~$2.50/mes** |

---

## 7. PLAN DE IMPLEMENTACION

### Fase 1: Indices (Inmediato)

1. Copiar el archivo `firestore.indexes.json` recomendado
2. Ejecutar: `firebase deploy --only firestore:indexes`
3. Esperar 5-10 minutos para construccion

### Fase 2: Queries Optimizadas (1-2 dias)

1. Modificar `FirestoreService.ts` para aceptar filtros
2. Cambiar `getAll()` por `getByRestaurant(restaurantId)`
3. Anadir limits a todas las queries

### Fase 3: Cloud-First (2-3 dias)

1. Modificar `DatabaseService.ts`:
   - Firebase primero, local despues
   - Estados de loading/error
   - Feedback visual al usuario

2. Anadir componente de estado de sincronizacion

### Fase 4: Seguridad (1 dia)

1. Actualizar `firestore.rules` con aislamiento multi-tenant
2. Testear con Firebase Emulator
3. Deploy a produccion

---

## 8. CHECKLIST DE VERIFICACION

### Antes de Produccion

- [ ] Indices desplegados y en estado "Enabled"
- [ ] Queries filtran por restaurantId
- [ ] Reglas de seguridad verifican propiedad
- [ ] UI muestra estado de sincronizacion
- [ ] Errores se muestran al usuario
- [ ] Backup de datos existentes

### Monitoreo Post-Deploy

- [ ] Configurar alertas en Firebase Console
- [ ] Revisar metricas de reads/writes semanalmente
- [ ] Verificar que no hay errores en Cloud Functions (si aplica)

---

## ARCHIVOS CLAVE A MODIFICAR

| Archivo | Cambios |
|---------|---------|
| `firestore.indexes.json` | Anadir 11 indices nuevos |
| `firestore.rules` | Aislamiento multi-tenant |
| `src/core/services/DatabaseService.ts` | Cloud-First |
| `src/core/services/FirestoreService.ts` | Queries con filtros |
| Componentes de formularios | Estados loading/error |

---

## CONTACTO

Para dudas sobre esta auditoria o la implementacion:
- Revisar documentacion de Firebase: https://firebase.google.com/docs/firestore
- Firebase Console del proyecto: https://console.firebase.google.com

---

*Documento generado automaticamente. Ultima actualizacion: Enero 2026*
