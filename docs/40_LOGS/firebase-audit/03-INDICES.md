# 03 - ANALISIS DE INDICES FIRESTORE

## INDICES ACTUALES

**Archivo:** `firestore.indexes.json`

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
    }
  ],
  "fieldOverrides": []
}
```

### Evaluacion de Indices Actuales

| Indice | Coleccion | Campos | Estado | Uso |
|--------|-----------|--------|--------|-----|
| 1 | cierres | restaurantId + fecha | ✅ Correcto | Filtrar cierres por restaurante y fecha |
| 2 | facturas | restaurantId + fecha | ✅ Correcto | Filtrar facturas por restaurante y fecha |
| 3 | nominas | restaurantId + periodo | ✅ Correcto | Filtrar nominas por restaurante y periodo |

**Veredicto:** Los indices existentes estan bien configurados, PERO no se estan usando porque las queries no filtran por restaurantId.

---

## INDICES FALTANTES

### Prioridad 🔴 CRITICA (Necesarios para optimizacion)

| # | Coleccion | Campos | Query que lo necesita |
|---|-----------|--------|----------------------|
| 1 | inventarios | restaurantId + fecha DESC | Listar inventarios por restaurante |
| 2 | delivery | restaurantId + fecha DESC | Listar delivery por restaurante |
| 3 | mermas | restaurantId + fecha DESC | Listar mermas por restaurante |
| 4 | orders | restaurantId + fecha DESC | Listar pedidos por restaurante |
| 5 | gastosFijos | restaurantId + tipo ASC | Listar gastos por restaurante |
| 6 | pnl_adjustments | restaurantId + period DESC | Ajustes P&L por restaurante |

### Prioridad 🟡 MEDIA

| # | Coleccion | Campos | Query que lo necesita |
|---|-----------|--------|----------------------|
| 7 | productos | proveedorId + nombre ASC | Productos por proveedor |
| 8 | facturas | proveedorId + fecha DESC | Facturas por proveedor |
| 9 | workers | companyId + activo | Trabajadores activos por empresa |
| 10 | fichajes | workerId + date DESC | Fichajes por trabajador |
| 11 | absences | workerId + startDate DESC | Ausencias por trabajador |

---

## ARCHIVO DE INDICES RECOMENDADO

```json
{
  "indexes": [
    // === EXISTENTES (mantener) ===
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

    // === NUEVOS CRITICOS ===
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

    // === NUEVOS MEDIOS ===
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

## COMANDOS PARA CREAR INDICES

### Via Firebase CLI

```bash
# Desplegar todos los indices
firebase deploy --only firestore:indexes

# Ver indices actuales
firebase firestore:indexes
```

### Via Firebase Console

1. Ir a Firebase Console > Firestore Database > Indexes
2. Click "Add Index"
3. Seleccionar coleccion
4. Agregar campos
5. Click "Create"

---

## INDICES SOBRANTES

**No se detectan indices innecesarios.** Los 3 indices actuales son correctos.

---

## IMPACTO DE INDICES EN COSTES

### Coste de mantener indices

- Firestore cobra por almacenamiento de indices
- Cada indice compuesto aumenta el tamano de almacenamiento
- Impacto minimo para apps pequenas (~$0.01/mes por indice)

### Coste de NO tener indices

- Sin indice: Query rechazada o escaneo completo
- Con indice: Query eficiente, solo lee documentos necesarios

**Conclusion:** El coste de indices es negligible comparado con el ahorro en reads.

---

## MATRIZ DE INDICES VS QUERIES

| Query Pattern | Indice Requerido | Existe | Prioridad |
|---------------|------------------|--------|-----------|
| cierres WHERE restaurantId + ORDER BY fecha | restaurantId_fecha | ✅ Si | - |
| facturas WHERE restaurantId + ORDER BY fecha | restaurantId_fecha | ✅ Si | - |
| nominas WHERE restaurantId + ORDER BY periodo | restaurantId_periodo | ✅ Si | - |
| inventarios WHERE restaurantId + ORDER BY fecha | restaurantId_fecha | ❌ No | 🔴 |
| delivery WHERE restaurantId + ORDER BY fecha | restaurantId_fecha | ❌ No | 🔴 |
| mermas WHERE restaurantId + ORDER BY fecha | restaurantId_fecha | ❌ No | 🔴 |
| orders WHERE restaurantId + ORDER BY fecha | restaurantId_fecha | ❌ No | 🔴 |
| gastosFijos WHERE restaurantId | restaurantId_tipo | ❌ No | 🔴 |
| pnl_adjustments WHERE restaurantId | restaurantId_period | ❌ No | 🔴 |
| productos WHERE proveedorId | proveedorId_nombre | ❌ No | 🟡 |
| workers WHERE companyId + activo | companyId_activo | ❌ No | 🟡 |

---

## RECOMENDACION

1. **Inmediato:** Copiar `firestore.indexes.json` recomendado
2. **Ejecutar:** `firebase deploy --only firestore:indexes`
3. **Esperar:** 5-10 minutos para que los indices se construyan
4. **Verificar:** En Firebase Console que estan "Enabled"

**Nota:** Los indices se pueden crear antes de cambiar el codigo. Firestore los usara automaticamente cuando las queries los necesiten.
