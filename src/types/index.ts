// ============================================
// DOMAIN TYPES
// ============================================

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: number | string;
  _synced?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Product entity
 */
export interface Product extends BaseEntity {
  nombre: string;
  ean?: string; // Código de barras EAN-13/EAN-8
  categoria: string;
  familia?: string;
  subfamilia?: string;
  proveedor: string;
  proveedorId: number | string;
  unidadBase: string;
  precioCompra: number;
  esEmpaquetado: boolean;
  unidadesPorEmpaque?: number;
  unidadesPorPack?: number; // Alias para compatibilidad
  stockActualUnidades?: number;
  stockMinimoUnidades?: number;
  alertaStock?: boolean;
  ultimoPrecio?: number;
  ultimaFechaCompra?: string;
}

/**
 * Provider entity
 */
export interface Provider extends BaseEntity {
  nombre: string;
  cif: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  telefono?: string;
  email?: string;
  contacto: string;
  notas?: string;
  fechaAlta?: string;
  fechaModificacion?: string;
}

/**
 * Invoice entity
 */
export interface Invoice extends BaseEntity {
  restaurantId?: string | number;
  numero: string;
  fecha: string;
  proveedorId: string | number;
  proveedorNombre: string;
  proveedor?: string; // Legacy support
  baseImponible?: number;
  iva?: number;
  total: number;
  pagado?: boolean;
  fechaPago?: string;
  metodoPago?: 'transferencia' | 'domiciliacion' | 'efectivo' | 'tarjeta' | string;
  categoria?: string;
  status: 'borrador' | 'pendiente' | 'pagada' | 'revisada' | 'punteada' | 'error';
  productos: InvoiceProduct[];
  notas?: string;
  tipo?: 'factura' | 'albaran';
}

/**
 * Product within an invoice
 */
export interface InvoiceProduct {
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
  confianza?: number;
  productoId?: number | string;
  // Traceability & Validation
  recibido?: boolean;
  faltas?: number;
  roturas?: number;
  comentarios?: string;
}

/**
 * Inventory snapshot
 */
export interface InventoryItem extends BaseEntity {
  restaurantId?: string | number; // Added
  fecha: string;
  nombre?: string; // Nombre del inventario (ej: "Inventario Mensual")
  persona?: string; // Persona que realizó el inventario
  zona?: 'bar' | 'cocina' | 'camara' | 'almacen'; // Zona de conteo
  productos: InventoryProductCount[];
  totalItems: number;
  valorTotal: number;
  notas?: string;
}

/**
 * Permission types
 */
export type Permission =
  | 'ocr.view' | 'ocr.create' | 'ocr.edit' | 'ocr.delete'
  | 'cierres.view' | 'cierres.create' | 'cierres.edit' | 'cierres.delete'
  | 'proveedores.view' | 'proveedores.create' | 'proveedores.edit' | 'proveedores.delete'
  | 'almacen.view' | 'almacen.create' | 'almacen.edit' | 'almacen.delete'
  | 'inventarios.view' | 'inventarios.create' | 'inventarios.edit' | 'inventarios.delete'
  | 'escandallos.view' | 'escandallos.create' | 'escandallos.edit' | 'escandallos.delete'
  | 'pnl.view' | 'pnl.export'
  | 'usuarios.view' | 'usuarios.create' | 'usuarios.edit' | 'usuarios.delete'
  | 'configuracion.view' | 'configuracion.edit'
  | 'personal.view' | 'personal.edit'
  | 'dashboard.view';

/**
 * Role definition
 */
export interface Role extends BaseEntity {
  nombre: string;
  descripcion: string;
  permisos: Permission[];
  zonasInventario?: ('bar' | 'cocina' | 'camara' | 'almacen')[];
}

/**
 * App User with role
 */
export interface AppUser extends BaseEntity {
  nombre: string;
  email?: string;
  telefono?: string;
  rolId: number | string;
  restaurantes?: string[]; // IDs de restaurantes permitidos
  activo: boolean;
  fechaCreacion?: string;
  ultimoAcceso?: string;
}

/**
 * Merma entity
 */
export interface Merma extends BaseEntity {
  restaurantId?: string | number;
  fecha: string;
  productoId: string | number;
  productoNombre: string;
  cantidad: number;
  unidad: string;
  motivo: string;
  valorPerdido: number;
  zona?: 'bar' | 'cocina' | 'camara' | 'almacen';
  responsable?: string;
  notas?: string;
}

/**
 * Order entity
 */
export interface Order extends BaseEntity {
  restaurantId?: string | number;
  fecha: string;
  fechaEntrega?: string;
  proveedorId: string | number;
  proveedorNombre: string;
  productos: OrderProduct[];
  total: number;
  estado: 'borrador' | 'enviado' | 'recibido' | 'cancelado';
  notas?: string;
}

/**
 * Product in an order
 */
export interface OrderProduct {
  productoId: string | number;
  nombre: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Product count in inventory
 */
export interface InventoryProductCount {
  productoId: number | string;
  nombre: string;
  stockTeorico: number;
  stockReal: number;
  diferencia: number;
  valorDiferencia: number;
  precioCompra: number;
}

/**
 * Company (Empresa) - Multi-restaurant support
 */
export interface Company extends BaseEntity {
  nombre: string;
  razonSocial?: string;
  cif: string;
  direccion: string;
  telefono?: string;
  email?: string;
  restaurantes: string[]; // IDs de restaurantes
}

/**
 * Restaurant (Restaurante) - Multi-restaurant support
 */
export interface Restaurant extends BaseEntity {
  companyId: string;
  nombre: string;
  razonSocial?: string;
  cif?: string;
  direccion: string;
  telefono?: string;
  email?: string;
  codigo: string; // Código único del restaurante
  activo: boolean;
  configuracion: {
    zonaHoraria: string;
    moneda: string;
    ivaRestaurante: number;
    ivaTakeaway: number;
  };
  trabajadores: string[]; // IDs de trabajadores asignados
}

/**
 * Transfer (Traspaso entre centros)
 */
export interface Transfer extends BaseEntity {
  companyId: string;
  restauranteOrigen: string;
  restauranteDestino: string;
  fecha: string;
  productos: {
    productoId: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
  }[];
  trabajadorOrigen?: string;
  trabajadorDestino?: string;
  estado: 'pendiente' | 'en_transito' | 'completada' | 'cancelada';
  notas?: string;
}

/**
 * Worker (Trabajador compartido)
 */
export interface Worker extends BaseEntity {
  companyId: string;
  restaurantes: string[]; // Restaurantes donde puede trabajar
  nombre: string;
  apellidos: string;
  dni?: string;
  telefono?: string;
  email?: string;
  puesto: 'camarero' | 'cocinero' | 'barman' | 'supervisor' | 'gerente';
  roles: string[]; // Roles específicos por restaurante
  activo: boolean;
}

/**
 * Cash denomination breakdown
 */
export interface CashBreakdown {
  b500?: number; // 500€ bills
  b200?: number; // 200€ bills
  b100?: number; // 100€ bills
  b50?: number; // 50€ bills
  b20?: number; // 20€ bills
  b10?: number; // 10€ bills
  b5?: number; // 5€ bills
  m2?: number; // 2€ coins
  m1?: number; // 1€ coins
  m050?: number; // 0.50€ coins
  m020?: number; // 0.20€ coins
  m010?: number; // 0.10€ coins
  m005?: number; // 0.05€ coins
  m002?: number; // 0.02€ coins
  m001?: number; // 0.01€ coins
}

/**
 * Card terminal (Datafono)
 */
export interface Datafono {
  terminal: string;
  importe: number;
}

/**
 * Other payment method
 */
export interface OtroMedio {
  medio: string;
  importe: number;
}

/**
 * Financial closing (Cierre)
 */
export interface Cierre extends BaseEntity {
  restaurantId?: string | number; // Added
  fecha: string;
  turno: string;

  // Counted cash
  efectivoContado: number;
  desgloseEfectivo: Partial<CashBreakdown>;

  // Card terminals
  datafonos: Datafono[];
  totalDatafonos: number;

  // Other payment methods
  otrosMedios: OtroMedio[];
  totalOtrosMedios: number;

  // Delivery
  realDelivery: number;

  // POS data
  posEfectivo: number;
  posTarjetas: number;
  posDelivery: number;
  posTickets: number;
  posExtras: number;

  // Totals
  totalReal: number;
  totalPos: number;
  descuadreTotal: number;
  propina?: number;
  notasDescuadre?: string;
}

export * from './escandallo.types';
export * from './personal.types';
export * from './gastos.types';


/**
 * Delivery record
 */
export interface DeliveryRecord extends BaseEntity {
  restaurantId?: string | number;
  fecha: string;
  plataforma: 'Glovo' | 'Uber Eats' | 'Just Eat' | 'Propio';
  ventaBruta: number;
  comision: number;
  comisionPct: number;
  ventaNeta: number;
  pedidos: number;
  ticketMedio: number;
  ajustes?: number;
  notas?: string;
}

/**
 * Product in delivery order
 */
export interface DeliveryProduct {
  nombre: string;
  cantidad: number;
  precio: number;
}

// ============================================
// FUNCTION RETURN TYPES
// ============================================

/**
 * Result of OCR extraction from invoice
 */
export interface ExtractedInvoiceData {
  numeroFactura: string;
  proveedor: string;
  fecha: string;
  total: number;
  productos: InvoiceProduct[];
  confianza: number;
  metadata?: {
    method: 'embedded-text' | 'ocr' | 'manual';
    processingTime?: number;
    rawText?: string;
  };
}

/**
 * Firebase operation result
 */
export interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Period filter options
 */
export type Period = 'dia' | 'semana' | 'mes' | 'anio' | 'todo';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort state for tables
 */
export interface SortState {
  column: string;
  direction: SortDirection;
}

/**
 * Database collection names
 */
export type CollectionName =
  | 'productos'
  | 'proveedores'
  | 'facturas'
  | 'albaranes'
  | 'inventarios'
  | 'cierres'
  | 'escandallos'
  | 'delivery'
  | 'usuarios'
  | 'roles'
  | 'companies'
  | 'restaurants'
  | 'transfers'
  | 'workers'
  | 'mermas'
  | 'orders'
  | 'pnl_adjustments'
  | 'absences'
  | 'vacation_requests'
  | 'gastosFijos'
  | 'nominas'
  | 'fichajes';

/**
 * View names in the application
 */
export type ViewName =
  | 'ocr'
  | 'inventario'
  | 'facturas'
  | 'albaranes'
  | 'cierres'
  | 'productos'
  | 'proveedores'
  | 'escandallos'
  | 'delivery';

/**
 * Calculation result for financial metrics
 */
export interface FinancialMetrics {
  ventas: number;
  costosMercancia: number;
  beneficioBruto: number;
  margenBruto: number;
  foodCost: number;
  costosOperativos?: number;
  costosPersonal?: number;
  restaurantId?: string | number;
  nombreRestaurante?: string;
}

// ============================================
// UI TYPES
// ============================================

export type ComponentSize = 'sm' | 'md' | 'lg';
export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning';
