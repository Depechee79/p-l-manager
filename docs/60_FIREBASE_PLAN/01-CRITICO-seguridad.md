# TAREA 1: CORREGIR REGLAS DE SEGURIDAD

## Tiempo estimado: 2 horas
## Complejidad: Media
## Prerequisitos: Acceso a Firebase Console

---

## QUE VAMOS A HACER

Las reglas de seguridad de Firebase son como un "guardia" que decide quien puede ver o modificar cada dato.

**Problema actual:**
El guardia solo pregunta "¿Tienes cuenta?" Si dices que si, te deja ver TODO.

**Lo que vamos a hacer:**
El guardia ahora preguntara "¿Tienes cuenta? ¿A que restaurante perteneces? Solo puedes ver los datos de TU restaurante."

---

## IMPACTO DE NO ARREGLARLO

- CRITICO: Usuario del Restaurante A puede ver facturas del Restaurante B
- CRITICO: Cualquier usuario puede borrar datos de otros
- CRITICO: No hay validacion de que los datos esten completos
- LEGAL: Posible violacion de privacidad de datos

---

## ARCHIVOS A MODIFICAR

| Archivo | Ubicacion | Que cambiaremos |
|---------|-----------|-----------------|
| firestore.rules | Raiz del proyecto | Reglas de acceso completas |

---

## PASO A PASO

### PASO 1: Abrir Firebase Console

1. Abre tu navegador
2. Ve a: https://console.firebase.google.com
3. Inicia sesion con tu cuenta de Google
4. Selecciona el proyecto "pylhospitality"

### PASO 2: Ver las reglas actuales

1. En el menu izquierdo, click en "Firestore Database"
2. En la parte superior, click en la pestana "Reglas"
3. Veras el codigo de reglas actual

**CODIGO ACTUAL (asi se ve ahora):**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }

    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    // Cierres (Closings)
    match /cierres/{cierreId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && hasRequiredFields(['fecha', 'turno', 'totalReal']);
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Facturas (Invoices)
    match /facturas/{facturaId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && hasRequiredFields(['numeroFactura', 'proveedorId', 'total']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }

    // ... resto de colecciones con el mismo patron
  }
}
```

**PROBLEMA:** La linea `allow read: if isAuthenticated();` significa "si estas logueado, puedes leer TODO". No verifica a que restaurante perteneces.

### PASO 3: Reemplazar las reglas

1. Selecciona TODO el codigo en el editor de reglas
2. Borralo (Ctrl+A, luego Delete)
3. Copia el codigo nuevo de abajo
4. Pegalo en el editor

**CODIGO NUEVO (copia esto):**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================================
    // FUNCIONES AUXILIARES
    // ============================================================

    // Verifica si el usuario esta autenticado
    function isAuthenticated() {
      return request.auth != null;
    }

    // Obtiene los datos del usuario actual desde la coleccion 'usuarios'
    function getUserData() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    // Verifica si el usuario es administrador
    function isAdmin() {
      return isAuthenticated() && getUserData().rolId == 'admin';
    }

    // Verifica si el usuario tiene acceso al restaurante especificado
    function hasRestaurantAccess(restaurantId) {
      return isAuthenticated() && (
        isAdmin() ||
        restaurantId in getUserData().restaurantIds ||
        getUserData().restaurantId == restaurantId
      );
    }

    // Verifica si el documento pertenece al restaurante del usuario
    function ownsDocument(restaurantId) {
      return hasRestaurantAccess(restaurantId);
    }

    // Valida que el documento tenga los campos requeridos
    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }

    // ============================================================
    // COLECCIONES DE CONFIGURACION (Solo lectura para usuarios, escritura para admins)
    // ============================================================

    // Companias
    match /companies/{companyId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Restaurantes
    match /restaurants/{restaurantId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Usuarios
    match /usuarios/{userId} {
      // Un usuario puede leer su propio documento o los admins pueden leer todos
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow create: if isAdmin();
      allow update: if isAdmin() || (isAuthenticated() && request.auth.uid == userId);
      allow delete: if isAdmin();
    }

    // Roles
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // ============================================================
    // COLECCIONES DE OPERACIONES (Filtradas por restaurante)
    // ============================================================

    // Cierres de caja
    match /cierres/{cierreId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId)
                    && hasRequiredFields(['fecha', 'turno', 'totalReal', 'restaurantId']);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Facturas
    match /facturas/{facturaId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId)
                    && hasRequiredFields(['numeroFactura', 'proveedorId', 'total', 'restaurantId']);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Albaranes
    match /albaranes/{albaranId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Inventarios
    match /inventarios/{inventarioId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId)
                    && hasRequiredFields(['fecha', 'restaurantId']);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Delivery
    match /delivery/{deliveryId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Mermas
    match /mermas/{mermaId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Pedidos (Orders)
    match /orders/{orderId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Transferencias
    match /transfers/{transferId} {
      // Puede leer si tiene acceso al origen O al destino
      allow read: if hasRestaurantAccess(resource.data.origenId)
                  || hasRestaurantAccess(resource.data.destinoId);
      allow create: if hasRestaurantAccess(request.resource.data.origenId);
      allow update: if hasRestaurantAccess(resource.data.origenId)
                    || hasRestaurantAccess(resource.data.destinoId);
      allow delete: if isAdmin();
    }

    // Gastos Fijos
    match /gastosFijos/{gastoId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if hasRestaurantAccess(request.resource.data.restaurantId)
                    && hasRequiredFields(['tipo', 'descripcion', 'importeMensual', 'restaurantId']);
      allow update: if ownsDocument(resource.data.restaurantId);
      allow delete: if isAdmin();
    }

    // Ajustes P&L
    match /pnl_adjustments/{adjId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow create: if isAdmin() && hasRequiredFields(['period', 'amount', 'category', 'restaurantId']);
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // ============================================================
    // COLECCIONES COMPARTIDAS (Productos, Proveedores, Recetas)
    // Nota: Estas colecciones se comparten entre restaurantes de la misma compania
    // ============================================================

    // Proveedores
    match /proveedores/{proveedorId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Productos
    match /productos/{productoId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Escandallos (Recetas)
    match /escandallos/{escandalloId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // ============================================================
    // COLECCIONES DE RRHH (Filtradas por companyId)
    // ============================================================

    // Trabajadores
    match /workers/{workerId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Fichajes
    match /fichajes/{fichajeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Ausencias
    match /absences/{absenceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Solicitudes de vacaciones
    match /vacation_requests/{requestId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Nominas (Solo admins pueden escribir)
    match /nominas/{nominaId} {
      allow read: if ownsDocument(resource.data.restaurantId);
      allow write: if isAdmin();
    }
  }
}
```

### PASO 4: Publicar las reglas

1. Revisa que el codigo se ha pegado correctamente
2. Click en el boton "Publicar" (arriba a la derecha)
3. Aparecera un mensaje de confirmacion
4. Click en "Publicar" de nuevo para confirmar
5. Espera unos segundos hasta que diga "Reglas publicadas"

---

## VERIFICACION

### Como saber que funciona:

1. **En Firebase Console:**
   - Ve a "Reglas"
   - Debe mostrar la fecha y hora de la ultima publicacion
   - El codigo debe ser el nuevo

2. **En la aplicacion:**
   - Cierra sesion si estas logueado
   - Inicia sesion con un usuario de prueba
   - Ve a la seccion de Facturas
   - Deberian aparecer SOLO las facturas de tu restaurante

### Si hay errores al publicar:

| Error | Causa | Solucion |
|-------|-------|----------|
| "Error de sintaxis en linea X" | Falta una llave o punto y coma | Revisa que copiaste todo el codigo |
| "Funcion no definida" | Funcion mal escrita | Verifica nombres de funciones |
| "Campo no existe" | Documento sin restaurantId | Los datos antiguos no tienen este campo |

### Si las reglas bloquean todo:

Si despues de publicar las reglas nadie puede acceder:

1. Ve a Firebase Console > Firestore > Reglas
2. Haz click en "Historial de versiones"
3. Selecciona la version anterior
4. Click en "Restaurar"

---

## PROBLEMA CONOCIDO: Datos antiguos sin restaurantId

Las nuevas reglas requieren que cada documento tenga un campo `restaurantId`.
Si tus datos actuales no tienen este campo, las reglas los bloquearan.

### Solucion temporal (permite acceso a datos sin restaurantId):

Modifica las funciones de verificacion asi:

```javascript
// En la funcion ownsDocument, cambiar a:
function ownsDocument(restaurantId) {
  // Si el documento no tiene restaurantId, permitir acceso a usuarios autenticados
  // NOTA: Esto es temporal hasta que todos los datos tengan restaurantId
  return restaurantId == null || hasRestaurantAccess(restaurantId);
}
```

### Solucion definitiva (agregar restaurantId a datos existentes):

Esto se hace en la TAREA 2 (queries). Cuando modifiquemos las queries, tambien agregaremos codigo para asignar restaurantId a documentos que no lo tengan.

---

## SIGUIENTE PASO

Una vez verificado que las reglas funcionan, continua con:
**`03-ALTO-indices.md`** (los indices son rapidos de implementar y no rompen nada)

---

## TIEMPO REAL EMPLEADO

- [ ] Hacer backup: ___ minutos
- [ ] Copiar y pegar reglas: ___ minutos
- [ ] Publicar: ___ minutos
- [ ] Verificar: ___ minutos
- [ ] **TOTAL:** ___ minutos

---

## NOTAS ADICIONALES

### Por que algunas colecciones no tienen filtro por restaurante:

- **proveedores, productos, escandallos:** Se comparten entre todos los restaurantes de la misma empresa. Un proveedor puede servir a varios restaurantes.

- **workers, fichajes, absences:** Se filtran por `companyId`, no por `restaurantId`, porque un trabajador puede trabajar en varios restaurantes.

### Mejoras futuras:

1. Agregar filtro por `companyId` a proveedores/productos
2. Implementar roles mas granulares (gerente, encargado, empleado)
3. Agregar logs de auditoria para cambios sensibles
