# 📊 Backend Test Matrix - P&L Manager

**Fecha**: 2026-01-02  
**Estado**: Completo

---

## Matriz: Use Case → Ramas → Pruebas → Evidencia

### 1. CIERRES DE CAJA

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| C-01 | Crear cierre | Manager | Auth válido | `cierres.CREATE` | L25-30 | Happy | Console log | Cierre creado, synced=true |
| C-02 | Crear cierre sin auth | Anónimo | Sin login | `cierres.CREATE` | L26 | Negativo | permission-denied | Rechazado |
| C-03 | Crear cierre incompleto | Manager | Auth válido | `cierres.CREATE` | L27 | Negativo | Log validación | Error campos requeridos |
| C-04 | Listar cierres | Staff | Auth válido | `cierres.LIST` | L26 | Happy | Datos en UI | Lista de cierres |
| C-05 | Actualizar cierre | Manager | Auth + cierreId | `cierres.UPDATE` | L28 | Happy | Console log | Cierre actualizado |
| C-06 | Eliminar cierre (no admin) | Manager | Auth válido | `cierres.DELETE` | L29 | Negativo | permission-denied | Rechazado |
| C-07 | Eliminar cierre (admin) | Admin | Auth + role=admin | `cierres.DELETE` | L29 | Happy | Console log | Cierre eliminado |

---

### 2. FACTURAS

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| F-01 | Crear factura | Manager | Auth + proveedor existe | `facturas.CREATE` | L33-38 | Happy | Console log | Factura creada |
| F-02 | Crear factura sin proveedor | Manager | proveedorId inválido | `facturas.CREATE` | - | Negativo | Validation error | FK validation fail |
| F-03 | Crear factura sin número | Manager | numeroFactura vacío | `facturas.CREATE` | L35 | Negativo | hasRequiredFields fail | Error campos requeridos |
| F-04 | Listar facturas por período | Manager | Auth válido | `facturas.LIST` + filter | L34 | Happy | UI filtrada | Facturas del período |
| F-05 | Actualizar total factura | Manager | Auth + facturaId | `facturas.UPDATE` | L36 | Happy | Console log | Factura actualizada |
| F-06 | Eliminar factura | Manager | Auth válido | `facturas.DELETE` | L37 | Happy | Console log | Factura eliminada |

---

### 3. PRODUCTOS

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| P-01 | Crear producto | Manager | Auth + proveedor existe | `productos.CREATE` | L55-58 | Happy | Console log | Producto creado |
| P-02 | Crear producto sin proveedor | Manager | proveedorId inválido | `productos.CREATE` | - | Negativo | Validation error | FK validation fail |
| P-03 | Actualizar precio | Manager | productoId existe | `productos.UPDATE` | L57 | Happy | Console log | Precio actualizado |
| P-04 | Eliminar producto usado | Manager | Producto en inventario | `productos.DELETE` | - | Negativo | canDelete=false | Cannot delete: referenced |
| P-05 | Eliminar producto libre | Manager | Sin referencias | `productos.DELETE` | L58 | Happy | Console log | Producto eliminado |

---

### 4. PROVEEDORES

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| PR-01 | Crear proveedor | Manager | Auth válido | `proveedores.CREATE` | L49-52 | Happy | Console log | Proveedor creado |
| PR-02 | Eliminar proveedor con productos | Manager | Productos referenciando | `proveedores.DELETE` | - | Negativo | canDelete=false | Cannot delete: referenced |
| PR-03 | Eliminar proveedor libre | Manager | Sin referencias | `proveedores.DELETE` | L52 | Happy | Console log | Proveedor eliminado |

---

### 5. INVENTARIOS

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| I-01 | Crear inventario | Manager | Auth + productos existen | `inventarios.CREATE` | L67-72 | Happy | Console log | Inventario creado |
| I-02 | Crear inventario con producto inválido | Manager | productoId inexistente | `inventarios.CREATE` | - | Negativo | Validation error | FK validation fail |
| I-03 | Actualizar conteo | Manager | inventarioId existe | `inventarios.UPDATE` | L70 | Happy | Console log | Conteo actualizado |

---

### 6. ESCANDALLOS

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| E-01 | Crear escandallo | Manager | Auth + ingredientes válidos | `escandallos.CREATE` | L61-64 | Happy | Console log | Escandallo creado |
| E-02 | Crear escandallo con ingrediente inválido | Manager | productoId inexistente | `escandallos.CREATE` | - | Negativo | Validation error | FK validation fail |

---

### 7. USUARIOS Y ROLES

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| U-01 | Crear usuario (admin) | Admin | Auth + role=admin | `usuarios.CREATE` | L84 | Happy | Console log | Usuario creado |
| U-02 | Crear usuario (no admin) | Manager | Auth sin rol admin | `usuarios.CREATE` | L84 | Negativo | permission-denied | Rechazado |
| U-03 | Actualizar propio perfil | User | Auth + uid=userId | `usuarios.UPDATE` | L85 | Happy | Console log | Perfil actualizado |
| U-04 | Actualizar otro perfil (no admin) | User | Auth + uid≠userId | `usuarios.UPDATE` | L85 | Negativo | permission-denied | Rechazado |
| U-05 | Actualizar otro perfil (admin) | Admin | Auth + role=admin | `usuarios.UPDATE` | L85 | Happy | Console log | Perfil actualizado |
| U-06 | Eliminar usuario (admin) | Admin | Auth + role=admin | `usuarios.DELETE` | L86 | Happy | Console log | Usuario eliminado |
| U-07 | Escribir rol (admin) | Admin | Auth + role=admin | `roles.WRITE` | L92 | Happy | Console log | Rol modificado |
| U-08 | Escribir rol (no admin) | Manager | Auth sin rol admin | `roles.WRITE` | L92 | Negativo | permission-denied | Rechazado |

---

### 8. GASTOS FIJOS

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| G-01 | Leer gastos | Manager | Auth válido | `gastosFijos.LIST` | L150 | Happy | UI con datos | Lista de gastos |
| G-02 | Crear gasto (admin) | Admin | Auth + role=admin | `gastosFijos.CREATE` | L151 | Happy | Console log | Gasto creado |
| G-03 | Crear gasto (no admin) | Manager | Auth sin rol admin | `gastosFijos.CREATE` | L151 | Negativo | permission-denied | Rechazado |

---

### 9. NÓMINAS

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| N-01 | Leer nóminas | Manager | Auth válido | `nominas.LIST` | L129 | Happy | UI con datos | Lista de nóminas |
| N-02 | Crear nómina (admin) | Admin | Auth + role=admin | `nominas.CREATE` | L130 | Happy | Console log | Nómina creada |
| N-03 | Crear nómina (no admin) | Manager | Auth sin rol admin | `nominas.CREATE` | L130 | Negativo | permission-denied | Rechazado |

---

### 10. TRANSFERS

| ID | Use Case | Actor | Precondiciones | Operación | Regla | Ramas | Evidencia | Resultado Esperado |
|----|----------|-------|----------------|-----------|-------|-------|-----------|-------------------|
| T-01 | Crear transfer | Manager | Auth + restaurantes válidos | `transfers.CREATE` | L107-110 | Happy | Console log | Transfer creado |
| T-02 | Listar transfers | Manager | Auth válido | `transfers.LIST` | L108 | Happy | UI con datos | Lista transfers |

---

## 📈 Resumen de Cobertura

| Área | Total Tests | Happy Path | Negativos | Cobertura |
|------|-------------|------------|-----------|-----------|
| Cierres | 7 | 3 | 4 | ✅ |
| Facturas | 6 | 3 | 3 | ✅ |
| Productos | 5 | 3 | 2 | ✅ |
| Proveedores | 3 | 2 | 1 | ✅ |
| Inventarios | 3 | 2 | 1 | ✅ |
| Escandallos | 2 | 1 | 1 | ✅ |
| Usuarios/Roles | 8 | 4 | 4 | ✅ |
| Gastos Fijos | 3 | 2 | 1 | ✅ |
| Nóminas | 3 | 2 | 1 | ✅ |
| Transfers | 2 | 2 | 0 | ⚠️ |
| **TOTAL** | **42** | **24** | **18** | ✅ |

---

## 🔧 Tests Existentes en Repo

| Archivo | Cobertura | Estado |
|---------|-----------|--------|
| `FirebaseArchitecture.integration.test.ts` | CRUD + Sync | ✅ 726 líneas |
| `FirestoreService.connection.test.ts` | Conexión | ✅ |
| `DatabaseService.test.ts` | Unit tests | ✅ |
| `FinanceService.test.ts` | Cálculos P&L | ✅ |
| `AppContext.test.tsx` | Context | ✅ |
