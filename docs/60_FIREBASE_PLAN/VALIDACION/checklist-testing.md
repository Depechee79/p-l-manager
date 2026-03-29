# CHECKLIST DE TESTING - VALIDACION FINAL

Usa este checklist para verificar que todos los cambios funcionan correctamente.
Marca cada item con [x] cuando lo hayas verificado.

---

## PRE-REQUISITOS

Antes de empezar el testing:

- [ ] Tienes acceso a Firebase Console
- [ ] La app esta funcionando en http://localhost:5173 (o tu URL)
- [ ] Tienes al menos 2 cuentas de usuario para probar
- [ ] Los usuarios pertenecen a restaurantes diferentes

---

## 1. SEGURIDAD (Reglas de Firestore)

### 1.1 Aislamiento de datos

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 1.1.1 | Usuario A no ve datos de B | Login como usuario A. Ir a Facturas. | Solo aparecen facturas de Restaurante A | [ ] |
| 1.1.2 | Usuario B no ve datos de A | Login como usuario B. Ir a Facturas. | Solo aparecen facturas de Restaurante B | [ ] |
| 1.1.3 | Admin ve todo | Login como admin. Ir a Facturas. | Puede ver facturas de ambos restaurantes | [ ] |

### 1.2 Permisos de escritura

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 1.2.1 | Usuario puede crear en su restaurante | Login como usuario A. Crear factura. | Se guarda correctamente | [ ] |
| 1.2.2 | Usuario no puede eliminar (solo admin) | Login como usuario normal. Intentar eliminar factura. | Mensaje de error "Sin permisos" | [ ] |
| 1.2.3 | Admin puede eliminar | Login como admin. Eliminar factura. | Se elimina correctamente | [ ] |

### 1.3 Validacion de campos

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 1.3.1 | Factura requiere campos obligatorios | Crear factura sin numero. | Error de validacion | [ ] |
| 1.3.2 | Cierre requiere campos obligatorios | Crear cierre sin fecha. | Error de validacion | [ ] |

---

## 2. QUERIES OPTIMIZADAS

### 2.1 Filtrado por restaurante

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 2.1.1 | Facturas filtradas | Abrir consola (F12). Ir a Facturas. | Log muestra "Fetched X docs from facturas (restaurant: XXX)" | [ ] |
| 2.1.2 | Inventarios filtrados | Abrir consola (F12). Ir a Inventarios. | Log muestra filtro por restaurante | [ ] |
| 2.1.3 | Cierres filtrados | Abrir consola (F12). Ir a Cierres. | Log muestra filtro por restaurante | [ ] |

### 2.2 Limites aplicados

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 2.2.1 | Maximo 100 documentos | Tener 150 facturas. Ir a Facturas. | Solo se cargan 100 (ver consola) | [ ] |

### 2.3 Sin advertencias de performance

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 2.3.1 | Sin warning de getAll() | Navegar por la app. Ver consola. | NO aparece "[PERFORMANCE] getAll() usado en..." | [ ] |

---

## 3. INDICES

### 3.1 Verificar en Firebase Console

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 3.1.1 | Indices creados | Firebase Console > Firestore > Indices | Hay 15 indices listados | [ ] |
| 3.1.2 | Todos habilitados | Ver estado de cada indice | Todos dicen "Enabled" | [ ] |

### 3.2 Sin errores de indice

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 3.2.1 | Sin errores en consola | Navegar por toda la app. Ver consola. | NO aparece "The query requires an index" | [ ] |

---

## 4. CLOUD-FIRST

### 4.1 Feedback visual

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 4.1.1 | Mensaje "Guardando..." | Crear nueva factura. | Aparece toast "Guardando..." | [ ] |
| 4.1.2 | Mensaje "Guardado correctamente" | Esperar a que termine. | Aparece toast verde de exito | [ ] |
| 4.1.3 | Mensaje de error | Desconectar internet. Intentar guardar. | Aparece toast rojo con error | [ ] |

### 4.2 Sincronizacion

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 4.2.1 | Datos aparecen en Firebase | Crear factura. Ir a Firebase Console. | La factura aparece en la coleccion | [ ] |
| 4.2.2 | Datos persisten | Crear factura. Cerrar navegador. Abrir de nuevo. | La factura sigue ahi | [ ] |
| 4.2.3 | Multi-dispositivo | Crear factura en PC. Ver en movil. | La factura aparece en ambos | [ ] |

### 4.3 Manejo de errores

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 4.3.1 | Error no guarda en local | Desconectar internet. Intentar guardar. | El dato NO aparece en la lista local | [ ] |
| 4.3.2 | Reconexion permite guardar | Reconectar internet. Intentar guardar de nuevo. | Ahora si se guarda | [ ] |

---

## 5. FUNCIONALIDAD GENERAL

### 5.1 Operaciones CRUD

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 5.1.1 | Crear factura | Nueva factura con todos los campos. | Se guarda y aparece en lista | [ ] |
| 5.1.2 | Editar factura | Modificar una factura existente. | Cambios guardados | [ ] |
| 5.1.3 | Ver detalle | Click en una factura. | Se muestra el detalle | [ ] |
| 5.1.4 | Eliminar (admin) | Como admin, eliminar factura. | Se elimina de lista y Firebase | [ ] |

### 5.2 Navegacion

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 5.2.1 | Cambiar de seccion | Ir de Facturas a Inventarios. | Carga rapida (<1 segundo) | [ ] |
| 5.2.2 | Volver atras | Usar boton atras del navegador. | Funciona correctamente | [ ] |

### 5.3 Filtros y busqueda

| # | Test | Pasos | Resultado esperado | OK? |
|---|------|-------|-------------------|-----|
| 5.3.1 | Filtrar por fecha | En listado, filtrar por mes. | Solo aparecen items del mes | [ ] |
| 5.3.2 | Buscar por texto | Buscar nombre de proveedor. | Resultados filtrados | [ ] |

---

## 6. RENDIMIENTO

### 6.1 Tiempos de carga

| # | Seccion | Tiempo maximo | Tiempo real | OK? |
|---|---------|---------------|-------------|-----|
| 6.1.1 | Login | 2 segundos | ___ seg | [ ] |
| 6.1.2 | Dashboard | 2 segundos | ___ seg | [ ] |
| 6.1.3 | Facturas | 2 segundos | ___ seg | [ ] |
| 6.1.4 | Inventarios | 2 segundos | ___ seg | [ ] |

### 6.2 Metricas Firebase

| # | Metrica | Valor esperado | Valor real | OK? |
|---|---------|----------------|------------|-----|
| 6.2.1 | Reads/dia | <5,000 | ___ | [ ] |
| 6.2.2 | Writes/dia | <500 | ___ | [ ] |
| 6.2.3 | Errores | 0 | ___ | [ ] |

---

## RESUMEN

| Seccion | Tests pasados | Tests fallados |
|---------|---------------|----------------|
| 1. Seguridad | __/8 | __ |
| 2. Queries | __/4 | __ |
| 3. Indices | __/3 | __ |
| 4. Cloud-First | __/6 | __ |
| 5. Funcionalidad | __/7 | __ |
| 6. Rendimiento | __/6 | __ |
| **TOTAL** | __/34 | __ |

---

## SI HAY TESTS FALLADOS

1. Anota cual test fallo y que error viste
2. Revisa la guia correspondiente (01-CRITICO-seguridad.md, etc.)
3. Busca la seccion de "Errores comunes"
4. Si no encuentras solucion, documenta el error para soporte

---

## APROBACION FINAL

- [ ] Todos los tests criticos pasaron (Seccion 1 y 4)
- [ ] La app funciona correctamente para uso diario
- [ ] Los costes estan dentro del plan gratuito

**Fecha de testing:** _______________
**Realizado por:** _______________
**Resultado:** [ ] APROBADO / [ ] REQUIERE CORRECCION
