# 🗺️ Backend Branch Map - P&L Manager

**Fecha**: 2026-01-02  
**Estado**: Completo

---

## 📋 Áreas de Negocio

### 1. CIERRES (Cash Closings)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear cierre | `cierres/{id}` | CREATE |
| Leer cierres | `cierres` | LIST |
| Actualizar cierre | `cierres/{id}` | UPDATE |
| Eliminar cierre | `cierres/{id}` | DELETE |

**Condiciones de Seguridad:**
- `isAuthenticated()` para read/create/update
- `isAdmin()` para delete (datos financieros)
- Campos requeridos: `fecha`, `turno`, `totalReal`

**Estados:**
- Ninguno explícito (sin workflow de estados)

**Errores Esperables:**
- `permission-denied` si no autenticado
- `permission-denied` en delete si no admin
- `invalid-argument` si faltan campos requeridos
- Index requerido: `restaurantId + fecha`

---

### 2. FACTURAS (Invoices)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear factura | `facturas/{id}` | CREATE |
| Leer facturas | `facturas` | LIST |
| Actualizar factura | `facturas/{id}` | UPDATE |
| Eliminar factura | `facturas/{id}` | DELETE |

**Condiciones de Seguridad:**
- `isAuthenticated()` para todas las operaciones
- Campos requeridos: `numeroFactura`, `proveedorId`, `total`

**Validaciones DatabaseService:**
- `proveedorId` debe existir en `proveedores`
- `productos[].productoId` debe existir (OPCIONAL)

**Estados:**
- `tipo: 'factura' | 'albaran'`

**Errores Esperables:**
- `permission-denied` si no autenticado
- `Validation failed: proveedorId does not exist`
- Index requerido: `restaurantId + fecha`

---

### 3. PRODUCTOS (Products)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear producto | `productos/{id}` | CREATE |
| Leer productos | `productos` | LIST |
| Actualizar producto | `productos/{id}` | UPDATE |
| Eliminar producto | `productos/{id}` | DELETE |

**Condiciones de Seguridad:**
- `isAuthenticated()` para todas las operaciones

**Validaciones DatabaseService:**
- `proveedorId` debe existir en `proveedores` (REQUIRED)
- No se puede eliminar si está referenciado en:
  - `inventarios.productos[].productoId`
  - `escandallos.ingredientes[].productoId`
  - `facturas.productos[].productoId`

**Errores Esperables:**
- `Cannot delete: referenced by inventarios[X].productos`
- `Validation failed: proveedorId does not exist`

---

### 4. PROVEEDORES (Providers)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear proveedor | `proveedores/{id}` | CREATE |
| Leer proveedores | `proveedores` | LIST |
| Actualizar proveedor | `proveedores/{id}` | UPDATE |
| Eliminar proveedor | `proveedores/{id}` | DELETE |

**Validaciones DatabaseService:**
- No se puede eliminar si está referenciado en:
  - `productos.proveedorId`
  - `facturas.proveedorId`

**Errores Esperables:**
- `Cannot delete: referenced by productos[X].proveedorId`

---

### 5. INVENTARIOS (Inventory)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear inventario | `inventarios/{id}` | CREATE |
| Leer inventarios | `inventarios` | LIST |
| Actualizar inventario | `inventarios/{id}` | UPDATE |
| Eliminar inventario | `inventarios/{id}` | DELETE |

**Condiciones de Seguridad:**
- `isAuthenticated()` para todas las operaciones
- Campos requeridos: `fecha`

**Validaciones DatabaseService:**
- `productos[].productoId` debe existir en `productos`

**Errores Esperables:**
- `Validation failed: productoId X does not exist in productos`

---

### 6. ESCANDALLOS (Recipes)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear escandallo | `escandallos/{id}` | CREATE |
| Leer escandallos | `escandallos` | LIST |
| Actualizar escandallo | `escandallos/{id}` | UPDATE |
| Eliminar escandallo | `escandallos/{id}` | DELETE |

**Validaciones DatabaseService:**
- `ingredientes[].productoId` debe existir en `productos`

**Errores Esperables:**
- `Validation failed: productoId X in ingredientes does not exist`

---

### 7. USUARIOS / ROLES (Users/Auth)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear usuario | `usuarios/{id}` | CREATE (admin only) |
| Leer usuarios | `usuarios` | LIST |
| Actualizar usuario | `usuarios/{id}` | UPDATE (self or admin) |
| Eliminar usuario | `usuarios/{id}` | DELETE (admin only) |
| Leer roles | `roles` | LIST |
| Escribir roles | `roles/{id}` | WRITE (admin only) |

**Condiciones de Seguridad:**
- `usuarios.update`: `isAdmin() OR request.auth.uid == userId`
- `roles.write`: `isAdmin()` only

**Validaciones DatabaseService:**
- `rolId` debe existir en `roles`

**Errores Esperables:**
- `permission-denied` en create/delete si no admin
- `permission-denied` en update de otro usuario

---

### 8. GASTOS FIJOS (Fixed Costs)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Leer gastos | `gastosFijos` | LIST |
| Escribir gastos | `gastosFijos/{id}` | WRITE (admin only) |

**Condiciones de Seguridad:**
- `isAdmin()` para write

**Impacto:**
- Afecta directamente cálculos P&L

---

### 9. NOMINAS (Payroll)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Leer nóminas | `nominas` | LIST |
| Escribir nóminas | `nominas/{id}` | WRITE (admin only) |

**Condiciones de Seguridad:**
- `isAdmin()` para write

**Index:**
- `restaurantId + periodo`

---

### 10. TRANSFERS (Inter-restaurant)

**Operaciones Firestore:**
| Operación | Path | Tipo |
|-----------|------|------|
| Crear transfer | `transfers/{id}` | CREATE |
| Leer transfers | `transfers` | LIST |
| Actualizar transfer | `transfers/{id}` | UPDATE |

**Campos requeridos (validation):**
- `origenId`, `destinoId`, `items`

---

## 🌳 Árbol de Decisiones por Operación

### CREATE Flow
```
1. Usuario intenta crear documento
   ├── ¿Autenticado? 
   │   ├── NO → permission-denied
   │   └── SÍ → continuar
   │
2. ¿Tiene campos requeridos?
   ├── NO → invalid-argument / validation error
   │   └── hasRequiredFields(['campo1', 'campo2'])
   └── SÍ → continuar
   │
3. ¿Foreign keys válidos?
   ├── NO → Validation failed: FK does not exist
   │   └── DatabaseService.validateForeignKey()
   └── SÍ → crear documento
   │
4. Sync a Firebase
   ├── ÉXITO → _synced = true
   └── FALLO → retry (3 attempts, exponential backoff)
```

### DELETE Flow
```
1. ¿Autenticado?
   ├── NO → permission-denied
   └── SÍ → continuar
   │
2. ¿Admin requerido? (cierres, usuarios, roles, gastosFijos, nominas)
   ├── SÍ → ¿Es admin?
   │   ├── NO → permission-denied
   │   └── SÍ → continuar
   └── NO → continuar
   │
3. ¿Hay referencias activas?
   ├── SÍ → Cannot delete: referenced by...
   │   └── DataIntegrityService.canDelete()
   └── NO → eliminar documento
```

---

## 🔐 Tokens/Claims Esperados

| Claim | Uso | Dónde se verifica |
|-------|-----|-------------------|
| `request.auth.uid` | User ID | `usuarios` update |
| `request.auth.token.role` | Admin check | `isAdmin()` |

---

## 📈 Índices Compuestos Requeridos

| Colección | Campos | Query Scope |
|-----------|--------|-------------|
| `cierres` | `restaurantId ASC, fecha DESC` | COLLECTION |
| `facturas` | `restaurantId ASC, fecha DESC` | COLLECTION |
| `nominas` | `restaurantId ASC, periodo DESC` | COLLECTION |
