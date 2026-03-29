AUDITORÍA FIREBASE CONSOLE — PROYECTO P&LHospitality
Fecha de auditoría: 17 de enero de 2026
Project ID: pylhospitality
Región: eur3 (europe-west3)
Plan: Spark (gratuito)

1. CONFIGURACIÓN DEL PROYECTO
CampoValorProject IDpylhospitalityProject Number879aborradoDefault GCP Resource Locationeur3 (europe-west3)Web API KeyAIzaSyAQ0K0tB15FoOGCh8Fv5bVbAUb8b7HocU4PlanSpark (gratuito)
SDK Configuration (Web App: p&lhospitality)
javascriptconst firebaseConfig = {
  apiKey: "AIzaSyAQ0K0tB15FoOGCh8Fv5bVbAUb8b7HocU4",
  authDomain: "pylhospitality.firebaseapp.com",
  projectId: "pylhospitality",
  storageBucket: "pylhospitality.firebasestorage.app",
  messagingSenderId: "8790",
  appId: "1:87954:web:07e4borrado"
};

2. COLECCIONES Y ESTRUCTURA DE DATOS
2.1 Colección: cierres
Descripción: Registros de cierres de caja diarios
Documento ejemplo:
json{
  "restaurantId": "rest_asador_ejemplo",
  "fecha": Timestamp (2025-01-15),
  "efectivoInicial": 200,
  "efectivoFinal": 1523.50,
  "tarjeta": 2341.00,
  "totalVentas": 3664.50,
  "diferencia": 0,
  "observaciones": "Cierre sin incidencias",
  "creadoPor": "user_uid_123",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
2.2 Colección: companies
Descripción: Empresas/grupos empresariales
Documento ejemplo:
json{
  "id": "comp_plhospitality",
  "name": "P&L Hospitality Group",
  "legalName": "P&L Hospitality S.L.",
  "cif": "B12345678",
  "address": "Calle Principal 123, Madrid",
  "email": "admin@plhospitality.com",
  "phone": "+34 912 345 678",
  "restaurants": ["rest_asador_ejemplo", "rest_cafe_centro"],
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "active": true
}
2.3 Colección: facturas
Descripción: Facturas de proveedores
Documento ejemplo:
json{
  "restaurantId": "rest_asador_ejemplo",
  "proveedorId": "prov_distribuidora_norte",
  "proveedorNombre": "Distribuidora Norte S.L.",
  "numero": "FAC-2025-00123",
  "fecha": Timestamp (2025-01-14),
  "fechaVencimiento": Timestamp (2025-02-14),
  "subtotal": 1250.00,
  "iva": 262.50,
  "total": 1512.50,
  "estado": "pendiente",
  "productos": [
    {"nombre": "Aceite de oliva", "cantidad": 20, "precioUnitario": 8.50, "total": 170.00},
    {"nombre": "Arroz", "cantidad": 50, "precioUnitario": 2.20, "total": 110.00}
  ],
  "documentoUrl": "gs://pylhospitality.../facturas/FAC-2025-00123.pdf",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
2.4 Colección: inventarios
Descripción: Inventarios periódicos de productos
Documento ejemplo:
json{
  "restaurantId": "rest_asador_ejemplo",
  "fecha": Timestamp (2025-01-15),
  "periodo": "2025-01",
  "tipo": "mensual",
  "estado": "completado",
  "items": [
    {"productoId": "prod_001", "nombre": "Aceite de oliva", "cantidadSistema": 15, "cantidadReal": 14, "diferencia": -1, "valorUnitario": 8.50, "valorDiferencia": -8.50},
    {"productoId": "prod_002", "nombre": "Arroz", "cantidadSistema": 45, "cantidadReal": 45, "diferencia": 0, "valorUnitario": 2.20, "valorDiferencia": 0}
  ],
  "valorTotalDiferencias": -8.50,
  "observaciones": "Falta 1 unidad de aceite - posible rotura",
  "realizadoPor": "user_uid_456",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
2.5 Colección: productos
Descripción: Catálogo de productos
Documento ejemplo:
json{
  "id": "prod_aceite_oliva_01",
  "nombre": "Aceite de Oliva Virgen Extra",
  "categoria": "Aceites y grasas",
  "subcategoria": "Aceites",
  "unidadMedida": "litros",
  "precioCompra": 8.50,
  "stockMinimo": 10,
  "stockActual": 14,
  "proveedor": "prov_distribuidora_norte",
  "codigoBarras": "8412345678901",
  "active": true,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
2.6 Colección: proveedores
Descripción: Proveedores de productos
Documento ejemplo:
json{
  "id": "prov_distribuidora_norte",
  "nombre": "Distribuidora Norte S.L.",
  "cif": "B87654321",
  "direccion": "Polígono Industrial Norte, Nave 15",
  "ciudad": "Madrid",
  "codigoPostal": "28001",
  "telefono": "+34 911 234 567",
  "email": "pedidos@distribuidoranorte.com",
  "personaContacto": "Juan García",
  "categorias": ["Aceites y grasas", "Conservas", "Legumbres"],
  "condicionesPago": "30 días",
  "diasEntrega": ["lunes", "miércoles", "viernes"],
  "active": true,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
2.7 Colección: restaurants
Descripción: Restaurantes de la cadena
Documento ejemplo:
json{
  "id": "rest_asador_ejemplo",
  "name": "Asador El Ejemplo",
  "companyId": "comp_plhospitality",
  "address": "Calle del Restaurante 45, Madrid",
  "city": "Madrid",
  "postalCode": "28002",
  "phone": "+34 910 111 222",
  "email": "asador@plhospitality.com",
  "manager": "user_uid_manager",
  "employees": ["user_uid_001", "user_uid_002", "user_uid_003"],
  "active": true,
  "horario": {
    "lunes": {"apertura": "12:00", "cierre": "00:00"},
    "martes": {"apertura": "12:00", "cierre": "00:00"}
  },
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
2.8 Colección: roles
Descripción: Definición de roles y permisos
Documento ejemplo:
json{
  "id": "role_admin",
  "name": "Administrador",
  "description": "Acceso total al sistema",
  "permissions": [
    "users:read", "users:write", "users:delete",
    "restaurants:read", "restaurants:write",
    "facturas:read", "facturas:write", "facturas:delete",
    "inventarios:read", "inventarios:write",
    "cierres:read", "cierres:write",
    "proveedores:read", "proveedores:write",
    "productos:read", "productos:write",
    "reports:read", "reports:export",
    "settings:read", "settings:write"
  ],
  "level": 100,
  "active": true,
  "createdAt": Timestamp
}
2.9 Colección: users
Descripción: Usuarios del sistema
Documento ejemplo:
json{
  "uid": "firebase_auth_uid_123",
  "email": "usuario@plhospitality.com",
  "displayName": "Juan Pérez",
  "role": "admin",
  "roleId": "role_admin",
  "companyId": "comp_plhospitality",
  "restaurantIds": ["rest_asador_ejemplo", "rest_cafe_centro"],
  "phone": "+34 600 123 456",
  "avatar": "https://...",
  "active": true,
  "lastLogin": Timestamp,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}

3. ÍNDICES COMPUESTOS
#ColecciónCampo 1Orden 1Campo 2Orden 2Estado1cierresrestaurantIdASCfechaDESC✅ Habilitado2facturasrestaurantIdASCfechaDESC✅ Habilitado3facturasproveedorIdASCfechaDESC✅ Habilitado4inventariosrestaurantIdASCfechaDESC✅ Habilitado5inventariosrestaurantIdASCperiodoDESC✅ Habilitado6productosrestaurantIdASCnombreASC✅ Habilitado7productosrestaurantIdASCtipoASC✅ Habilitado8proveedoresrestaurantIdASCnombreASC✅ Habilitado9proveedorescompanyIdASCnombreASC✅ Habilitado10userscompanyIdASCnombreASC✅ Habilitado11workersrestaurantIdASCnombreASC✅ Habilitado12workerscompanyIdASCnombreASC✅ Habilitado13shiftsworkerIdASCdateDESC✅ Habilitado14shiftsrestaurantIdASCstartDateDESC✅ Habilitado15payrollworkerIdASCperiodDESC✅ Habilitado16payrollrestaurantIdASCperiodDESC✅ Habilitado17restaurantscompanyIdASCactivoASC✅ Habilitado

4. REGLAS DE SEGURIDAD (firestore.rules)
javascriptrules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    
    // Verifica si el usuario está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Obtiene los datos del usuario actual
    function getUserData() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }
    
    // Verifica si el usuario es admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Verifica si el usuario es manager o admin
    function isManagerOrAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Verifica si el usuario tiene acceso al restaurante especificado
    function hasRestaurantAccess(restaurantId) {
      let userData = get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
      return isAuthenticated() && 
             (userData.role == 'admin' || 
              restaurantId in userData.restaurantIds);
    }
    
    // Verifica si el usuario pertenece a la compañía
    function belongsToCompany(companyId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.companyId == companyId;
    }
    
    // ============================================
    // REGLAS POR COLECCIÓN
    // ============================================
    
    // USUARIOS
    match /usuarios/{userId} {
      // Cualquier usuario autenticado puede leer su propio documento
      allow read: if isAuthenticated() && request.auth.uid == userId;
      // Solo admins pueden leer otros usuarios
      allow read: if isAdmin();
      // Solo admins pueden crear/modificar usuarios
      allow write: if isAdmin();
    }
    
    // Alias para compatibilidad (users)
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // COMPANIES (Empresas)
    match /companies/{companyId} {
      // Usuarios de la compañía pueden leer
      allow read: if belongsToCompany(companyId);
      // Solo admins pueden modificar
      allow write: if isAdmin();
    }
    
    // RESTAURANTS
    match /restaurants/{restaurantId} {
      // Usuarios con acceso al restaurante pueden leer
      allow read: if hasRestaurantAccess(restaurantId);
      // Solo admins pueden crear/modificar restaurantes
      allow write: if isAdmin();
    }
    
    // PROVEEDORES
    match /proveedores/{proveedorId} {
      // Cualquier usuario autenticado puede leer proveedores
      allow read: if isAuthenticated();
      // Managers y admins pueden modificar
      allow write: if isManagerOrAdmin();
    }
    
    // PRODUCTOS
    match /productos/{productoId} {
      // Usuarios con acceso al restaurante pueden leer
      allow read: if isAuthenticated();
      // Managers y admins pueden modificar
      allow write: if isManagerOrAdmin();
    }
    
    // FACTURAS
    match /facturas/{facturaId} {
      // Usuarios con acceso al restaurante de la factura pueden leer
      allow read: if hasRestaurantAccess(resource.data.restaurantId);
      // Managers y admins pueden crear/modificar
      allow create: if isManagerOrAdmin() && hasRestaurantAccess(request.resource.data.restaurantId);
      allow update, delete: if isManagerOrAdmin() && hasRestaurantAccess(resource.data.restaurantId);
    }
    
    // INVENTARIOS
    match /inventarios/{inventarioId} {
      allow read: if hasRestaurantAccess(resource.data.restaurantId);
      allow create: if isAuthenticated() && hasRestaurantAccess(request.resource.data.restaurantId);
      allow update: if isAuthenticated() && hasRestaurantAccess(resource.data.restaurantId);
      allow delete: if isManagerOrAdmin() && hasRestaurantAccess(resource.data.restaurantId);
    }
    
    // CIERRES DE CAJA
    match /cierres/{cierreId} {
      allow read: if hasRestaurantAccess(resource.data.restaurantId);
      allow create: if isAuthenticated() && hasRestaurantAccess(request.resource.data.restaurantId);
      allow update: if isManagerOrAdmin() && hasRestaurantAccess(resource.data.restaurantId);
      allow delete: if isAdmin();
    }
    
    // ROLES (Solo lectura para autenticados, escritura solo admin)
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // WORKERS (Empleados)
    match /workers/{workerId} {
      allow read: if isAuthenticated();
      allow write: if isManagerOrAdmin();
    }
    
    // SHIFTS (Turnos)
    match /shifts/{shiftId} {
      allow read: if isAuthenticated();
      allow write: if isManagerOrAdmin();
    }
    
    // PAYROLL (Nóminas)
    match /payroll/{payrollId} {
      allow read: if isAdmin() || 
                    (isAuthenticated() && resource.data.workerId == request.auth.uid);
      allow write: if isAdmin();
    }
    
    // CONFIGURACIÓN GENERAL
    match /config/{configId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // LOGS/AUDITORÍA (Solo admins)
    match /logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Nunca se pueden modificar/eliminar logs
    }
    
    // NOTIFICACIONES
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}
Última publicación: Verificar en Firebase Console → Reglas → historial

5. MÉTRICAS DE USO (Últimas 24 horas)
MétricaValorLecturas (Reads)4,800Escrituras (Writes)14Eliminaciones (Deletes)0Storage usado~1 MB (estimado)PlanSpark (gratuito)Límites diarios Spark50K reads, 20K writes

6. AUTENTICACIÓN
Usuarios Registrados: 4
EmailUIDProveedorEstadoale***@gmail.com5QS***XW2Email/PasswordActivofer***@gmail.comH46***qx1Email/PasswordActivocon***@gmail.comNju***hN2Email/PasswordActivomic***@gmail.commT6***qH2Email/PasswordActivo
Métodos de Acceso Habilitados:

✅ Correo electrónico/contraseña
❌ Google
❌ Facebook
❌ Apple
❌ Teléfono


7. HALLAZGOS Y RECOMENDACIONES
⚠️ PROBLEMA CRÍTICO DETECTADO
Inconsistencia en nombre de colección de usuarios:

Las reglas de seguridad referencian: /usuarios/$(request.auth.uid)
La colección real en Firestore se llama: users

Impacto: Las funciones isAdmin(), isManagerOrAdmin(), hasRestaurantAccess(), y belongsToCompany() probablemente NO funcionan correctamente porque buscan documentos en una colección inexistente (usuarios).
Solución recomendada:

Cambiar todas las referencias en las reglas de /usuarios/ a /users/
O crear la colección usuarios como alias

Otras Recomendaciones:

Colecciones sin índices: Las colecciones workers, shifts, y payroll tienen índices definidos pero las colecciones no existen aún en Firestore.
Seguridad: Considerar habilitar autenticación con Google para facilitar el login.
Backup: Configurar exportaciones automáticas de Firestore (requiere plan Blaze).
Monitoreo: Configurar alertas de uso para evitar exceder límites del plan Spark.


8. CHECKLIST DE AUDITORÍA

 Navegué a TODAS las secciones de Firestore
 Extraje estructura de TODAS las colecciones (9 colecciones)
 Copié las reglas de seguridad COMPLETAS
 Documenté TODOS los índices existentes (17 índices)
 Capturé métricas de uso actuales
 Incluí configuración del proyecto
 Generé documento de auditoría completo


Documento generado por: Auditoría automatizada con Claude
Fecha: 17 de enero de 2026