# ⚠️ Backend Risk Register - P&L Manager

**Fecha**: 2026-01-02  
**Estado**: Completo

---

## Resumen de Riesgos

| ID | Riesgo | Impacto | Probabilidad | Prioridad |
|----|--------|---------|--------------|-----------|
| RISK-01 | Multi-tenant no validado en rules | CRÍTICO | ALTA | 🔴 P1 |
| RISK-02 | Sin autenticación real implementada | ALTO | ALTA | 🔴 P1 |
| RISK-03 | List queries sin límite | MEDIO | MEDIA | 🟡 P2 |
| RISK-04 | Campos inmutables no protegidos | MEDIO | BAJA | 🟡 P2 |
| RISK-05 | OCR service con llamadas externas | BAJO | BAJA | 🟢 P3 |
| RISK-06 | DatabaseService complejidad alta | MEDIO | MEDIA | 🟡 P2 |
| RISK-07 | Índices pendientes de deploy | ALTO | MEDIA | 🟡 P2 |

---

## Detalle de Riesgos

### RISK-01: Multi-tenant No Validado en Rules

**Descripción**: Las reglas de Firestore actuales NO validan que el usuario solo acceda a datos de su restaurante/empresa.

**Evidencia**:
```javascript
// firestore.rules L33-38
match /facturas/{facturaId} {
  allow read: if isAuthenticated();  // ⚠️ Lee CUALQUIER factura
}
```

**Impacto**: 
- CRÍTICO
- Fuga de datos entre restaurantes
- Violación de privacidad/GDPR

**Mitigación**:
```javascript
match /facturas/{facturaId} {
  allow read: if isAuthenticated() 
              && request.auth.token.restaurantId == resource.data.restaurantId;
}
```

**PR Atómico**: `SEC-001: Add restaurantId validation to all collection rules`

---

### RISK-02: Sin Autenticación Real Implementada

**Descripción**: La app actualmente funciona sin sistema de login. Las reglas asumen `request.auth` pero no hay flujo OAuth/Email.

**Evidencia**:
- No existe `/src/pages/LoginPage.tsx`
- `.agent/FIREBASE_RULES.md` L232: "Actualmente la app no tiene login implementado"

**Impacto**:
- ALTO
- Cualquier persona puede acceder a la app
- Rules `isAuthenticated()` no se aplican

**Mitigación**:
1. Implementar Firebase Auth (Email/Password o OAuth)
2. Crear ProtectedRoute wrapper
3. Actualizar context con usuario autenticado

**PR Atómico**: `AUTH-001: Implement Firebase Authentication flow`

---

### RISK-03: List Queries Sin Límite

**Descripción**: Las reglas permiten `getAll()` sin límite de resultados.

**Evidencia**:
```javascript
// FirestoreService.ts L221-223
const collectionRef = collection(this.db, collectionName);
const snapshot = await getDocs(collectionRef);  // Sin .limit()
```

**Impacto**:
- MEDIO
- Descarga de base de datos completa posible
- Costos Firebase elevados
- Performance degradada

**Mitigación**:
```javascript
// En rules
allow list: if request.query.limit <= 50;

// En FirestoreService.ts
const q = query(collectionRef, limit(50));
const snapshot = await getDocs(q);
```

**PR Atómico**: `PERF-001: Add pagination and query limits`

---

### RISK-04: Campos Inmutables No Protegidos

**Descripción**: Las reglas permiten modificar campos que deberían ser inmutables (`id`, `createdAt`, `restaurantId`).

**Evidencia**:
```javascript
// firestore.rules L36
allow update: if isAuthenticated();  // Puede cambiar CUALQUIER campo
```

**Impacto**:
- MEDIO
- Corrupción de integridad referencial
- Manipulación de timestamps de auditoría

**Mitigación**:
```javascript
allow update: if isAuthenticated()
              && !request.resource.data.diff(resource.data).affectedKeys()
                  .hasAny(['id', 'createdAt', 'restaurantId']);
```

**PR Atómico**: `SEC-002: Protect immutable fields in update rules`

---

### RISK-05: OCR Service con Llamadas Externas

**Descripción**: El servicio OCR (27KB) hace llamadas a APIs externas para procesamiento de imágenes.

**Evidencia**:
- `/src/services/ocr-service.ts` (26936 bytes)
- Posibles llamadas a servicios de OCR externos

**Impacto**:
- BAJO
- Dependencia de servicios externos
- Posible exposición de datos de facturas

**Mitigación**:
1. Auditar endpoints externos usados
2. Validar que datos sensibles no se transmiten innecesariamente
3. Considerar Cloud Vision API con proyecto Firebase propio

**PR Atómico**: `SEC-003: Audit OCR service external dependencies`

---

### RISK-06: DatabaseService Complejidad Alta

**Descripción**: DatabaseService.ts tiene 815 líneas con lógica compleja de sync, merge, y validación.

**Evidencia**:
```
/src/core/services/DatabaseService.ts - 815 líneas
- Hybrid local-first + cloud sync
- 23 colecciones
- Foreign key validation
- Retry logic con exponential backoff
- Merge conflict resolution
```

**Impacto**:
- MEDIO
- Bugs difíciles de detectar
- Mantenibilidad reducida
- Testing complejo

**Mitigación**:
1. Extraer SyncService separado
2. Extraer ValidationService separado
3. Aumentar cobertura de tests unitarios
4. Documentar flujos de datos

**PR Atómico**: `REFACTOR-001: Split DatabaseService into focused services`

---

### RISK-07: Índices Pendientes de Deploy

**Descripción**: Los índices definidos en `firestore.indexes.json` deben estar desplegados en Firebase Console.

**Evidencia**:
```json
// firestore.indexes.json
{
  "indexes": [
    { "collectionGroup": "cierres", ... },
    { "collectionGroup": "facturas", ... },
    { "collectionGroup": "nominas", ... }
  ]
}
```

**Impacto**:
- ALTO si no desplegados
- Queries con error "Missing required index"
- Data no accesible

**Mitigación**:
```bash
firebase deploy --only firestore:indexes
```

**Verificación**:
1. Firebase Console > Firestore > Indexes
2. Verificar que los 3 índices aparecen

**PR Atómico**: N/A - Operación de deployment

---

## Observabilidad

### Puntos de Observación de Errores

| Ubicación | Qué Observar |
|-----------|--------------|
| Console del navegador | Mensajes `❌ [SYNC]`, `⚠️ [LOAD]` |
| LoggerService | Prefijos de error con stack trace |
| Firebase Console > Firestore | Requests rechazados, usage |
| Firebase Console > Rules Playground | Test de rules específicas |
| Network tab | Responses 403, 400, 500 de Firestore |

### Logging Mínimo Viable

Actualmente implementado en `LoggerService.ts`:
```typescript
export const logger = {
  info: (msg: string, ...args: any[]) => console.log(`✅ ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`⚠️ ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`❌ ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => console.debug(`🔍 ${msg}`, ...args),
};
```

### Propuesta de Mejora (Sin CODE_CHANGE)

1. **Estructurar logs como JSON** para parsing:
   ```typescript
   logger.error(JSON.stringify({
     level: 'error',
     service: 'DatabaseService',
     operation: 'syncToCloud',
     collection: 'facturas',
     docId: 'xxx',
     error: message,
     timestamp: new Date().toISOString()
   }));
   ```

2. **Integrar con Firebase Crashlytics** (requiere setup)

3. **Crear dashboard de health** con métricas:
   - Sync success rate
   - Avg sync latency
   - Failed operations queue

---

## Plan de Acción

| Prioridad | Riesgo | Acción | Owner | Status |
|-----------|--------|--------|-------|--------|
| 🔴 P1 | RISK-01 | Add multi-tenant validation | Backend | Pendiente |
| 🔴 P1 | RISK-02 | Implement Firebase Auth | Frontend | Pendiente |
| 🟡 P2 | RISK-03 | Add query pagination | Backend | Pendiente |
| 🟡 P2 | RISK-04 | Protect immutable fields | Backend | Pendiente |
| 🟡 P2 | RISK-06 | Refactor DatabaseService | Backend | Pendiente |
| 🟡 P2 | RISK-07 | Deploy Firestore indexes | DevOps | Pendiente |
| 🟢 P3 | RISK-05 | Audit OCR service | Security | Pendiente |
