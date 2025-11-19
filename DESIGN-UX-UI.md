# 📘 DESIGN-UX-UI-SYSTEM (VERSIÓN FINAL)
### Guía Oficial de Diseño, UX e Interfaz para toda la App P&L Manager  
**DOCUMENTO DEFINITIVO – OBLIGATORIO – BASE PARA TODO EL FRONTEND**

Este documento define toda la estructura de diseño, UX, UI, interacción y componentes visuales que deben aplicarse en TODOS los módulos de la aplicación.  
Ningún módulo puede desviarse de este estándar.

---

# 1. FUNDAMENTOS DE DISEÑO

## 1.1 Paleta de colores

### Colores Principales
- Azul corporativo: `#1171ef`
- Verde éxito: `#34c759`
- Rojo error: `#ff3b30`
- Amarillo aviso: `#ffcc00`
- Azul info: `#0a84ff`

### Grises
- Fondo general: `#f3f6fa`
- Card blanco: `#ffffff`
- Borde suave: `#e3e8ef`
- Texto primario: `#1f2d3d`
- Texto secundario: `#6b7b8c`
- Etiquetas: `#9aa5b1`

### Sidebar
- Fondo: `#1d3041`
- Hover: `#26445a`
- Iconos: `#cfd8e3`

---

## 1.2 Tipografía

- Fuente global: **Inter** o **Roboto**
- H1: 28–32px
- H2: 22–24px
- H3: 18–20px
- Texto: 14–16px
- Etiquetas: 12px

---

## 1.3 Estructura Global

### Sidebar
- Ancho: 240px
- Fondo oscuro
- Iconos alineados a la izquierda
- Hover: 0.2s

### Contenido principal
- Margen lateral: 32px
- Espaciado vertical: 24px

### Cards
```css
background: #ffffff;
border-radius: 12px;
border: 1px solid #e3e8ef;
padding: 24px;
box-shadow: 0 1px 2px rgba(0,0,0,0.04);
```

---

# 2. COMPONENTES

## 2.1 Botones

### Principal
```css
background: #1171ef;
color: white;
border-radius: 8px;
padding: 10px 18px;
font-weight: 600;
transition: 0.2s;
```

### Secundario
```css
background: #e9eef5;
color: #1f2d3d;
```

### Destructivo
```css
background: #ff3b30;
color: white;
```

---

## 2.2 Inputs
- Altura: 42px  
- Borde: `#e3e8ef`  
- Border-radius: 8px  
- Focus azul `#1171ef`  

---

## 2.3 Tarjetas en listas
```css
background: #ffffff;
border-radius: 10px;
border: 1px solid #e3e8ef;
padding: 18px;
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 12px;
```

---

## 2.4 Reglas UX comunes

En TODOS los módulos:
1. **Botón "+ Nuevo …" arriba**
2. **Formulario solo visible al pulsar**
3. **Lista debajo**
4. **Formularios en dos columnas**

---

# 3. DISEÑO POR MÓDULOS

---

## 3.1 CIERRES

### Lista
- Card con:
  - Fecha y turno
  - POS total
  - REAL total
  - DIFERENCIA (verde si 0, rojo si ≠ 0)
  - Tickets y ticket medio
- Botones: editar | ver | borrar

### Detalle
- Tabla:
  - Método | POS | Real | Diferencia
- Banda final:
  - Verde: cuadrado
  - Roja: descuadre

### Nuevo cierre
- Secciones plegables: efectivo, datáfonos, otros
- Resumen lateral en tabla
- Botón Guardar (azul)

---

## 3.2 PRODUCTOS

### Vista
- Botón "+ Nuevo Producto"
- Lista con tarjetas

### Tarjeta
- Nombre
- Proveedor
- Stock + unidad
- Precio neto
- Botones editar / borrar

### Formulario
- Nombre
- Proveedor
- Precio Neto (sin IVA)
- Unidad base (kg, g, L, ml, ud)
- Stock inicial
- Empaquetado sí/no
- Tipo empaque
- Unidades por empaque

---

## 3.3 PROVEEDORES

### Vista
- Botón "+ Nuevo Proveedor"
- Lista en tarjetas

### Formulario
- Nombre fiscal
- Nombre comercial
- CIF/NIF
- Dirección
- CP / Ciudad / Provincia
- Email / Teléfono
- Persona contacto
- Forma de pago
- Frecuencia entrega
- Condiciones
- Observaciones

---

## 3.4 ESCANDALLOS

### Lista
- Nombre del plato
- PVP con IVA 10%
- PVP neto
- Coste total neto
- Food Cost %  
- Margen €

### Detalle
- Ingredientes en tabla:
  - Producto
  - Cantidad
  - Unidad
  - Coste unitario neto
  - Coste total
- Totales:
  - Coste total neto
  - PVP neto
  - PVP con IVA
  - Food Cost %
  - Margen €

---

## 3.5 INVENTARIO

### Vista
- Fecha + familia arriba
- Tabla con:
  - Producto
  - Unidad
  - Stock teórico
  - Stock contado
  - Diferencia
  - Valor €

Historial en tarjetas.

---

## 3.6 COMPRAS (Facturas y Albaranes)

### Filtros
- Proveedor
- Fecha inicio/fin
- Botón Filtrar

### Lista
- Proveedor
- Fecha
- Nº documento
- Base
- IVA
- Total
- Estado
- Acciones

---

## 3.7 DELIVERY

### Formulario
- Fecha
- Plataforma
- Ventas brutas
- Comisión %
- Neto recibido

### Lista
- Fecha
- Plataforma
- Neto
- Comisión
- Acciones

---

## 3.8 P&L

### KPIs arriba
- Ingresos netos
- COGS %
- Margen %
- EBITDA %

### Secciones plegables
- Ingresos
- COGS
- Margen
- Gastos
- Beneficio

---

# 4. MICROUX
- Hover suave
- Cards suben 2px
- Inputs con borde azul
- Animaciones 0.2s en desplegables

---

# 5. REGLAS PARA EL DEV

1. **NO cambiar IDs ni funciones JS.**
2. Solo cambiar HTML/CSS (estructura).
3. Refactor módulo por módulo.
4. Commits pequeños y limpios.
5. Diseño final debe coincidir EXACTAMENTE con el documento.

---

# 6. CÓMO LO USARÁ EL FULL-STACK EN VISUAL STUDIO CODE

1. Guardará este archivo como:
   ```
   DESIGN-UX-UI.md
   ```
2. Abrirá Copilot Chat en VS Code.
3. Para cada vista ejecutará este prompt:

```
Refactoriza la UI de este archivo siguiendo EXACTAMENTE el documento DESIGN-UX-UI.md.
No cambies IDs, nombres ni lógica JS.
Solo cambia HTML/CSS para aplicar el diseño y componentes estándar.
Devuélveme el bloque completo actualizado.
```

4. Validará visualmente.
5. Hará commit:

```
refactor(ui): aplicar DESIGN-UX-UI en módulo X
```

---

**FIN DEL DOCUMENTO**
