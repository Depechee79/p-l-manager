# TAREA 3: CREAR INDICES FALTANTES

## Tiempo estimado: 30 minutos
## Complejidad: Baja
## Prerequisitos: Acceso a Firebase Console

---

## QUE VAMOS A HACER

Los indices en Firebase son como el indice de un libro: te ayudan a encontrar informacion rapidamente.

**Sin indice:** Firebase tiene que leer TODOS los documentos para encontrar lo que buscas.
**Con indice:** Firebase va directamente a los documentos que necesitas.

Actualmente tienes 3 indices. Vamos a agregar 11 mas.

---

## IMPACTO DE NO ARREGLARLO

- VELOCIDAD: Queries lentas (segundos en vez de milisegundos)
- ERRORES: Algunas queries pueden fallar sin el indice correcto
- COSTE: Leer mas documentos de los necesarios

---

## ARCHIVOS A MODIFICAR

| Archivo | Ubicacion | Que cambiaremos |
|---------|-----------|-----------------|
| firestore.indexes.json | Raiz del proyecto | Agregar indices nuevos |

---

## PASO A PASO

### PASO 1: Localizar el archivo de indices

1. Abre tu proyecto en el explorador de archivos
2. Busca en la raiz (carpeta principal): `firestore.indexes.json`
3. Si no existe, lo vamos a crear

### PASO 2: Reemplazar o crear el archivo

1. Si el archivo existe, abrelo y reemplaza todo el contenido
2. Si no existe, crea un archivo nuevo llamado `firestore.indexes.json`
3. Copia el siguiente contenido:

**CONTENIDO COMPLETO DE firestore.indexes.json:**

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
      "collectionGroup": "albaranes",
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

### PASO 3: Desplegar los indices

Abre una terminal (Command Prompt o PowerShell) y ejecuta:

```bash
cd "C:\Users\AITOR\Desktop\P&L Antigravity"
firebase deploy --only firestore:indexes
```

**Que veras:**

```
=== Deploying to 'pylhospitality'...

i  deploying firestore
i  firestore: reading indexes from firestore.indexes.json...
+  firestore: deployed indexes in firestore.indexes.json successfully

+  Deploy complete!
```

### PASO 4: Esperar a que se construyan

Los indices no estan disponibles inmediatamente. Firebase necesita construirlos.

1. Ve a: https://console.firebase.google.com
2. Selecciona tu proyecto (pylhospitality)
3. Menu izquierdo: "Firestore Database"
4. Pestana superior: "Indices"
5. Veras una lista de indices con su estado:
   - **Building** (Construyendo): Espera unos minutos
   - **Enabled** (Habilitado): Listo para usar
   - **Error**: Hay un problema (ver siguiente seccion)

**Tiempo de construccion tipico:** 5-15 minutos dependiendo de cuantos datos tengas.

---

## VERIFICACION

### Como saber que los indices estan listos:

1. En Firebase Console > Firestore > Indices
2. TODOS los indices deben decir "Enabled"
3. Si alguno dice "Building", espera

### Verificacion en la aplicacion:

1. Abre la app
2. Ve a una seccion (ej: Facturas)
3. **Abre la consola del navegador** (F12)
4. **NO deberia haber errores** de tipo "The query requires an index"
5. La carga debe ser rapida (menos de 1 segundo)

---

## ERRORES COMUNES

### Error: "firebase: command not found"

**Causa:** Firebase CLI no esta instalado.

**Solucion:**
```bash
npm install -g firebase-tools
firebase login
```

### Error: "No project active"

**Causa:** No has seleccionado un proyecto de Firebase.

**Solucion:**
```bash
firebase use pylhospitality
```

O si no sabes el nombre del proyecto:
```bash
firebase projects:list
firebase use [nombre-del-proyecto]
```

### Error: "Permission denied"

**Causa:** Tu cuenta no tiene permisos para desplegar.

**Solucion:**
```bash
firebase logout
firebase login
```

Asegurate de usar la cuenta de Google que tiene acceso al proyecto.

### Indice queda en "Error"

**Causa:** El indice tiene un problema (campo que no existe, etc.)

**Solucion:**
1. Elimina el indice con error desde Firebase Console
2. Revisa que los campos existan en tus documentos
3. Vuelve a desplegar

---

## ALTERNATIVA: Crear indices manualmente

Si no puedes usar el comando de terminal, puedes crear indices desde Firebase Console:

1. Ve a Firebase Console > Firestore > Indices
2. Click en "Crear indice"
3. Para cada indice de la tabla de abajo:
   - Selecciona la coleccion
   - Agrega los campos con su orden
   - Click "Crear"

### Tabla de indices a crear manualmente:

| # | Coleccion | Campo 1 | Orden 1 | Campo 2 | Orden 2 |
|---|-----------|---------|---------|---------|---------|
| 1 | inventarios | restaurantId | Ascendente | fecha | Descendente |
| 2 | delivery | restaurantId | Ascendente | fecha | Descendente |
| 3 | mermas | restaurantId | Ascendente | fecha | Descendente |
| 4 | orders | restaurantId | Ascendente | fecha | Descendente |
| 5 | albaranes | restaurantId | Ascendente | fecha | Descendente |
| 6 | gastosFijos | restaurantId | Ascendente | tipo | Ascendente |
| 7 | pnl_adjustments | restaurantId | Ascendente | period | Descendente |
| 8 | productos | proveedorId | Ascendente | nombre | Ascendente |
| 9 | facturas | proveedorId | Ascendente | fecha | Descendente |
| 10 | workers | companyId | Ascendente | activo | Ascendente |
| 11 | fichajes | workerId | Ascendente | date | Descendente |
| 12 | absences | workerId | Ascendente | startDate | Descendente |

---

## LISTA DE INDICES EXISTENTES vs NUEVOS

| # | Coleccion | Campos | Estado |
|---|-----------|--------|--------|
| 1 | cierres | restaurantId + fecha | YA EXISTE |
| 2 | facturas | restaurantId + fecha | YA EXISTE |
| 3 | nominas | restaurantId + periodo | YA EXISTE |
| 4 | inventarios | restaurantId + fecha | NUEVO |
| 5 | delivery | restaurantId + fecha | NUEVO |
| 6 | mermas | restaurantId + fecha | NUEVO |
| 7 | orders | restaurantId + fecha | NUEVO |
| 8 | albaranes | restaurantId + fecha | NUEVO |
| 9 | gastosFijos | restaurantId + tipo | NUEVO |
| 10 | pnl_adjustments | restaurantId + period | NUEVO |
| 11 | productos | proveedorId + nombre | NUEVO |
| 12 | facturas | proveedorId + fecha | NUEVO |
| 13 | workers | companyId + activo | NUEVO |
| 14 | fichajes | workerId + date | NUEVO |
| 15 | absences | workerId + startDate | NUEVO |

---

## SIGUIENTE PASO

Una vez todos los indices esten en estado "Enabled":

Continua con: **`04-ALTO-cloud-first.md`**

---

## TIEMPO REAL EMPLEADO

- [ ] Crear/modificar firestore.indexes.json: ___ minutos
- [ ] Ejecutar firebase deploy: ___ minutos
- [ ] Esperar construccion de indices: ___ minutos
- [ ] Verificar en Firebase Console: ___ minutos
- [ ] **TOTAL:** ___ minutos

---

## COSTE DE LOS INDICES

**Buena noticia:** Los indices tienen un coste MUY bajo.

- Almacenamiento de indices: ~$0.01/mes por indice
- Los 15 indices totales: ~$0.15/mes

El ahorro en reads por tener queries optimizadas es MUCHO mayor que el coste de mantener los indices.
