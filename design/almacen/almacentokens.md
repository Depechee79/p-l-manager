Este es el archivo de estilos CSS (Design System Tokens) extraído directamente de la pantalla maestra de Almacén. Está diseñado utilizando variables personalizadas para que puedas asegurar una consistencia absoluta en toda la plataforma.

/* 
  P&L MANAGER - DESIGN SYSTEM TOKENS 
  Fidelidad 100% con el Master Layout de Almacén
*/

:root {
  /* --- PALETA DE COLORES --- */
  --crimson-primary: #D81E5B;       /* Color de marca, activos y CTAs */
  --crimson-hover: #B5194D;         /* Estado hover para botones */
  
  --bg-global: #F8F9FA;             /* Fondo de la aplicación */
  --bg-card: #FFFFFF;               /* Fondo de tarjetas, navbar y sidebar */
  --bg-input: #F1F3F5;              /* Fondo de inputs y filtros */
  
  --text-main: #212529;             /* Texto principal / Títulos */
  --text-muted: #6C757D;            /* Texto secundario / Labels / Breadcrumbs */
  --text-white: #FFFFFF;            /* Texto sobre fondos oscuros */
  
  --status-red: #D81E5B;            /* Alertas de Stock Bajo / Sin Stock */
  --border-light: #E9ECEF;          /* Divisores y bordes sutiles */

  /* --- TOKENS DE DIMENSIÓN --- */
  --radius-std: 8px;                /* Redondeado estándar para TODO el sistema */
  --control-h: 40px;                /* Altura estándar: Botones, Tabs, Sidebar e Inputs */
  --nav-h: 72px;                    /* Altura de la Navbar superior */
  --sidebar-w: 240px;               /* Ancho del menú lateral */
  
  /* --- SOMBRAS --- */
  --shadow-card: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* --- ESTILOS BASE DE COMPONENTES --- */

/* 1. Botón Primario y Elementos Interactivos */
.btn-primary, 
.tab-item, 
.sidebar-item, 
.input-box {
  height: var(--control-h);
  border-radius: var(--radius-std);
  display: flex;
  align-items: center;
  font-family: 'Inter', sans-serif; /* O tu fuente sans-serif corporativa */
  font-size: 14px;
  border: none;
  transition: all 0.2s ease-in-out;
}

/* 2. Botón de Acción Principal (+ Nuevo) */
.btn-primary {
  background-color: var(--crimson-primary);
  color: var(--text-white);
  padding: 0 20px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: var(--crimson-hover);
}

/* 3. Pestañas Horizontales (Tabs) */
.tabs-nav {
  display: flex;
  gap: 8px;
}

.tab-item {
  padding: 0 16px;
  color: var(--text-main);
  background: transparent;
  cursor: pointer;
  text-decoration: none;
}

.tab-item.active {
  background-color: var(--crimson-primary);
  color: var(--text-white);
}

/* 4. Inputs y Filtros */
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-box {
  background-color: var(--bg-input);
  padding: 0 12px;
  width: 100%;
  color: var(--text-main);
}

/* 5. Cabecera de KPIs (Indicadores en Tarjeta) */
.kpi-header {
  display: flex;
  gap: 40px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.kpi-unit .kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  display: block;
  margin-bottom: 2px;
}

.kpi-unit .kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
}

/* Alertas de color en KPIs */
.kpi-unit.alert .kpi-value {
  color: var(--status-red);
}

/* 6. Sidebar Active State */
.sidebar-item.active {
  background-color: var(--crimson-primary);
  color: var(--text-white);
}
Notas para la implementación:
Consistencia Visual: He forzado la variable --control-h: 40px. Esto garantiza que, al poner un botón al lado de una pestaña o un input, todos tengan exactamente la misma altura y alineación, tal como en el diseño de Almacén.
Jerarquía: Los labels de los filtros y KPIs usan text-transform: uppercase y un tamaño de 11px para mantener ese look administrativo limpio y profesional.
Espaciado Dinámico: Las tarjetas deben usar un padding: 24px para mantener el "aire" necesario que hemos definido en el diseño maestro.
¿Deseas que genere el arch