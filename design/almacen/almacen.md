Especificación Técnica: Módulo Almacén - P&L Manager
1. Identidad Visual (Design Tokens)
Color Primario (Crimson): #D81E5B. Aplicado en:
Logo corporativo.
Estado activo del Sidebar (fondo).
Pestaña horizontal activa (fondo).
Botón de acción principal "+ Nuevo Producto".
Valores numéricos de alerta (Stock Bajo y Sin Stock).
Superficies y Fondos:
Fondo global de la app: #F8F9FA (Gris neutro muy claro).
Fondo de Tarjetas, Navbar y Sidebar: #FFFFFF (Blanco puro).
Fondo de campos de búsqueda/filtros: #F1F3F5 (Gris suave).
Bordes y Radios:
Radio estándar: 8px en todos los elementos interactivos y contenedores.
Borde de tarjetas: Sutil (1px solid #E9ECEF) o sombra suave.
2. Estructura de Navegación
A. Navbar Superior (Cabecera Maestra)
Izquierda:
Logo: Icono carmesí + "P&L Manager" + "GESTIÓN PREMIUM" (subtítulo pequeño).
Breadcrumb: Management > Almacén (Gris medio).
Descripción: "Existencias, inventarios, mermas y pedidos." (Fuente: 12px, ubicada justo debajo de la ruta).
Derecha:
Icono de Notificaciones (campana con punto de aviso carmesí).
Icono de Ayuda (interrogación en círculo).
Bloque de Usuario: Avatar circular, Nombre ("Admin User"), Rol ("SUPER ADMIN") y selector desplegable.
B. Sidebar (Navegación Lateral)
Ancho: 240px. Fondo blanco con línea divisoria derecha.
Secciones: Main Menu, Analytics, System (Títulos en mayúsculas, 11px, color gris).
Estado Activo (Almacén): Fondo carmesí, texto e icono en blanco, esquinas redondeadas (8px).
Estados Inactivos: Texto gris oscuro, iconos en gris medio.
3. Área de Contenido (Work Area)
A. Cabecera de Acción (Tabs & CTA)
Pestañas Horizontales: "Existencias" (Activo), "Inventarios", "Mermas", "Pedidos", "Proveedores".
Sin línea divisoria inferior con el panel de filtros para mayor limpieza visual.
Botón Primario: "+ Nuevo Producto" (Carmesí).
Botón Secundario: Icono de descarga/exportar (contorno gris, a la derecha del botón principal).
B. Panel de Filtros (Data Controls)
Contenedor: Tarjeta blanca con radio de 8px.
Campos de Entrada:
BUSCAR: Input con icono de lupa y placeholder "Código, nombre...".
FAMILIA, SECCIÓN, PROVEEDOR: Selectores dropdown.
Estilo: Título del campo en mayúsculas pequeñas (11px, Bold, Gris) sobre la caja de entrada.
C. Tarjeta de Visualización de Datos
Cabecera de KPIs (Métricas):
Indicadores: PRODUCTOS (1,284), STOCK BAJO (12 en carmesí), SIN STOCK (5 en carmesí).
Layout: Label en gris arriba / Cifra destacada abajo.
Cuerpo (Empty State):
Icono central de caja/almacén en gris muy suave.
Título: "No hay productos disponibles" (Fuente: 18px, Semibold).
Descripción: Texto centrado en gris explicando cómo añadir productos o usar filtros.
Botón: "Limpiar filtros" con icono de refrescar (Fondo gris claro, radio 8px).
4. Estándares de Diseño (UX Rules)
Estandarización de Altura: Todos los botones, pestañas, ítems del sidebar e inputs miden exactamente lo mismo en altura (40px) para mantener la armonía.
Espaciado: Padding interno de 24px en las tarjetas principales.
Consistencia: No se utiliza el título de sección "Almacén" en el cuerpo; el contexto es 100% visual a través del sidebar y la navbar.