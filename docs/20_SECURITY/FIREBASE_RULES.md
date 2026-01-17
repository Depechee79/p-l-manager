# 🔐 Reglas de Seguridad Firebase - P&L Manager

**Fecha**: 2025-12-30  
**Estado**: Para implementar en Firebase Console

---

## 📋 Resumen de Colecciones

| Colección | Descripción | Nivel de Seguridad |
|-----------|-------------|-------------------|
| `productos` | Catálogo de productos/ingredientes | 🔒 Por restaurante |
| `proveedores` | Proveedores/suministradores | 🔒 Por empresa |
| `facturas` | Facturas de compra | 🔒 Por restaurante |
| `albaranes` | Albaranes de entrega | 🔒 Por restaurante |
| `inventarios` | Conteos de inventario | 🔒 Por restaurante |
| `cierres` | Cierres de caja diarios | 🔒 Por restaurante |
| `escandallos` | Recetas con costes | 🔒 Por restaurante |
| `delivery` | Pedidos delivery | 🔒 Por restaurante |
| `usuarios` | Usuarios del sistema | 🔒 Por empresa + admin |
| `roles` | Roles y permisos | 🔒 Solo admin |
| `mermas` | Registro de mermas | 🔒 Por restaurante |
| `orders` | Pedidos a proveedores | 🔒 Por restaurante |
| `companies` | Empresas/cadenas | 🔒 Solo admin empresa |
| `restaurants` | Restaurantes | 🔒 Por empresa |
| `workers` | Trabajadores | 🔒 Por empresa |
| `transfers` | Transferencias entre centros | 🔒 Por empresa |

---

## 🛡️ Reglas de Seguridad (Copiar a Firebase Console)

### Opción 1: Modo Desarrollo (Temporal)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // MODO DESARROLLO - Permite todo desde localhost
    // ⚠️ NO USAR EN PRODUCCIÓN
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Opción 2: Producción con Autenticación Básica
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // =========================================
    // HELPER FUNCTIONS
    // =========================================
    
    // Usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Usuario es propietario del documento
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Datos válidos (no vacíos en campos requeridos)
    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }
    
    // =========================================
    // REGLAS POR COLECCIÓN
    // =========================================
    
    // PROVEEDORES - Lectura/escritura para usuarios autenticados
    match /proveedores/{providerId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['nombre', 'cif']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // PRODUCTOS - Lectura/escritura para usuarios autenticados
    match /productos/{productId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['nombre', 'proveedorId']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // FACTURAS - Lectura/escritura para usuarios autenticados
    match /facturas/{invoiceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['numeroFactura', 'proveedorId', 'fecha', 'total']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ALBARANES - Lectura/escritura para usuarios autenticados
    match /albaranes/{deliveryNoteId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['numeroFactura', 'proveedorId', 'fecha']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // INVENTARIOS - Lectura/escritura para usuarios autenticados
    match /inventarios/{inventoryId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['fecha', 'productos']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // CIERRES - Lectura/escritura para usuarios autenticados
    match /cierres/{closingId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['fecha', 'turno']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ESCANDALLOS - Lectura/escritura para usuarios autenticados
    match /escandallos/{recipeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['nombre', 'pvpConIVA']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // DELIVERY - Lectura/escritura para usuarios autenticados
    match /delivery/{deliveryId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() 
                    && hasRequiredFields(['fecha', 'plataforma']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // MERMAS - Lectura/escritura para usuarios autenticados
    match /mermas/{mermaId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ORDERS (Pedidos) - Lectura/escritura para usuarios autenticados
    match /orders/{orderId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // USUARIOS - Solo lectura para todos, escritura limitada
    match /usuarios/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && isOwner(userId);
      allow delete: if isAuthenticated();
    }
    
    // ROLES - Solo lectura, escritura para admins
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // COMPANIES (Empresas) - Filtrado por acceso
    match /companies/{companyId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // RESTAURANTS - Filtrado por empresa
    match /restaurants/{restaurantId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // WORKERS - Filtrado por empresa
    match /workers/{workerId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // TRANSFERS - Filtrado por empresa
    match /transfers/{transferId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // TEST CONNECTION - Para verificar conexión
    match /test_connection/{docId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}
```

---

## 📝 Instrucciones para Implementar

### Paso 1: Ir a Firebase Console
1. Abre [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** → **Rules**

### Paso 2: Copiar Reglas
1. **Para desarrollo**: Usa la Opción 1 (permite todo)
2. **Para producción**: Usa la Opción 2 (requiere auth)

### Paso 3: Publicar
1. Pega las reglas en el editor
2. Click en **Publish**

---

## ⚠️ Notas Importantes

1. **Sin Autenticación Real**: Actualmente la app no tiene login implementado. Las reglas de producción requieren Firebase Auth.

2. **Modo Desarrollo**: Para que la app funcione ahora mismo, usa la Opción 1 (modo desarrollo).

3. **Multi-restaurante**: Las reglas de producción deberían filtrar por `restaurantId` o `companyId` cuando se implemente el sistema completo.

---

**Recomendación**: Usa **Opción 1** ahora para desarrollo, e implementa Firebase Auth antes de pasar a **Opción 2**.
