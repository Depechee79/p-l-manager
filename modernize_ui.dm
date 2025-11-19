# Plan de Diseno UI/UX – P&L Manager

**Destinatario:** Equipo Fullstack (implementacion)  
**Autor:** Agente Front-End (modo bisturi, sin cambios fuera de alcance)  
**Ubicacion:** `c:\Users\AITOR\P&L\modernize_ui.dm`

Objetivo general: unificar toda la app (OCR, Cierres, Compras, Proveedores, Productos, Escandallos, Inventario, Delivery, P&L) con una interfaz profesional, limpia, responsive y mobile-first. Mantener navegacion lateral existente y no tocar logica ni rutas.

---

## Regla base
- Sidebar izquierda es la navegacion principal. Mantener icono + texto por modulo.
- Top bar solo para logo/nombre app, selector de periodo y un pequeño resumen (importe periodo). Nada de botones duplicados.
- Contenido principal siempre dentro de un contenedor central (max-width 1200-1400px) con margenes laterales simetricos.
- No reintroducir la fila de botones tipo tabs como navegacion secundaria.

---

## 1. Fundamentos visuales

### Tipografia
- Una sola familia (Inter, Roboto o similar) cargada via `<link>` en `index.html`.
- Jerarquia: H1 22-24px semibold, H2 18-20px semibold, texto base 14-16px, ayuda 12-13px.

### Colores
- Fondo general: gris muy claro `#f5f5f7`.
- Tarjetas: blanco `#ffffff` con sombra leve (elevacion 1) y bordes redondeados 8px.
- Texto principal `#222`, secundario `#666`.
- Primario (botones principales) azul consistente con el actual.
- Estados: verde (exito), rojo (error), ambar/naranja (aviso).
- Usar siempre los mismos colores para botones principales, badges y estados (CUADRA, DESCUADRE, etc.).

### Espaciado y contenedores
- Contenedor principal centrado con `max-width` 1200-1400px.
- Margenes verticales 24px y 16-24px entre secciones.
- Tarjetas con padding interno 16-20px, border-radius 8px y sombra suave.

### Responsive
- Breakpoints: <768 mobile, 768-1024 tablet, >1024 desktop.
- Mobile: una sola columna, listas convertidas en tarjetas apiladas, botones principales visibles.
- Tablet/desktop: permitir dos columnas o grids cuando tenga sentido sin romper jerarquia.

---

## 2. Navegacion y estructura

### Sidebar
- Mantener modulos: OCR, Cierres, Compras, Proveedores, Productos, Escandallos, Inventario, Delivery, P&L.
- Estado activo: fondo azul muy suave, borde izquierdo y texto semibold.

### Top bar
- Solo logo/nombre, selector de periodo, indicador de total (opcional). Nada mas.

### Estructura por modulo
- Patrón comun:
  1. Titulo (H1).
  2. Barra de acciones con boton principal `+ Nuevo ...` (azul) + filtros a la derecha.
  3. Lista principal (tarjetas o tabla) debajo.
- Formularios de alta/edicion se abren solo al hacer clic en `Nuevo` o `Editar`, preferentemente en modal o panel lateral.

---

## 3. Patrones especificos

### OCR
- Mantener pasos (Seleccionar tipo, Subir/Analizar, Verificar).
- Destacar paso activo con color mas intenso y animacion suave (fade/slide).
- Barra de progreso mas fina y discreta.
- Desktop: cada paso como tarjeta clara; mobile: pasos apilados con boton "Siguiente".

### Cierres
- Reusar diseno en columnas POS vs REAL.
- Listado en tarjetas compactas con resumen y posibilidad de desplegar detalle (tabla alineada por metodo).

### Productos
- Vista: boton `+ Nuevo producto`, debajo lista en tarjetas/tabla simple con columnas (nombre, proveedor, precio neto, unidad base, stock, acciones).
- Formulario en modal/panel con secciones (datos basicos, precio/stock, empaquetado).

### Proveedores
- Mismo patron: boton `+ Nuevo proveedor`, lista con datos clave (nombre, tipo, contacto, condiciones pago) y acciones (editar/eliminar).

### Escandallos
- Tarjetas que muestran nombre, PVP con IVA, coste neto, food cost %, margen bruto %. Colorear food cost segun objetivo.
- Al desplegar: ingredientes con cantidad y coste.
- Boton `+ Nuevo escandallo` abre formulario limpio.

### Otros modulos (Compras, Inventario, Delivery, P&L)
- Adoptar el mismo patron de tarjetas/tabla + acciones y mantener consistencia en badges/estados.

---

## 4. Animaciones y transiciones
- Transiciones de 150-250ms ease-out/in-out.
- Aplicar en hover/focus de botones, apertura de modales, desplegar/plegar tarjetas.
- Evitar rebotes o zoom exagerados; preferir cambios en `opacity` y `transform`.
- Respetar `prefers-reduced-motion`.

---

## 5. Usabilidad
- Estados vacios: mensaje claro + boton de accion sugerida.
- Iconografia consistente (Bootstrap Icons o FontAwesome). Lápiz = editar, papelera = eliminar, ojo/lupa = ver, plus = nuevo.
- Areas clicables min 40x40px, contraste AA, focus state visible.
- Mensajes de exito/error como toast en esquina superior derecha (verde/rojo).

---

## 6. Checklist de implementacion
1. Cargar tipografia unica en `index.html`.
2. Definir tokens en `styles.css` (`:root`) para colores, sombras, radios y espaciados.
3. Ajustar layout de `.container`, `.sidebar`, `.main-content` para responsive mobile-first sin tocar ids usados por JS.
4. Refactor visual por modulo siguiendo patrones descritos (tarjetas, botones, formularios en modal).
5. Añadir estilos para animaciones suaves y estados focos accesibles.
6. Revisar todas las vistas usando los toggles existentes en `app.js` sin modificar logica.
7. Actualizar `PROJECT_BIBLE.md` con resumen cuando se implemente.

---

## 7. Instrucciones para el equipo fullstack
1. Abrir este archivo (`modernize_ui.dm`) y seguir cada seccion al pie de la letra antes de tocar `app/styles.css`, `app/index.html` o `app/app.js` (solo para clases visuales).
2. No tocar logica, rutas, APIs ni almacenamiento; esto es exclusivamente visual.
3. Mantener navegacion lateral y estructura base; cualquier wrapper nuevo debe documentarse en Project Bible.
4. Tras aplicar los cambios, actualizar Project Bible con el detalle de lo implementado y mantener README si hay cambios UX relevantes.
