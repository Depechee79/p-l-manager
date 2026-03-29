Especificación Técnica: Módulo de Documentos (Docs) - P&L Manager
1. Identidad Visual y Estilos Globales
Color Primario (Crimson): #D81E5B. Utilizado en:
Logo "P&L Manager".
Fondo de Pestañas activas y Botón principal "+ Nuevo".
Indicador de estado activo en Sidebar.
Valor numérico de métricas de alerta (ej. Pendientes).
Superficies:
Fondo de aplicación: #F8F9FA.
Fondo de tarjetas y Navbar: #FFFFFF.
Fondo de Inputs/Filtros: #F1F3F5.
Bordes: Radio estándar de 8px en todos los componentes interactivos y contenedores.
2. Estructura de la Navegación (Header & Sidebar)
A. Navbar Superior (Ancho Completo)
Izquierda:
Logo Carmesí + texto.
Breadcrumb: Management > Docs.
Descripción de Sección: "Facturas, albaranes y cierres escaneados." (Fuente: 12px, Color: #6C757D, ubicada bajo la ruta).
Derecha:
Icono de Notificaciones (Badge carmesí).
Bloque de Usuario: Avatar circular, Nombre ("Admin User") y Rol ("SUPER ADMIN"). Incluye menú desplegable para "Cerrar sesión".
B. Sidebar Lateral
Ancho: 240px.
Módulo Activo (Docs): Fondo carmesí, icono y texto en blanco, radio de 8px.
Módulos Inactivos: Texto e icono en gris oscuro/medio sobre fondo transparente.
3. Lógica del Área de Contenido
A. Barra de Navegación y Acción
Pestañas (Tabs): Fila de botones redondeados (Todos, Recientes, Facturas, Albaranes, Tickets, Cierres).
Acción Primaria: Botón "+ Nuevo" alineado a la derecha de las pestañas. Altura: 40px.
Línea Divisoria: Eliminada para dar continuidad visual con la tarjeta de filtros.
B. Tarjeta de Filtros (Control de Datos)
Configuración: Caja blanca con sombra mínima.
Campos de Entrada:
BUSCAR (Input con lupa), TIPO (Dropdown), FECHA (Dropdown).
Estilo: Título en mayúsculas (11px, Bold, Gris) sobre caja de fondo gris suave (#F1F3F5).
C. Tarjeta de Visualización (Cuerpo)
Cabecera de KPIs:
Integrada en el borde superior de la tarjeta.
Métricas: TOTAL DOCS (Valor neutro) y PENDIENTES (Valor en carmesí).
Formato: Etiqueta pequeña arriba / Cifra grande en negrita abajo.
Estado Vacío (Empty State):
Icono de documento centrado.
Texto: "No hay documentos disponibles".
Botón secundario: "Limpiar filtros" (Estilo link o borde fino gris).
4. Estándares de Implementación
Espaciado (Padding): 24px en el interior de todas las tarjetas principales.
Gaps: 16px entre elementos de filtrado.
Jerarquía: No se utiliza título H1 interno; la navegación se resuelve mediante el Sidebar y la Navbar superior.
Esta documentación garantiza que cualquier desarrollador pueda replicar la pantalla con una fidelidad del 100% respecto al diseño que hemos validado.