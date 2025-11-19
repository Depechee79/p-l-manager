# UX-UI P&L Manager - Especificación Técnica Completa

**Fecha:** 19 de Noviembre de 2025  
**Versión:** 4.26  
**Aplicación:** P&L Manager para Hostelería  

---

## 📋 ÍNDICE

1. [Contexto General y Reglas Contables](#1-contexto-general-y-reglas-contables)
2. [Módulo OCR - Comportamiento y Mapeos](#2-módulo-ocr---comportamiento-y-mapeos)
3. [Unidades, Empaques y Conteo (Productos + Inventario)](#3-unidades-empaques-y-conteo-productos--inventario)
4. [Compras (Facturas & Albaranes) - Búsqueda y Filtros](#4-compras-facturas--albaranes---búsqueda-y-filtros)
5. [Resumen de Endpoints y API](#5-resumen-de-endpoints-y-api)

---

## 1. CONTEXTO GENERAL Y REGLAS CONTABLES

### 1.1. Aplicación
- **Nombre:** P&L Manager
- **Sector:** Hostelería (restaurantes, bares, cafeterías)
- **Stack:** HTML5 + Vanilla JavaScript ES6 + localStorage + Tesseract.js + PDF.js
- **Objetivo:** Gestión integral de P&L (Profit & Loss), inventarios, OCR de facturas, control de caja

### 1.2. Regla Contable Clave (OBLIGATORIO)
**TODO se calcula y almacena SIN IVA (neto).**

- **Base Imponible NETA:** Es el valor que se usa para contabilidad, COGS, y cálculo de P&L
- **IVA:** Solo campo informativo y para conciliación con documentos
- **Total CON IVA:** Solo referencia, NO se usa para cálculos internos

### 1.3. IVA en España
- **Tipos posibles:** 4%, 10%, 21%
- **NUNCA asumir un único tipo de IVA**
- El sistema debe detectar y registrar el tipo de IVA de cada línea/documento

### 1.4. Fórmulas
```
Base Neta (€) = Importe sin IVA
IVA (€) = Base Neta × (% IVA / 100)
Total CON IVA (€) = Base Neta + IVA
```

**IMPORTANTE:** En escandallos, compras, y cálculo de COGS → usar SIEMPRE Base Neta.

---

## 2. MÓDULO OCR - COMPORTAMIENTO Y MAPEOS

### 2.1. Motor OCR

#### 2.1.1. Tecnologías
- **Tesseract.js v5** (OCR sobre imágenes)
- **PDF.js v3.11.174** (extracción de texto embebido en PDFs digitales)

#### 2.1.2. Configuración Tesseract
- **Idioma:** `spa` (español) + detección de números
- **OEM:** 1 (LSTM - mejor precisión)
- **PSM:** 6 (bloque uniforme de texto)
- **Preprocesado:** Binarización, contraste, nitidez

#### 2.1.3. Preprocesado de Imagen
Antes de pasar a OCR:
1. Convertir a escala de grises
2. Binarización adaptativa
3. Mejora de contraste
4. Escalado a resolución óptima (300 DPI recomendado)

#### 2.1.4. Extracción de PDF
Para PDFs **digitales** (no escaneados):
1. Intentar extraer texto embebido con PDF.js → **Precisión 99.9%**
2. Si no hay texto embebido → convertir a imagen y aplicar Tesseract

### 2.2. Problema Actual RESUELTO (v4.26)

**Antes:**
- El OCR detectaba texto completo pero no estructuraba campos correctamente
- Nº factura quedaba con letras: "PCK215" en lugar de "215"
- CIF/NIF no se detectaba correctamente

**Solución Aplicada:**
- Parsing semántico con **regex avanzadas** (no por posición)
- Normalización de números españoles (`668,84€` → `668.84`)
- Extracción de **solo dígitos** en Nº factura
- Detección robusta de CIF español: `[A-HJ-NP-SUVW][0-9]{7}[A-Z0-9]`

### 2.3. Reglas de Extracción y Normalización

#### 2.3.1. Proveedor (Nombre Fiscal)
**Búsqueda:**
- Patrones cercanos a: `Cliente`, `Proveedor`, `FACTURA A:`, `Cliente:`
- Capturar línea inmediatamente posterior al patrón
- Buscar antes del CIF/NIF

**Normalización:**
- Limpiar espacios extra
- Guardar exactamente como aparece (ej: `DELIVERYFY S.L.`)
- Intentar match con proveedores existentes en BD
- Si no hay match → dejar texto libre + bandera "Revisar"

**Ejemplo:**
```
Texto OCR: "FACTURA A:\nDELIVERYFY S.L.\nCIF: B42827055"
↓
Proveedor: "DELIVERYFY S.L."
```

#### 2.3.2. CIF/NIF
**Patrón:** `[A-HJ-NP-SUVW][0-9]{7}[A-Z0-9]`

**Búsqueda:**
- Regex: `/(?:NIF|CIF)[\s:]*([A-HJ-NP-SUVW][0-9]{7}[A-Z0-9])/i`
- O patrón suelto: `/\b([A-HJ-NP-SUVW][0-9]{7}[A-Z0-9])\b/`

**Normalización:**
- Extraer solo el CIF (sin palabras alrededor)
- Validar formato español

**Ejemplo:**
```
Texto OCR: "CIF: B42827055"
↓
CIF: "B42827055"
```

#### 2.3.3. Nº Factura
**Búsqueda:**
- Patrones: `Número #`, `Nº FACTURA`, `Factura Nº`, `PCK`, `FCK`, `FAC`, `INV`

**Normalización (CRÍTICO):**
- Extraer solo parte numérica → `match[1].replace(/[^0-9]/g, '')`
- Ejemplo: `PCK215` → `215`

**Código:**
```javascript
const soloNumeros = match[1].replace(/[^0-9]/g, '');
data.numero = { value: soloNumeros, confidence: confidence };
```

#### 2.3.4. Fecha
**Formatos soportados:**
- `DD/MM/AAAA`
- `DD-MM-AAAA`
- `DD/MM/AA`

**Búsqueda:**
- Regex: `/(?:Fecha|Date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i`

**Normalización:**
- Convertir a formato ISO: `YYYY-MM-DD`

#### 2.3.5. Base Imponible NETA (€)
**Búsqueda:**
- Patrones: `BASE IMPONIBLE`, `Base NETA`, `Base imponible`

**Normalización:**
```javascript
// Español: 668,84€ → 668.84
normalizeNumber(str) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}
```

**Almacenamiento:**
- Guardar como número decimal (punto)
- Mostrar en UI con coma y símbolo `€`

#### 2.3.6. IVA (€)
**Búsqueda:**
- Patrones: `IVA 21%`, `IVA 10%`, `IVA 4%` + importe

**Normalización:**
- Capturar el importe (no el porcentaje)
- Aplicar `normalizeNumber()`

**Ejemplo:**
```
Texto: "IVA 21%    140,46€"
↓
IVA: 140.46
```

#### 2.3.7. Total CON IVA (€)
**Búsqueda:**
- Patrones: `TOTAL`, `Total factura`, `Importe total`

**Uso:**
- Guardar como referencia
- NO usar para cálculos contables (solo validación)

### 2.4. Validación Automática de Importes

**Bloque "Verificación de Importes"** (verde superior):

Campos a validar:
1. **Base Neta** → Suma de líneas/escandallos
2. **IVA total** → Suma de IVAs por línea
3. **Total CON IVA** → Base Neta + IVA

**Estados de validación:**
- 🟢 **Verde (✔):** Coincide (o diferencia < 0.01€ por redondeos)
- 🔴 **Rojo (⚠):** Discrepancia → mostrar diferencia exacta

**Recalcular automáticamente cuando:**
- Usuario edita Base Neta
- Usuario edita IVA
- Se modifican líneas de detalle

### 2.5. Coherencia de Datos (v4.25)

**Función:** `validateInvoiceCoherence()`

**Fórmula:**
```javascript
totalCalculado = baseImponible + iva;
diferencia = Math.abs(total - totalCalculado);
esCoherente = diferencia < 1; // Tolerancia 1€
```

**Acción:**
- Si NO es coherente → marcar `needsReview = true`
- Mostrar advertencia al usuario

### 2.6. BUG RESUELTO: Modal "Alta Rápida" en OCR (v4.26)

**Problema:**
- Modal de "Alta Rápida de Producto" aparecía incorrectamente en vista OCR

**Solución:**
- El modal existe en `index.html` pero solo se activa desde **Inventario**
- NO hay referencias en OCR que lo muestren
- El modal está controlado por funciones de inventario: `abrirModalAltaRapida()`, `cerrarModalAltaRapida()`

**Verificación:**
- Vista OCR (`ocrView`) NO renderiza ni activa el modal
- Modal solo visible cuando se crea producto desde inventario

### 2.7. Integración con Sistema Contable

**Al pulsar "Guardar e Integrar Datos":**

Registrar en Base de Datos:
1. **Base Imponible NETA** (sin IVA) → campo principal
2. **IVA total** → campo informativo
3. **Total CON IVA** → referencia

**COGS y P&L:**
- Usar SIEMPRE Base Neta
- Las compras afectan a COGS como valor neto

---

## 3. UNIDADES, EMPAQUES Y CONTEO (PRODUCTOS + INVENTARIO)

### 3.1. Objetivo
Sistema **intuitivo y coherente** de unidades y empaques para:
- Definición de productos
- Conteo de inventario
- Cálculo de stock

### 3.2. Producto - Definición de Unidades y Empaques

#### 3.2.1. Campos en "Nuevo Producto"

**Campos obligatorios:**

1. **Unidad Base** (obligatorio)
   - Define la unidad mínima para escandallos y stock
   - Opciones: `kg`, `g`, `L`, `mL`, `unidad`, `docena`, `pieza`, etc.

2. **¿Viene empaquetado?** (Sí/No)
   - Define si el producto se compra/almacena en empaques

3. **Tipo de Empaque** (solo si "Sí")
   - Opciones: `Caja`, `Pack`, `Malla`, `Rack`, `Bandeja`, `Bolsa`, etc.

4. **Unidades por Empaque** (número)
   - Cuántas unidades base hay por empaque
   - Ejemplo: `5 kg` por caja, `12 unidades` por pack

#### 3.2.2. Ejemplo: Carne

```
Producto: "Carne de Vacuno"
Unidad base: kg
¿Viene empaquetado?: Sí
Tipo empaque: Rack
Unidades por empaque: 5

Interpretación:
- Stock se mide en kg
- Se compra en racks de 5 kg
- 1 rack = 5 kg
```

#### 3.2.3. Cálculo Interno de Stock

**Fórmula:**
```javascript
stock_base = (nº_empaques × unidades_por_empaque) + unidades_sueltas
```

**Ejemplo:**
```
Conteo:
- 3 racks completos
- 2.5 kg sueltos

Cálculo:
stock_base = (3 × 5) + 2.5 = 15 + 2.5 = 17.5 kg
```

### 3.3. Inventario - UX y Lógica

#### 3.3.1. Flujo de Inventario (REDISEÑADO v4.26)

**A) Pantalla Principal**

Cuando entras en "Inventario":
- **NO mostrar formulario de conteo directamente**
- Mostrar:
  1. **Historial de inventarios** (lista/tabla colapsable)
  2. **Botón prominente:** `+ Nuevo Inventario`

**Columnas del historial:**
- Fecha
- Familia
- Estado (Borrador / Finalizado)
- Nº Productos
- Diferencia total (€)
- Botones (Ver / Editar / Eliminar)

**B) Crear Nuevo Inventario**

Al pulsar `+ Nuevo Inventario`:
1. Mostrar formulario con:
   - **Fecha** (por defecto: hoy)
   - **Familia** (filtro opcional: "Todas las familias")
2. Botón: `+ Añadir Producto`

#### 3.3.2. Conteo por Producto (DISEÑO INTUITIVO)

**Cada fila de inventario incluye:**

1. **Selector Producto** (autocomplete)
   - Buscar por: nombre, referencia, proveedor
   - Si NO existe:
     - Botón: `+ Alta rápida de producto`
     - Abre modal sin salir de inventario
     - Al guardar → producto disponible y se selecciona

2. **Stock Teórico** (solo lectura, en gris)
   - Ejemplo: `"Stock teórico: 25 kg"`

3. **Tipo Conteo** (selector)
   - Opciones:
     - `Solo empaques completos`
     - `Solo unidades sueltas`
     - `Empaques + sueltas`

4. **Campos de Conteo** (según producto)

   **Si tiene empaque definido:**
   - `Nº empaques completos` (input numérico)
   - `Unidades sueltas` (input numérico, unidad base)
   - **Cálculo automático:**
     ```javascript
     stock_contado_base = (empaques × unidades_por_empaque) + sueltas
     ```

   **Si NO tiene empaque:**
   - `Stock real (unidad base)` (input único)

5. **Resumen por Fila**
   - `Teórico` vs `Contado` vs `Diferencia`
   - Diferencia = Contado - Teórico
   - **Color:**
     - 🟢 Verde: diferencia = 0
     - 🟡 Ámbar: diferencia pequeña (< 5% o < 1€)
     - 🔴 Rojo: diferencia relevante

#### 3.3.3. Ejemplo de Conteo

**Producto:** Carne de Vacuno (Rack de 5 kg)

```
Stock teórico: 25 kg

Tipo conteo: Empaques + sueltas

Nº empaques completos: 4
Unidades sueltas: 3.2 kg

Stock real calculado: (4 × 5) + 3.2 = 23.2 kg

Resumen:
- Teórico: 25 kg
- Contado: 23.2 kg
- Diferencia: -1.8 kg (🔴 Falta)
```

#### 3.3.4. Cierre de Inventario - Ajuste de Stock

**Al pulsar "Guardar Inventario":**

Modal de confirmación:
```
┌─────────────────────────────────────────┐
│  ¿Quieres actualizar el stock teórico   │
│     con el stock contado?               │
│                                          │
│  [✓ SÍ - Actualizar stock]              │
│  [✗ NO - Solo registrar (auditoría)]    │
└─────────────────────────────────────────┘
```

**Opción SÍ:**
- Actualizar `stock_base` de cada producto con el `stock_contado`
- Registrar inventario como "Finalizado"
- Crear registros en tabla `ajustes` (ver sección 3.4)

**Opción NO:**
- Registrar inventario como "Auditoría"
- NO modificar stock actual
- Guardar diferencias para análisis

### 3.4. Tabla de Ajustes de Stock

**Estructura:**
```javascript
{
    id: 'ajuste-001',
    inventario_id: 'inv-2025-11-19',
    producto_id: 'prod-123',
    stock_anterior: 25,
    stock_contado: 23.2,
    ajuste: -1.8,
    valor_€: -12.50, // Basado en precio compra
    fecha: '2025-11-19',
    tipo: 'inventario' // o 'manual'
}
```

**Uso:**
- Traceabilidad de ajustes
- Análisis de mermas y pérdidas
- Auditoría contable

### 3.5. Historial de Movimientos de Stock

**En detalle de Producto:**

Pestaña: `Movimientos de Stock`

**Tipos de movimientos:**
1. **Compras** (facturas/albaranes)
   - Fecha, Proveedor, Cantidad, Precio
2. **Ajustes de inventario**
   - Fecha, Inventario, Cantidad ajustada, Motivo
3. **Otros ajustes manuales**
   - Fecha, Usuario, Cantidad, Motivo

**Formato:**
- Timeline cronológico inverso (más reciente arriba)
- Color por tipo:
  - 🟢 Verde: Compras (entrada)
  - 🔴 Rojo: Mermas/Salidas
  - 🟡 Ámbar: Ajustes manuales

---

## 4. COMPRAS (FACTURAS & ALBARANES) - BÚSQUEDA Y FILTROS

### 4.1. Problema Actual RESUELTO (v4.26)

**Antes:**
- Campo `Proveedor` no mostraba proveedores existentes
- Búsqueda no funcionaba

**Solución:**
- Implementado **autocomplete HTML5** con `<datalist>`
- Poblado dinámicamente desde `db.proveedores`

### 4.2. Filtro Proveedor - Autocomplete

**HTML:**
```html
<input type="text" id="filtroProveedor" list="listaProveedores" placeholder="Buscar por proveedor...">
<datalist id="listaProveedores"></datalist>
```

**JavaScript (en `renderCompras()`):**
```javascript
const datalist = document.getElementById('listaProveedores');
if (datalist) {
    datalist.innerHTML = this.db.proveedores
        .map(p => `<option value="${p.nombreFiscal}">${p.nombreComercial ? `(${p.nombreComercial})` : ''}</option>`)
        .join('');
}
```

**Comportamiento:**
- Usuario escribe → aparecen sugerencias
- Búsqueda por:
  - Nombre fiscal
  - Nombre comercial
  - CIF/NIF (opcional)
- Al seleccionar → filtra facturas/albaranes

### 4.3. Filtros Adicionales (RECOMENDADO)

**Filtros sugeridos:**

1. **Familia / Subfamilia**
   - Multi-select de familias (Carnes, Bebidas, Verduras, etc.)
   - Filtrar por productos asociados

2. **Rango de fechas**
   - Desde / Hasta (ya implementado)

3. **Estado de pago**
   - Pagado / Pendiente / Vencido

4. **Importe mínimo/máximo**
   - Filtrar facturas por rango de importe

---

## 5. RESUMEN DE ENDPOINTS Y API

### 5.1. Endpoints Necesarios

**Proveedores:**
- `GET /proveedores` → Lista de proveedores
- `GET /proveedores/search?q={texto}` → Búsqueda por texto
- `POST /proveedores` → Crear proveedor

**Productos:**
- `GET /productos` → Lista de productos
- `GET /productos/search?q={texto}` → Búsqueda (nombre, ref, proveedor)
- `POST /productos` → Crear producto
- `PUT /productos/:id` → Actualizar producto
- `GET /productos/:id/movimientos` → Historial de movimientos

**Inventarios:**
- `GET /inventarios` → Lista de inventarios (historial)
- `POST /inventarios` → Crear nuevo inventario
- `PUT /inventarios/:id` → Actualizar inventario
- `POST /inventarios/:id/finalizar` → Finalizar inventario + ajuste de stock

**Ajustes:**
- `GET /ajustes?inventario_id={id}` → Ajustes de un inventario
- `POST /ajustes` → Crear ajuste manual

**Facturas/Albaranes:**
- `GET /facturas?proveedor={nombre}&desde={fecha}&hasta={fecha}` → Filtrar facturas
- `GET /albaranes?proveedor={nombre}&desde={fecha}&hasta={fecha}` → Filtrar albaranes
- `POST /facturas` → Crear factura (desde OCR)
- `POST /albaranes` → Crear albarán (desde OCR)

### 5.2. Estructura de Datos

**Factura (SIN IVA en campos principales):**
```javascript
{
    id: 'fac-001',
    proveedor: 'DELIVERYFY S.L.',
    numeroFactura: '215',
    fecha: '2025-11-14',
    baseImponible: 668.84,  // NETO (sin IVA)
    iva: 140.46,             // Solo informativo
    total: 809.30,           // CON IVA (referencia)
    lineas: [
        {
            producto_id: 'prod-123',
            descripcion: 'Carne de vacuno',
            cantidad: 5,
            unidad: 'kg',
            precioUnitarioNeto: 12.50, // Sin IVA
            baseNeta: 62.50,
            ivaPorc: 10,
            iva: 6.25,
            totalLinea: 68.75
        }
    ]
}
```

**Producto:**
```javascript
{
    id: 'prod-123',
    nombre: 'Carne de Vacuno',
    familia: 'Carnes',
    subfamilia: 'Vacuno',
    unidadBase: 'kg',
    esEmpaquetado: true,
    tipoEmpaque: 'Rack',
    unidadesPorEmpaque: 5,
    stock: 17.5, // En unidad base
    precioCompraUltimo: 12.50 // NETO
}
```

**Inventario:**
```javascript
{
    id: 'inv-001',
    fecha: '2025-11-19',
    familia: 'Carnes',
    estado: 'finalizado', // o 'borrador' o 'auditoria'
    lineas: [
        {
            producto_id: 'prod-123',
            stockTeorico: 25,
            empaques: 4,
            sueltas: 3.2,
            stockContado: 23.2,
            diferencia: -1.8
        }
    ],
    ajustesRealizados: true
}
```

---

## 6. CHECKLIST DE IMPLEMENTACIÓN

### 6.1. OCR
- [x] Extracción de texto embebido de PDF
- [x] Preprocesado de imagen (binarización, contraste)
- [x] Parsing semántico con regex
- [x] Normalización de números españoles
- [x] Extracción de solo dígitos en Nº factura
- [x] Detección robusta de CIF
- [x] Validación de coherencia (base + IVA ≈ total)
- [x] Verificación visual con badges 🟢🟡🔴
- [ ] Auto-recalculación al editar importes

### 6.2. Inventario
- [x] Visual packaging summary en Products ("1 Caja = 5 kg")
- [x] Enhanced inventory line info con emoji
- [x] Improved difference display ("Sobra"/"Falta")
- [ ] Closed inventory main screen con historial
- [ ] Stock adjustment modal con confirmación
- [ ] Movement traceability table
- [ ] Alta rápida de producto desde inventario
- [ ] Cálculo automático stock contado

### 6.3. Compras
- [x] Autocomplete de proveedores en filtro
- [ ] Filtros por familia/subfamilia
- [ ] Verificación factura-albaranes
- [ ] Estado de pago

### 6.4. Contabilidad
- [x] TODO almacenado sin IVA (base neta)
- [x] IVA solo informativo
- [ ] COGS calculado con base neta
- [ ] P&L con valores netos

---

## 7. NOTAS FINALES

### 7.1. Principios de Diseño
1. **Simplicidad:** Interfaz intuitiva, mínimos clics
2. **Feedback visual:** Estados claros (🟢🟡🔴)
3. **Prevención de errores:** Validaciones en tiempo real
4. **Consistencia:** Misma lógica en todo el sistema

### 7.2. Reglas de Oro
- **Sin IVA en cálculos:** Base neta siempre
- **Stock en unidad base:** kg, L, ud, etc.
- **Empaques opcionales:** Flexibilidad total
- **Validación automática:** No confiar en usuario

### 7.3. Próximas Mejoras
- [ ] Integración con TPV (tickets automáticos)
- [ ] Exportación a Excel/PDF
- [ ] Alertas de stock mínimo
- [ ] Predicción de compras con ML
- [ ] App móvil para inventario (cámara + código de barras)

---

**Fin del documento técnico - v4.26**
