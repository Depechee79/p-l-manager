# Esquema de Base de Datos - Sistema de Gestión de Restaurante

## Visión General

Este documento describe el esquema completo de la base de datos, incluyendo todas las colecciones, campos, relaciones y reglas de negocio.

**Última actualización:** 2024

## Arquitectura

- **Local-first**: Los datos se almacenan primero en localStorage
- **Cloud sync**: Sincronización bidireccional con Firebase Firestore
- **Validación de integridad**: Validación de foreign keys y relaciones antes de operaciones CRUD

---

## Colecciones

### 1. `productos` (Productos)

Gestión del catálogo de productos/ingredientes del restaurante.

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `number \| string` | ✅ | Identificador único |
| `nombre` | `string` | ✅ | Nombre del producto |
| `categoria` | `string` | ✅ | Categoría general (ej: "Carnes", "Bebidas") |
| `familia` | `string` | ❌ | Familia del producto (ej: "Carnes", "Pescados") |
| `subfamilia` | `string` | ❌ | Subfamilia (ej: "Ternera", "Cerdo") |
| `proveedor` | `string` | ✅ | Nombre del proveedor (denormalizado) |
| `proveedorId` | `number \| string` | ✅ | ID del proveedor (FK → `proveedores.id`) |
| `unidadBase` | `string` | ✅ | Unidad de medida (kg, litros, unidades) |
| `precioCompra` | `number` | ✅ | Precio de compra unitario |
| `esEmpaquetado` | `boolean` | ✅ | Si viene en paquetes/cajas |
| `unidadesPorEmpaque` | `number` | ❌ | Unidades por empaque/pack |
| `unidadesPorPack` | `number` | ❌ | Alias de `unidadesPorEmpaque` |
| `stockActualUnidades` | `number` | ❌ | Stock actual en unidades |
| `stockMinimoUnidades` | `number` | ❌ | Stock mínimo para alertas |
| `alertaStock` | `boolean` | ❌ | Si está en alerta de stock |
| `ultimoPrecio` | `number` | ❌ | Último precio registrado |
| `ultimaFechaCompra` | `string` | ❌ | Fecha de última compra (ISO) |
| `_synced` | `boolean` | ❌ | Estado de sincronización con Firebase |
| `createdAt` | `string` | ❌ | Fecha de creación (ISO) |
| `updatedAt` | `string` | ❌ | Fecha de última actualización (ISO) |

#### Relaciones

- `proveedorId` → `proveedores.id` (REQUIRED)
- Referenciado por:
  - `inventarios.productos[].productoId` (REQUIRED)
  - `escandallos.ingredientes[].productoId` (REQUIRED)
  - `facturas.productos[].productoId` (OPTIONAL)
  - `albaranes.productos[].productoId` (OPTIONAL)

#### Reglas de Negocio

- No se puede eliminar un Product si está referenciado en:
  - Inventarios activos
  - Escandallos
  - Facturas/Albaranes (opcional, solo advierte)
- `proveedor` debe mantenerse sincronizado con `proveedores.nombre`

---

### 2. `proveedores` (Proveedores)

Catálogo de proveedores del restaurante.

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `number \| string` | ✅ | Identificador único |
| `nombre` | `string` | ✅ | Nombre del proveedor |
| `cif` | `string` | ✅ | CIF/NIF del proveedor |
| `direccion` | `string` | ❌ | Dirección |
| `ciudad` | `string` | ❌ | Ciudad |
| `provincia` | `string` | ❌ | Provincia |
| `codigoPostal` | `string` | ❌ | Código postal |
| `telefono` | `string` | ❌ | Teléfono |
| `email` | `string` | ❌ | Email |
| `contacto` | `string` | ✅ | Nombre del contacto |
| `notas` | `string` | ❌ | Notas adicionales |
| `fechaAlta` | `string` | ❌ | Fecha de alta (ISO) |
| `fechaModificacion` | `string` | ❌ | Fecha de modificación (ISO) |
| `_synced` | `boolean` | ❌ | Estado de sincronización |
| `createdAt` | `string` | ❌ | Fecha de creación |
| `updatedAt` | `string` | ❌ | Fecha de actualización |

#### Relaciones

- Referenciado por:
  - `productos.proveedorId` (REQUIRED)
  - `facturas.proveedorId` (REQUIRED)
  - `albaranes.proveedorId` (REQUIRED)

#### Reglas de Negocio

- No se puede eliminar un Provider si está referenciado en:
  - Productos
  - Facturas
  - Albaranes

---

### 3. `facturas` (Facturas)

Facturas de compra recibidas.

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `number \| string` | ✅ | Identificador único |
| `tipo` | `'factura' \| 'albaran'` | ✅ | Tipo de documento |
| `numeroFactura` | `string` | ✅ | Número de factura |
| `proveedor` | `string` | ✅ | Nombre del proveedor (denormalizado) |
| `proveedorId` | `number \| string` | ✅ | ID del proveedor (FK) |
| `fecha` | `string` | ✅ | Fecha de la factura (ISO) |
| `total` | `number` | ✅ | Total de la factura |
| `productos` | `InvoiceProduct[]` | ✅ | Array de productos |
| `confianza` | `number` | ❌ | Nivel de confianza OCR (0-100) |
| `metodoPago` | `string` | ❌ | Método de pago |
| `notas` | `string` | ❌ | Notas adicionales |
| `archivo` | `string` | ❌ | Referencia al archivo escaneado |
| `categoria` | `string` | ❌ | Categoría de gasto |
| `_synced` | `boolean` | ❌ | Estado de sincronización |
| `createdAt` | `string` | ❌ | Fecha de creación |
| `updatedAt` | `string` | ❌ | Fecha de actualización |

#### InvoiceProduct

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | `string` | ✅ | Nombre del producto |
| `cantidad` | `number` | ✅ | Cantidad |
| `unidad` | `string` | ✅ | Unidad de medida |
| `precioUnitario` | `number` | ✅ | Precio unitario |
| `subtotal` | `number` | ✅ | Subtotal |
| `confianza` | `number` | ❌ | Confianza OCR |
| `productoId` | `number \| string` | ❌ | ID del producto (FK → `productos.id`) |

#### Relaciones

- `proveedorId` → `proveedores.id` (REQUIRED)
- `productos[].productoId` → `productos.id` (OPTIONAL)

---

### 4. `albaranes` (Albaranes)

Albaranes de entrega recibidos.

#### Campos

Similar a `facturas`, con los mismos campos y relaciones.

---

### 5. `inventarios` (Inventarios)

Conteos de inventario realizados.

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `number \| string` | ✅ | Identificador único |
| `fecha` | `string` | ✅ | Fecha del inventario (ISO) |
| `nombre` | `string` | ❌ | Nombre del inventario |
| `persona` | `string` | ❌ | Persona que realizó el conteo |
| `zona` | `'bar' \| 'cocina' \| 'camara' \| 'almacen'` | ❌ | Zona de conteo |
| `productos` | `InventoryProductCount[]` | ✅ | Array de conteos |
| `totalItems` | `number` | ✅ | Total de items contados |
| `valorTotal` | `number` | ✅ | Valor total del inventario |
| `notas` | `string` | ❌ | Notas adicionales |
| `_synced` | `boolean` | ❌ | Estado de sincronización |
| `createdAt` | `string` | ❌ | Fecha de creación |
| `updatedAt` | `string` | ❌ | Fecha de actualización |

#### InventoryProductCount

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `productoId` | `number \| string` | ✅ | ID del producto (FK) |
| `nombre` | `string` | ✅ | Nombre del producto |
| `cantidadTotal` | `number` | ❌ | Cantidad total contada |
| `cantidadPack` | `number` | ❌ | Cantidad de packs |
| `unidadesPorPack` | `number` | ❌ | Unidades por pack |
| `precioCompra` | `number` | ✅ | Precio de compra |
| `zona` | `string` | ❌ | Zona de conteo |

#### Relaciones

- `productos[].productoId` → `productos.id` (REQUIRED)

---

### 6. `escandallos` (Escandallos)

Recetas con cálculo de costes (COGS).

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | ✅ | Identificador único |
| `nombre` | `string` | ✅ | Nombre del plato |
| `pvpConIVA` | `number` | ✅ | Precio de venta con IVA |
| `tipoIVA` | `0 \| 4 \| 10 \| 21` | ✅ | Tipo de IVA (%) |
| `pvpNeto` | `number` | ✅ | Precio de venta neto |
| `ingredientes` | `Ingredient[]` | ✅ | Array de ingredientes |
| `costeTotalNeto` | `number` | ✅ | Coste total neto |
| `foodCostPct` | `number` | ✅ | Porcentaje de food cost |
| `margenBrutoPct` | `number` | ✅ | Margen bruto (%) |
| `familia` | `string` | ❌ | Familia del plato |
| `subfamilia` | `string` | ❌ | Subfamilia |
| `alergenos` | `string[]` | ❌ | Array de alérgenos |
| `descripcion` | `string` | ❌ | Descripción |
| `notas` | `string` | ❌ | Notas adicionales |
| `createdAt` | `string` | ✅ | Fecha de creación |
| `updatedAt` | `string` | ✅ | Fecha de actualización |

#### Ingredient

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `string` | ✅ | ID único del ingrediente |
| `productoId` | `string` | ✅ | ID del producto (FK) |
| `productoNombre` | `string` | ✅ | Nombre del producto |
| `cantidad` | `number` | ✅ | Cantidad |
| `unidad` | `string` | ✅ | Unidad de medida |
| `costeUnitario` | `number` | ✅ | Coste unitario |
| `costeTotal` | `number` | ✅ | Coste total |

#### Relaciones

- `ingredientes[].productoId` → `productos.id` (REQUIRED)

---

### 7. `cierres` (Cierres de Caja)

Cierres diarios de caja.

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `number \| string` | ✅ | Identificador único |
| `fecha` | `string` | ✅ | Fecha del cierre (ISO) |
| `turno` | `string` | ✅ | Turno (mañana/tarde/noche) |
| `efectivo` | `number` | ✅ | Efectivo contado |
| `datafonos` | `Datafono[]` | ✅ | Array de datafonos |
| `otrosMetodos` | `OtroMetodo[]` | ✅ | Array de otros métodos |
| `deliverys` | `Delivery[]` | ✅ | Array de deliverys |
| `totalIngresos` | `number` | ✅ | Total de ingresos |
| `diferencia` | `number` | ✅ | Diferencia con POS |
| `notas` | `string` | ❌ | Notas adicionales |
| `_synced` | `boolean` | ❌ | Estado de sincronización |
| `createdAt` | `string` | ❌ | Fecha de creación |
| `updatedAt` | `string` | ❌ | Fecha de actualización |

---

### 8. `usuarios` (Usuarios)

Usuarios del sistema.

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `number \| string` | ✅ | Identificador único |
| `nombre` | `string` | ✅ | Nombre del usuario |
| `email` | `string` | ❌ | Email |
| `telefono` | `string` | ❌ | Teléfono |
| `rolId` | `number \| string` | ✅ | ID del rol (FK → `roles.id`) |
| `activo` | `boolean` | ✅ | Si está activo |
| `fechaCreacion` | `string` | ❌ | Fecha de creación |
| `ultimoAcceso` | `string` | ❌ | Último acceso |
| `_synced` | `boolean` | ❌ | Estado de sincronización |
| `createdAt` | `string` | ❌ | Fecha de creación |
| `updatedAt` | `string` | ❌ | Fecha de actualización |

#### Relaciones

- `rolId` → `roles.id` (REQUIRED)

---

### 9. `roles` (Roles)

Roles y permisos del sistema.

#### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | `number \| string` | ✅ | Identificador único |
| `nombre` | `string` | ✅ | Nombre del rol |
| `descripcion` | `string` | ✅ | Descripción |
| `permisos` | `Permission[]` | ✅ | Array de permisos |
| `zonasInventario` | `('bar' \| 'cocina' \| 'camara' \| 'almacen')[]` | ❌ | Zonas permitidas para inventario |
| `_synced` | `boolean` | ❌ | Estado de sincronización |
| `createdAt` | `string` | ❌ | Fecha de creación |
| `updatedAt` | `string` | ❌ | Fecha de actualización |

#### Relaciones

- Referenciado por:
  - `usuarios.rolId` (REQUIRED)

#### Reglas de Negocio

- No se puede eliminar un Role si está asignado a usuarios

---

## Relaciones Resumen

```
proveedores (1) ──< (N) productos
proveedores (1) ──< (N) facturas
proveedores (1) ──< (N) albaranes
productos (1) ──< (N) inventarios.productos[]
productos (1) ──< (N) escandallos.ingredientes[]
productos (1) ──< (N) facturas.productos[] (opcional)
productos (1) ──< (N) albaranes.productos[] (opcional)
roles (1) ──< (N) usuarios
```

## Validaciones de Integridad

### Foreign Keys Requeridos

- `productos.proveedorId` debe existir en `proveedores`
- `facturas.proveedorId` debe existir en `proveedores`
- `albaranes.proveedorId` debe existir en `proveedores`
- `inventarios.productos[].productoId` debe existir en `productos`
- `escandallos.ingredientes[].productoId` debe existir en `productos`
- `usuarios.rolId` debe existir en `roles`

### Prevención de Eliminaciones

- **Provider**: No se puede eliminar si hay Product o Invoice que lo referencien
- **Product**: No se puede eliminar si está en InventoryItem, Escandallo o InvoiceProduct
- **Role**: No se puede eliminar si hay AppUser que lo use

## Sincronización Firebase

### Estrategia

1. **Escritura**: Local-first, luego sync a Firebase
2. **Lectura**: Merge inteligente con resolución de conflictos
3. **Conflictos**: Firebase gana si `updatedAt` es más reciente
4. **Reintentos**: 3 intentos con backoff exponencial

### Estados de Sincronización

- `_synced: true`: Sincronizado con Firebase
- `_synced: false`: Pendiente de sincronizar
- `_synced: undefined`: No aplica (para nuevos registros)

## Campos Denormalizados

Para mejorar el rendimiento, algunos campos se mantienen denormalizados:

- `productos.proveedor` → `proveedores.nombre`
- `facturas.proveedor` → `proveedores.nombre`
- `albaranes.proveedor` → `proveedores.nombre`

**Nota**: Estos campos deben actualizarse cuando cambia el nombre del proveedor.

## Campos Opcionales vs Requeridos

### Campos Opcionales Legítimos

- `familia`, `subfamilia`: Clasificación opcional
- `stockMinimoUnidades`, `alertaStock`: Para sistema de alertas (puede no estar implementado)
- `ultimoPrecio`: Historial de precios (puede no usarse)
- `archivo`: Referencia a archivos (puede no implementarse)
- `categoria` en facturas: Categorización opcional

### Campos a Revisar

- `fechaAlta` vs `createdAt`: Duplicación
- `fechaModificacion` vs `updatedAt`: Duplicación
- `unidadesPorPack` vs `unidadesPorEmpaque`: Alias, considerar estandarizar

## Mejoras Futuras

1. **Índices**: Añadir índices en Firebase para búsquedas frecuentes
2. **Auditoría**: Log de cambios en registros críticos
3. **Versionado**: Historial de cambios en productos y precios
4. **Soft deletes**: Marcar como eliminado en lugar de borrar físicamente

---

**Mantenido por**: Equipo de Desarrollo  
**Versión del esquema**: 1.0
