# Plan de Actualización de Diseño y UX

Este documento detalla los cambios requeridos para transformar la visualización de listas en tablas y estandarizar los selectores de datos del sistema.

## 1. Pantallas Afectadas

Todas las vistas que presentan listados de registros serán migradas al nuevo formato de tabla.

| Vista | Contenido de la Lista | Columnas Propuestas (Desktop) |
|-------|----------------------|-------------------------------|
| **Proveedores** | Lista de proveedores registrados | Nombre Comercial, Razón Social, CIF/NIF, Teléfono, Email, Acciones |
| **Productos** | Catálogo de productos | Nombre, Categoría, Precio, Unidad, Stock, Proveedor, Acciones |
| **Escandallos** | Lista de platos/recetas | Nombre, PVP (IVA inc), Coste, Margen %, Food Cost %, Acciones |
| **Cierres** | Histórico de cierres de caja | Fecha, Turno, Total Efectivo, Total Tarjeta, Descuadre, Acciones |
| **Inventario** | Histórico de recuentos físicos | Fecha, Zona/Familia, Valor Total, Estado, Acciones |
| **Delivery** | Registro de ventas delivery | Fecha, Plataforma, Ventas Brutas, Comisión, Neto, Acciones |
| **Documentos** | Facturas y Albaranes (OCR) | Fecha, Proveedor, Tipo, Total, Estado, Acciones |

## 2. Diseño Objetivo

### A) Listas como Tablas (Desktop & Tablet)
Se implementará una estructura HTML de tabla semántica (`<table>`, `<thead>`, `<tbody>`) con las siguientes características visuales:

*   **Estilo General:** Diseño "Clean & Compact".
*   **Filas:** Separación visual mediante "Zebra Striping" (fondo alterno suave) o líneas divisorias finas (`border-bottom: 1px solid #eee`).
*   **Cabecera:** Títulos de columna fijos (`position: sticky; top: 0`) para mantener el contexto al hacer scroll.
*   **Alineación:**
    *   Texto (Nombres, descripciones): Alineación **Izquierda**.
    *   Números (Importes, Stock, Porcentajes): Alineación **Derecha** y fuente monoespaciada tabular.
    *   Estados/Badges: Alineación **Centro**.
*   **Columna de Acciones:** Siempre fija a la derecha, conteniendo los botones de Editar/Borrar/Ver agrupados.

### B) Comportamiento Responsive (Mobile)
Mediante CSS Media Queries (`@media (max-width: 768px)`), la tabla se transformará:

*   **Stacked Rows:** La fila (`tr`) se convierte en un bloque contenedor (tipo tarjeta).
*   **Celdas:** Cada celda (`td`) se muestra como una fila dentro del bloque.
*   **Etiquetas:** Se utilizará el atributo `data-label` en cada `td` para mostrar el título de la columna a la izquierda del valor (ej: "Precio: 15.00€").
*   **Acciones:** Se mantienen accesibles, flotando o al pie del bloque.

### C) Dropdowns Inteligentes (System Data Fields)
Todos los campos de formulario que requieran seleccionar una entidad existente (ej: Seleccionar Proveedor al crear Producto) usarán el componente **"Smart Autocomplete"** (basado en el estilo del escáner OCR).

**Componentes del Control:**
1.  **Input de Búsqueda:** Permite escribir para filtrar. Muestra el nombre del ítem seleccionado.
2.  **Input Oculto (Hidden):** Almacena el ID único del ítem seleccionado.
3.  **Lista Desplegable:**
    *   Aparece al hacer foco o escribir.
    *   Filtra resultados en tiempo real.
    *   **Estado "Sin Resultados":** Muestra mensaje "No encontrado".
    *   **Acción "Crear Nuevo":** Botón destacado al final o cuando no hay resultados que permite navegar a la creación rápida de la entidad (ej: "+ Crear nuevo Proveedor").

**Reglas de Negocio:**
*   **Prohibido Texto Libre:** El usuario NO puede guardar un valor que no esté en la lista (el ID es obligatorio). Si escribe "Proveedor X" y no lo selecciona, el campo se marca como inválido.
*   **Feedback Visual:** Indicador claro de selección válida (check verde o borde resaltado).

## 3. Criterios de Aceptación (QA)

### Tablas
1.  [ ] **Visualización Desktop:** Las listas se ven como tablas alineadas, no como tarjetas.
2.  [ ] **Legibilidad:** Los importes monetarios están alineados a la derecha.
3.  [ ] **Responsive:** En móvil, la tabla no genera scroll horizontal, sino que se apila verticalmente mostrando etiquetas para cada dato.
4.  [ ] **Acciones:** Los botones de editar/borrar funcionan correctamente desde la nueva estructura de tabla.

### Dropdowns
1.  [ ] **Filtrado:** Al escribir en el campo "Proveedor" (en ficha Producto), la lista se reduce a las coincidencias.
2.  [ ] **Selección:** Al hacer clic en una opción, el input muestra el nombre y el sistema captura el ID internamente.
3.  [ ] **Validación:** Si el usuario escribe un nombre pero no selecciona una opción de la lista, el formulario no permite guardar (o limpia el campo).
4.  [ ] **Creación:** Existe un botón o enlace visible para crear la entidad si no existe.
5.  [ ] **Estilo:** El diseño coincide con el dropdown de "Añadir campo" del escáner (sombra, bordes redondeados, hover claro).
