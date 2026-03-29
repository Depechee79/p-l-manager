# AUDITORIA FIREBASE CONSOLE - PROYECTO P&LHospitality

> **IMPORTANTE:** Este documento contiene datos REALES extraidos directamente de Firebase Console.
> > A diferencia de otros documentos en esta carpeta (generados por analisis de codigo), este refleja
> > > la configuracion ACTUAL en produccion.
> > >
> > > **Fecha de auditoria:** 17 de enero de 2026
> > > **Project ID:** pylhospitality
> > > **Region:** eur3 (europe-west3)
> > > **Plan:** Spark (gratuito)
> > > **Auditor:** Claude (Browser automation)
> > >
> > > ---
> > >
> > > ## 1. CONFIGURACION DEL PROYECTO
> > >
> > > | Campo | Valor |
> > > |-------|-------|
> > > | Project ID | `pylhospitality` |
> > > | Project Number | `879******` (parcialmente oculto) |
> > > | Default GCP Resource Location | `eur3 (europe-west3)` |
> > > | Web API Key | `AIzaSyAQ0K0tB15FoOGCh8Fv5bVbAUb8b7HocU4` |
> > > | Plan | Spark (gratuito) |
> > >
> > > ### SDK Configuration (Web App)
> > >
> > > ```javascript
> > > const firebaseConfig = {
> > >   apiKey: "AIzaSyAQ0K0tB15FoOGCh8Fv5bVbAUb8b7HocU4",
> > >   authDomain: "pylhospitality.firebaseapp.com",
> > >   projectId: "pylhospitality",
> > >   storageBucket: "pylhospitality.firebasestorage.app",
> > >   messagingSenderId: "879******",
> > >   appId: "1:879******:web:07e4******"
> > > };
> > > ```
> > >
> > > ---
> > >
> > > ## 2. COLECCIONES EXISTENTES EN FIRESTORE
> > >
> > > Las siguientes colecciones existen **REALMENTE** en Firebase Console:
> > >
> > > | # | Coleccion | Descripcion |
> > > |---|-----------|-------------|
> > > | 1 | `cierres` | Cierres de caja diarios |
> > > | 2 | `companies` | Empresas/grupos |
> > > | 3 | `facturas` | Facturas de proveedores |
> > > | 4 | `inventarios` | Inventarios periodicos |
> > > | 5 | `productos` | Catalogo de productos |
> > > | 6 | `proveedores` | Proveedores |
> > > | 7 | `restaurants` | Restaurantes |
> > > | 8 | `roles` | Definicion de roles |
> > > | 9 | `users` | Usuarios del sistema |
> > >
> > > ---
> > >
> > > ## 3. INDICES COMPUESTOS DESPLEGADOS
> > >
> > > Los siguientes indices estan **ACTIVOS** en Firebase Console:
> > >
> > > | # | Coleccion | Campo 1 | Orden | Campo 2 | Orden | Estado |
> > > |---|-----------|---------|-------|---------|-------|--------|
> > > | 1 | cierres | restaurantId | ASC | fecha | DESC | Habilitado |
> > > | 2 | facturas | restaurantId | ASC | fecha | DESC | Habilitado |
> > > | 3 | facturas | proveedorId | ASC | fecha | DESC | Habilitado |
> > > | 4 | inventarios | restaurantId | ASC | fecha | DESC | Habilitado |
> > > | 5 | inventarios | restaurantId | ASC | periodo | DESC | Habilitado |
> > > | 6 | productos | restaurantId | ASC | nombre | ASC | Habilitado |
> > > | 7 | productos | restaurantId | ASC | tipo | ASC | Habilitado |
> > > | 8 | proveedores | restaurantId | ASC | nombre | ASC | Habilitado |
> > > | 9 | proveedores | companyId | ASC | nombre | ASC | Habilitado |
> > > | 10 | users | companyId | ASC | nombre | ASC | Habilitado |
> > > | 11 | workers | restaurantId | ASC | nombre | ASC | Habilitado |
> > > | 12 | workers | companyId | ASC | nombre | ASC | Habilitado |
> > > | 13 | shifts | workerId | ASC | date | DESC | Habilitado |
> > > | 14 | shifts | restaurantId | ASC | startDate | DESC | Habilitado |
> > > | 15 | payroll | workerId | ASC | period | DESC | Habilitado |
> > > | 16 | payroll | restaurantId | ASC | period | DESC | Habilitado |
> > > | 17 | restaurants | companyId | ASC | activo | ASC | Habilitado |
> > >
> > > **Nota:** Los indices para `workers`, `shifts` y `payroll` estan creados pero las colecciones aun no existen en Firestore.
> > >
> > > ---
> > >
> > > ## 4. METRICAS DE USO (Ultimas 24h)
> > >
> > > | Metrica | Valor |
> > > |---------|-------|
> > > | Document Reads | 4,800 |
> > > | Document Writes | 14 |
> > > | Document Deletes | 0 |
> > > | Storage | ~1 MB |
> > > | Plan | Spark (gratuito) |
> > > | Limite diario Reads | 50,000 |
> > > | Limite diario Writes | 20,000 |
> > >
> > > ---
> > >
> > > ## 5. AUTENTICACION
> > >
> > > ### Usuarios Registrados: 4
> > >
> > > | Email | Proveedor | Estado |
> > > |-------|-----------|--------|
> > > | ale***@gmail.com | Email/Password | Activo |
> > > | fer***@gmail.com | Email/Password | Activo |
> > > | con***@gmail.com | Email/Password | Activo |
> > > | mic***@gmail.com | Email/Password | Activo |
> > >
> > > ### Metodos de Acceso
> > >
> > > | Metodo | Estado |
> > > |--------|--------|
> > > | Email/contrasena | Habilitado |
> > > | Google | Deshabilitado |
> > > | Facebook | Deshabilitado |
> > > | Apple | Deshabilitado |
> > > | Telefono | Deshabilitado |
> > >
> > > ---
> > >
> > > ## 6. PROBLEMA CRITICO DETECTADO
> > >
> > > ### Inconsistencia en nombre de coleccion de usuarios
> > >
> > > **Problema:**
> > > - Las reglas de seguridad referencian: `/usuarios/$(request.auth.uid)`
> > > - - La coleccion REAL en Firestore se llama: `users` (NO `usuarios`)
> > >  
> > >   - **Impacto:**
> > >   - - Las funciones `isAdmin()`, `isManagerOrAdmin()`, `hasRestaurantAccess()`, y `belongsToCompany()` **NO FUNCIONAN**
> > >     - - Todas las verificaciones de permisos fallan porque buscan en una coleccion inexistente
> > >      
> > >       - **Solucion:**
> > >       - Cambiar TODAS las referencias en las reglas de:
> > >       - ```javascript
> > >         get(/databases/$(database)/documents/usuarios/$(request.auth.uid))
> > >         ```
> > >         A:
> > >         ```javascript
> > >         get(/databases/$(database)/documents/users/$(request.auth.uid))
> > >         ```
> > >
> > > ---
> > >
> > > ## 7. CHECKLIST PARA CLAUDE DESKTOP
> > >
> > > Claude Desktop debe verificar:
> > >
> > > - [ ] El codigo usa la coleccion `users` (no `usuarios`)
> > > - [ ] - [ ] Las queries en el codigo coinciden con los indices desplegados
> > > - [ ] - [ ] El archivo local `firestore.rules` coincide con las reglas publicadas
> > > - [ ] - [ ] El archivo local `firestore.indexes.json` coincide con los indices desplegados
> > > - [ ] - [ ] Los tipos TypeScript coinciden con la estructura real de documentos
> > >
> > > - [ ] ---
> > >
> > > - [ ] **Documento generado automaticamente mediante auditoria de Firebase Console**
> > > - [ ] **Fecha:** 17 de enero de 2026
