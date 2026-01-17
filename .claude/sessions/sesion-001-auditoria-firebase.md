# SESION 001: AUDITORIA FIREBASE + PLAN DE CORRECCIONES

**Fecha:** 2026-01-17
**Duracion:** ~2 horas
**Estado:** CODIGO APLICADO - PENDIENTE DEPLOY

---

## RESUMEN EJECUTIVO

El usuario (director de restaurante, no desarrollador) pidio auditar P&L Antigravity para entender como funcionan los datos y asegurar que TODO va a Firebase correctamente.

**Resultado:** Se detectaron 4 deficiencias criticas y se corrigieron en el codigo. Falta que el usuario ejecute el deploy a Firebase.

---

## CONTEXTO INICIAL

- **Proyecto:** P&L Antigravity (app de gestion para restaurantes)
- **Stack:** React + Firebase/Firestore
- **Problema reportado:** Usuario no entendia si los datos iban a Firebase o se quedaban en local

---

## AUDITORIA REALIZADA

### Hallazgos

| # | Problema | Severidad | Estado |
|---|----------|-----------|--------|
| 1 | Reglas de seguridad permisivas (cualquier usuario ve todo) | CRITICO | CORREGIDO |
| 2 | Queries sin filtro por restaurantId (alto coste + privacidad) | CRITICO | CORREGIDO |
| 3 | Faltan 11 indices (queries lentas) | ALTO | CORREGIDO |
| 4 | Arquitectura Local-First | MEDIO | YA ERA CLOUD-FIRST |

### Descubrimiento importante
La arquitectura Cloud-First **YA ESTABA IMPLEMENTADA** en `DatabaseService.ts`. Los datos SI van a Firebase primero. El problema era solo de seguridad y optimizacion.

---

## CAMBIOS APLICADOS AL CODIGO

### 1. firestore.rules (MODIFICADO)
**Ubicacion:** `C:\Users\AITOR\Desktop\P&L Antigravity\firestore.rules`

**Cambios:**
- Agregadas funciones `getUserData()`, `hasRestaurantAccess()`, `ownsDocument()`
- Cada coleccion ahora verifica que el usuario tenga acceso al restaurante
- Solo admins pueden eliminar documentos
- Validacion de campos obligatorios en creates

**Antes:**
```javascript
allow read: if isAuthenticated(); // Cualquiera ve todo
```

**Despues:**
```javascript
allow read: if ownsDocument(resource.data.restaurantId); // Solo tu restaurante
```

### 2. firestore.indexes.json (MODIFICADO)
**Ubicacion:** `C:\Users\AITOR\Desktop\P&L Antigravity\firestore.indexes.json`

**Cambios:**
- Antes: 3 indices
- Despues: 15 indices (12 nuevos)

**Indices agregados:**
- inventarios (restaurantId + fecha)
- delivery (restaurantId + fecha)
- mermas (restaurantId + fecha)
- orders (restaurantId + fecha)
- albaranes (restaurantId + fecha)
- gastosFijos (restaurantId + tipo)
- pnl_adjustments (restaurantId + period)
- productos (proveedorId + nombre)
- facturas (proveedorId + fecha)
- workers (companyId + activo)
- fichajes (workerId + date)
- absences (workerId + startDate)

### 3. FirestoreService.ts (MODIFICADO)
**Ubicacion:** `C:\Users\AITOR\Desktop\P&L Antigravity\src\core\services\FirestoreService.ts`

**Cambios:**
- Agregado metodo `getByRestaurant()` - filtra por restaurante + ordena + limita
- Agregado metodo `getByWorker()` - para colecciones de RRHH
- Agregado metodo `getByCompany()` - para datos compartidos
- Agregado metodo `getWithQuery()` - queries personalizadas
- Validacion de `restaurantId` obligatorio en `add()` para colecciones filtradas
- Timestamps automaticos (`createdAt`, `updatedAt`)
- Warning cuando se usa `getAll()` en colecciones que deberian filtrarse

**Nuevo metodo principal:**
```typescript
async getByRestaurant<T>(
  collectionName: CollectionName,
  restaurantId: string,
  options?: { orderByField?, orderDirection?, limitCount?, filters? }
): Promise<FirebaseResponse<T[]>>
```

---

## DOCUMENTACION GENERADA

### Carpeta: `firebase-fix-plan/`

```
firebase-fix-plan/
├── README.md                      # Resumen + cronograma
├── 01-CRITICO-seguridad.md        # Guia paso a paso reglas
├── 02-CRITICO-queries.md          # Guia paso a paso queries
├── 03-ALTO-indices.md             # Guia paso a paso indices
├── 04-ALTO-cloud-first.md         # Verificacion arquitectura
├── COMANDOS-FINALES.md            # Comandos para deploy
├── CODIGOS/
│   ├── firestore.rules.NUEVO
│   ├── firestore.indexes.json.NUEVO
│   └── FirestoreService.ts.NUEVO
├── VALIDACION/
│   ├── checklist-testing.md       # 34 tests con checkboxes
│   └── casos-de-prueba.md         # 10 escenarios detallados
└── ROLLBACK/
    └── plan-emergencia.md         # 5 niveles de recuperacion
```

### Carpeta: `firebase-audit-report/`

```
firebase-audit-report/
├── 03-INDICES.md                  # Analisis de indices (pre-existente)
└── AUDITORIA-COMPLETA.md          # Reporte completo de auditoria
```

---

## PENDIENTE - ACCION DEL USUARIO

### El usuario DEBE ejecutar estos comandos:

```bash
cd "C:\Users\AITOR\Desktop\P&L Antigravity"
firebase login
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

### Por que no lo puede hacer Claude:
- Requiere credenciales de Google del usuario
- Es operacion de seguridad que solo el owner puede ejecutar
- Firebase CLI necesita autenticacion interactiva

### Alternativa sin terminal:
1. Ir a https://console.firebase.google.com
2. Firestore > Rules > Copiar contenido de firestore.rules > Publicar
3. Firestore > Indexes > Crear cada indice manualmente

---

## ESTADO FINAL DE LA SESION

| Componente | Estado |
|------------|--------|
| Codigo fuente | MODIFICADO Y GUARDADO |
| Firebase (nube) | PENDIENTE DEPLOY |
| App funcionando | SI (con version vieja de reglas) |
| Bloqueo para desarrollo | NO |

---

## PARA LA PROXIMA SESION

### Si el usuario NO hizo el deploy:
1. Preguntar si ejecuto los comandos de Firebase
2. Si no, guiarle paso a paso
3. Si hay errores, usar plan de rollback

### Si el usuario SI hizo el deploy:
1. Verificar que todo funciona
2. Continuar con nuevas funcionalidades

### Comandos de verificacion:
```bash
firebase firestore:indexes  # Debe mostrar 15 indices
```

---

## ARCHIVOS CLAVE MODIFICADOS

| Archivo | Lineas | Cambio principal |
|---------|--------|------------------|
| `firestore.rules` | 235 | Aislamiento multi-tenant |
| `firestore.indexes.json` | 125 | 12 indices nuevos |
| `FirestoreService.ts` | 623 | Metodos getByRestaurant, getByWorker, etc. |

---

## NOTAS TECNICAS

### Colecciones que requieren filtro por restaurantId:
- facturas, albaranes, inventarios, cierres, delivery
- mermas, orders, gastosFijos, pnl_adjustments, nominas

### Colecciones compartidas (sin filtro):
- productos, proveedores, escandallos
- companies, restaurants, usuarios, roles

### Colecciones de RRHH (filtro por workerId):
- workers, fichajes, absences, vacation_requests

---

## METRICAS ESTIMADAS POST-CORRECCION

| Metrica | Antes | Despues |
|---------|-------|---------|
| Reads por carga de pagina | ~500+ | ~100 max |
| Seguridad multi-tenant | NO | SI |
| Indices optimizados | 3 | 15 |
| Coste mensual (10 rest) | Plan gratis | Plan gratis |

---

*Documento generado automaticamente al final de la sesion*
