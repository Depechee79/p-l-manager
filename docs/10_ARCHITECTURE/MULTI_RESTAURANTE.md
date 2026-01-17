# Propuesta: Sistema Multi-Restaurante

## 1. Arquitectura General

### 1.1 Estructura de Datos

```
Empresa (Company)
├── Perfiles de Usuario (User Profiles)
│   ├── Administrador Empresa
│   ├── Gerente Restaurante
│   ├── Supervisor Multi-Restaurante
│   └── Trabajador
├── Restaurantes (Restaurants)
│   ├── Restaurante A
│   ├── Restaurante B
│   └── Restaurante C
└── Recursos Compartidos
    ├── Trabajadores (Workers)
    ├── Proveedores (Providers)
    └── Productos Base (Base Products)
```

### 1.2 Modelo de Datos

#### Company (Empresa)
```typescript
interface Company {
  id: string;
  nombre: string;
  cif: string;
  direccion: string;
  telefono: string;
  email: string;
  restaurantes: string[]; // IDs de restaurantes
  createdAt: string;
  updatedAt: string;
}
```

#### Restaurant (Restaurante)
```typescript
interface Restaurant {
  id: string;
  companyId: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  codigo: string; // Código único del restaurante
  activo: boolean;
  configuracion: {
    zonaHoraria: string;
    moneda: string;
    ivaRestaurante: number;
    ivaTakeaway: number;
  };
  trabajadores: string[]; // IDs de trabajadores asignados
  createdAt: string;
  updatedAt: string;
}
```

#### User (Usuario/Perfil)
```typescript
interface User {
  id: string;
  companyId: string;
  restaurantes: string[]; // IDs de restaurantes a los que tiene acceso
  email: string;
  nombre: string;
  apellidos: string;
  rol: 'admin_empresa' | 'gerente' | 'supervisor' | 'trabajador';
  permisos: {
    verTodosRestaurantes: boolean;
    editarTodosRestaurantes: boolean;
    gestionarTrabajadores: boolean;
    gestionarTransferencias: boolean;
    verInventariosCruzados: boolean;
  };
  activo: boolean;
  createdAt: string;
}
```

#### Worker (Trabajador)
```typescript
interface Worker {
  id: string;
  companyId: string;
  restaurantes: string[]; // Restaurantes donde puede trabajar
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  email: string;
  puesto: 'camarero' | 'cocinero' | 'barman' | 'supervisor' | 'gerente';
  roles: string[]; // Roles específicos por restaurante
  activo: boolean;
  createdAt: string;
}
```

## 2. Funcionalidades Principales

### 2.1 Gestión de Perfiles Multi-Restaurante

#### 2.1.1 Selección de Restaurante
- **Selector de Restaurante**: Dropdown en el header que permite cambiar entre restaurantes
- **Contexto Global**: El restaurante seleccionado se almacena en el contexto de la app
- **Filtrado Automático**: Todos los datos se filtran automáticamente por restaurante activo

#### 2.1.2 Vista Multi-Restaurante
- **Dashboard Consolidado**: Vista que muestra datos agregados de todos los restaurantes
- **Comparativas**: Comparar métricas entre restaurantes
- **Filtros**: Filtrar por restaurante específico o ver todos

### 2.2 Trabajadores Compartidos

#### 2.2.1 Asignación de Trabajadores
- **Gestión Centralizada**: Los trabajadores se crean a nivel de empresa
- **Asignación Multi-Restaurante**: Un trabajador puede estar asignado a varios restaurantes
- **Roles por Restaurante**: Un trabajador puede tener diferentes roles en cada restaurante

#### 2.2.2 Inventarios por Trabajador
- **Asignación de Zonas**: Cada trabajador puede tener zonas específicas por restaurante
- **Historial de Conteos**: Ver qué trabajador hizo cada inventario en cada restaurante
- **Permisos Granulares**: Controlar qué zonas puede contar cada trabajador

### 2.3 Inventarios Cruzados

#### 2.3.1 Vista Consolidada
- **Inventario Global**: Ver stock de todos los restaurantes en una sola vista
- **Filtros Avanzados**: Filtrar por restaurante, producto, familia, etc.
- **Comparativas**: Comparar stock entre restaurantes

#### 2.3.2 Alertas de Stock
- **Stock Bajo Multi-Restaurante**: Alertas cuando un producto está bajo en cualquier restaurante
- **Sugerencias de Transferencia**: Sugerir transferencias cuando hay exceso en un restaurante y falta en otro

### 2.4 Transferencias de Productos

#### 2.4.1 Crear Transferencia
```typescript
interface Transfer {
  id: string;
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
  trabajadorOrigen: string;
  trabajadorDestino: string;
  estado: 'pendiente' | 'en_transito' | 'completada' | 'cancelada';
  notas: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 2.4.2 Flujo de Transferencia
1. **Crear Solicitud**: Restaurante origen crea solicitud de transferencia
2. **Aprobar**: Restaurante destino aprueba la transferencia
3. **Preparar**: Restaurante origen marca productos como "en tránsito"
4. **Recibir**: Restaurante destino confirma recepción
5. **Completar**: Actualización automática de inventarios

#### 2.4.3 Tracking
- **Estado en Tiempo Real**: Ver estado de cada transferencia
- **Historial**: Historial completo de transferencias entre restaurantes
- **Notificaciones**: Notificaciones cuando hay transferencias pendientes

### 2.5 Proveedores Compartidos

#### 2.5.1 Gestión Centralizada
- **Proveedores de Empresa**: Los proveedores se crean a nivel de empresa
- **Asignación a Restaurantes**: Cada restaurante puede tener proveedores específicos o compartidos
- **Precios por Restaurante**: Mismo proveedor puede tener precios diferentes por restaurante

### 2.6 Productos Base y Variantes

#### 2.6.1 Catálogo Central
- **Productos Base**: Productos definidos a nivel de empresa
- **Variantes por Restaurante**: Cada restaurante puede tener variantes específicas
- **Precios por Restaurante**: Mismo producto puede tener precios diferentes

## 3. Interfaz de Usuario

### 3.1 Header con Selector de Restaurante
```
[Logo] P&L Manager | [Selector Restaurante ▼] | [Usuario] [Notificaciones]
```

### 3.2 Nueva Sección: "Transferencias"
- Lista de transferencias pendientes
- Crear nueva transferencia
- Historial de transferencias
- Filtros por restaurante, fecha, estado

### 3.3 Nueva Sección: "Trabajadores"
- Lista de trabajadores de la empresa
- Asignación a restaurantes
- Roles y permisos
- Historial de actividad

### 3.4 Dashboard Multi-Restaurante
- Métricas consolidadas
- Comparativas entre restaurantes
- Gráficos de rendimiento
- Alertas y notificaciones

## 4. Implementación Técnica

### 4.1 Nuevos Servicios

#### CompanyService
```typescript
class CompanyService {
  createCompany(data: CompanyData): Result<Company>;
  getCompany(id: string): Company | null;
  updateCompany(id: string, data: Partial<Company>): Result<Company>;
  getRestaurants(companyId: string): Restaurant[];
  addRestaurant(companyId: string, restaurant: Restaurant): Result<Restaurant>;
}
```

#### RestaurantService
```typescript
class RestaurantService {
  createRestaurant(companyId: string, data: RestaurantData): Result<Restaurant>;
  getRestaurant(id: string): Restaurant | null;
  updateRestaurant(id: string, data: Partial<Restaurant>): Result<Restaurant>;
  assignWorker(restaurantId: string, workerId: string): Result<void>;
  getWorkers(restaurantId: string): Worker[];
}
```

#### TransferService
```typescript
class TransferService {
  createTransfer(data: TransferData): Result<Transfer>;
  approveTransfer(transferId: string, restaurantId: string): Result<Transfer>;
  completeTransfer(transferId: string): Result<Transfer>;
  getTransfers(restaurantId?: string, filters?: TransferFilters): Transfer[];
  getPendingTransfers(restaurantId: string): Transfer[];
}
```

#### WorkerService
```typescript
class WorkerService {
  createWorker(companyId: string, data: WorkerData): Result<Worker>;
  assignToRestaurant(workerId: string, restaurantId: string, roles: string[]): Result<void>;
  getWorkers(companyId: string, restaurantId?: string): Worker[];
  getWorkerActivity(workerId: string, restaurantId?: string): Activity[];
}
```

### 4.2 Nuevos Hooks

#### useRestaurant
```typescript
const {
  currentRestaurant,
  restaurants,
  setCurrentRestaurant,
  switchRestaurant
} = useRestaurant();
```

#### useTransfers
```typescript
const {
  transfers,
  pendingTransfers,
  createTransfer,
  approveTransfer,
  completeTransfer
} = useTransfers(restaurantId);
```

#### useWorkers
```typescript
const {
  workers,
  createWorker,
  assignToRestaurant,
  getWorkersByRestaurant
} = useWorkers(companyId);
```

### 4.3 Contexto Global

#### RestaurantContext
```typescript
interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  hasAccess: (restaurantId: string) => boolean;
}
```

## 5. Flujos de Usuario

### 5.1 Crear Transferencia
1. Usuario selecciona "Transferencias" → "Nueva Transferencia"
2. Selecciona restaurante origen (si tiene acceso a varios)
3. Selecciona restaurante destino
4. Añade productos y cantidades
5. Selecciona trabajador que prepara
6. Envía solicitud
7. Restaurante destino recibe notificación
8. Restaurante destino aprueba
9. Restaurante origen marca como "en tránsito"
10. Restaurante destino confirma recepción
11. Inventarios se actualizan automáticamente

### 5.2 Asignar Trabajador a Múltiples Restaurantes
1. Administrador va a "Trabajadores"
2. Selecciona trabajador
3. En "Restaurantes Asignados", añade restaurantes
4. Para cada restaurante, asigna roles específicos
5. Guarda cambios

### 5.3 Ver Inventario Cruzado
1. Usuario va a "Almacén"
2. Activa filtro "Vista Multi-Restaurante"
3. Ve tabla con columnas: Producto | Restaurante A | Restaurante B | Restaurante C | Total
4. Puede filtrar por restaurante específico
5. Puede crear transferencia desde la vista

## 6. Consideraciones de Seguridad

### 6.1 Permisos
- **Admin Empresa**: Acceso total a todos los restaurantes
- **Gerente**: Acceso completo a su(s) restaurante(s) asignado(s)
- **Supervisor**: Acceso de lectura a múltiples restaurantes, edición limitada
- **Trabajador**: Acceso limitado a funciones específicas de su restaurante

### 6.2 Auditoría
- Registrar todas las acciones multi-restaurante
- Logs de transferencias
- Historial de cambios de asignación de trabajadores

## 7. Migración de Datos

### 7.1 Estrategia
1. Crear empresa por defecto para instalaciones existentes
2. Crear restaurante por defecto vinculado a la empresa
3. Migrar todos los datos existentes al restaurante por defecto
4. Asignar usuarios existentes a la empresa y restaurante por defecto

### 7.2 Compatibilidad
- Mantener compatibilidad con instalaciones de un solo restaurante
- Si solo hay un restaurante, ocultar selector
- Funcionalidad multi-restaurante opcional

## 8. Roadmap de Implementación

### Fase 1: Base Multi-Restaurante
- [ ] Modelo de datos Company/Restaurant
- [ ] Selector de restaurante en header
- [ ] Filtrado de datos por restaurante
- [ ] Migración de datos existentes

### Fase 2: Trabajadores Compartidos
- [ ] Gestión de trabajadores a nivel empresa
- [ ] Asignación multi-restaurante
- [ ] Roles por restaurante
- [ ] Historial de actividad

### Fase 3: Inventarios Cruzados
- [ ] Vista consolidada de inventarios
- [ ] Comparativas entre restaurantes
- [ ] Alertas de stock cruzadas

### Fase 4: Transferencias
- [ ] Sistema de transferencias
- [ ] Flujo de aprobación
- [ ] Tracking de transferencias
- [ ] Actualización automática de inventarios

### Fase 5: Dashboard Multi-Restaurante
- [ ] Métricas consolidadas
- [ ] Comparativas
- [ ] Gráficos multi-restaurante

## 9. Beneficios

1. **Gestión Centralizada**: Un solo punto de control para múltiples restaurantes
2. **Optimización de Recursos**: Compartir trabajadores y proveedores
3. **Visibilidad Global**: Ver el estado de todos los restaurantes
4. **Transferencias Eficientes**: Mover productos entre restaurantes fácilmente
5. **Escalabilidad**: Fácil añadir nuevos restaurantes
6. **Análisis Comparativo**: Comparar rendimiento entre restaurantes
