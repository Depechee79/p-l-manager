/**
 * Route Metadata Configuration for AppShellV2
 *
 * Defines breadcrumbs, titles, and subtitles for each route.
 * Used by TopbarV2 and PageHeaderV2 to display contextual information.
 */

export interface RouteMeta {
  /** Breadcrumb trail (e.g., ['Management', 'Almacén']) */
  breadcrumb: string[];
  /** Page title */
  title: string;
  /** Short description shown below breadcrumb */
  subtitle: string;
}

/**
 * Route metadata map
 * Key is the pathname (first segment for nested routes)
 */
export const routeMeta: Record<string, RouteMeta> = {
  '/': {
    breadcrumb: ['Home'],
    title: 'Dashboard',
    subtitle: 'Resumen general de operaciones.',
  },
  '/almacen': {
    breadcrumb: ['Management', 'Almacén'],
    title: 'Almacén',
    subtitle: 'Existencias, inventarios, mermas y pedidos.',
  },
  '/docs': {
    breadcrumb: ['Management', 'Docs'],
    title: 'Docs',
    subtitle: 'Facturas, albaranes y cierres escaneados.',
  },
  '/cierres': {
    breadcrumb: ['Operaciones', 'Cierres'],
    title: 'Cierres',
    subtitle: 'Cierres de caja diarios.',
  },
  '/escandallos': {
    breadcrumb: ['Gestión', 'Escandallos'],
    title: 'Escandallos',
    subtitle: 'Recetas y análisis de costes.',
  },
  '/equipo': {
    breadcrumb: ['RRHH', 'Equipo'],
    title: 'Equipo',
    subtitle: 'Gestión del personal.',
  },
  '/pnl': {
    breadcrumb: ['Finanzas', 'P&L'],
    title: 'P&L',
    subtitle: 'Pérdidas y ganancias.',
  },
  '/configuracion': {
    breadcrumb: ['Sistema', 'Configuración'],
    title: 'Configuración',
    subtitle: 'Ajustes del sistema.',
  },
};

/**
 * Get route metadata for a given pathname
 * Falls back to a default if not found
 */
export function getRouteMeta(pathname: string): RouteMeta {
  // Exact match first
  if (routeMeta[pathname]) {
    return routeMeta[pathname];
  }

  // Try first segment match (for nested routes like /almacen/something)
  const firstSegment = '/' + pathname.split('/').filter(Boolean)[0];
  if (routeMeta[firstSegment]) {
    return routeMeta[firstSegment];
  }

  // Default fallback
  return {
    breadcrumb: ['P&L Manager'],
    title: 'P&L Manager',
    subtitle: 'Gestión de restaurantes.',
  };
}
