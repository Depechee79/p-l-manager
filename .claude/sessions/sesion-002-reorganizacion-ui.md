# SESION 002: REORGANIZACION UI + AUTH + PERMISOS + TABS

**Fecha:** 2026-01-17 a 2026-01-18
**Duracion:** ~8 horas (multiples sub-sesiones)
**Estado:** COMPLETADO

---

## RESUMEN EJECUTIVO

Esta sesion tuvo cinco fases principales:

**FASE 1 - Reorganizacion de Navegacion (2026-01-17):**
- Nueva estructura de 5 categorias mas intuitivas
- Paginas ocultas ahora visibles (Delivery, Nominas, Gastos Fijos)
- Mobile nav scrollable con todos los items
- Filtrado por permisos implementado
- Fusion de Escandallos + Ingenieria Menu en tabs

**FASE 2 - Correccion Auth y Permisos (2026-01-18):**
- Sistema de autenticacion Firebase Auth completamente integrado
- Permisos de roles corregidos (soporte para `director_operaciones`)
- Firestore rules actualizadas y desplegadas a produccion
- Llamadas duplicadas eliminadas

**FASE 3 - Limpieza y Reorganizacion de Documentacion (2026-01-18):**
- Eliminados 42+ archivos temporales `tmpclaude-*`
- Eliminados logs grandes (~170 MB liberados)
- Documentacion consolidada en `docs/` (firebase-audit, firebase-plan, rules)
- Carpeta `.agent/` eliminada (era redundante)
- Creado archivo de onboarding `.claude/CLAUDE.md`

**FASE 4 - Reestructuracion UI con Tabs (2026-01-18):**
- Roles integrados en Configuracion como tab
- Nominas integradas en Plantilla como tab
- AlmacenPage creada (agrupa Inventarios, Mermas, Pedidos)
- Navegacion simplificada

**FASE 5 - Componente TabsHorizontal y Navegacion Final (2026-01-18):**
- Componente TabsHorizontal reutilizable creado
- Navegacion sin titulos de seccion
- AlmacenPage con 6 tabs (Existencias, Inventarios, Mermas, Pedidos, Proveedores, Traspasos)
- PnLPage con tab Gastos Fijos
- RestaurantConfigPage reorganizado (tabs arriba, selector abajo)
- OCRPage renombrado a Docs

---

## FASE 1: REORGANIZACION DE NAVEGACION

### Estructura de Navegacion (navConfig.ts)

**ANTES (5 categorias):**
```
OPERACIONES: Dashboard, Cierres, Mermas
ALMACEN: Inventarios, Pedidos, Facturas, Proveedores, Traspasos
EQUIPO: Gestion Humana, Roles y Permisos
ESTRATEGIA: P&L, Escandallos, Ingenieria Menu
CONFIGURACION: Configuracion

OCULTAS: /delivery, /nominas, /gastos-fijos
```

**DESPUES (5 categorias reorganizadas):**
```
OPERACIONES: Dashboard, Cierres, Delivery [NUEVO]
COMPRAS: Facturas, Inventarios, Mermas [MOVIDO], Pedidos, Proveedores, Traspasos
EQUIPO: Plantilla [RENOMBRADO], Nominas [NUEVO], Roles
FINANZAS: P&L, Gastos Fijos [NUEVO], Recetas y Costes [RENOMBRADO]
AJUSTES: Configuracion [RENOMBRADO]
```

### Mobile Bottom Nav

**ANTES:** 5 tabs fijos (Inicio, Facturas, Cierres, Logistica, Estrategia)

**DESPUES:** Barra scrollable horizontal con TODOS los items del sidebar
- Scroll horizontal con touch momentum
- Scrollbar oculto
- Items compactos (52-64px)

### Fusion Escandallos + Ingenieria Menu

- `/escandallos` ahora tiene 2 tabs: "Recetas" y "Analisis Menu"
- `/ingenieria-menu` redirige a `/escandallos?tab=analisis`
- Contenido de MenuEngineeringPage extraido a `MenuAnalysisTab` component

### Filtrado por Permisos (implementacion inicial)

- Nuevo hook: `useUserPermissions`
- Nueva funcion: `filterNavigationByPermissions`
- Sidebar y MobileBottomNav ocultan items sin permiso
- Items protegidos:
  - `/pnl`, `/gastos-fijos` requieren `pnl.view`
  - `/nominas`, `/roles` requieren `usuarios.edit`
  - `/configuracion` requiere `configuracion.edit`

---

## FASE 2: CORRECCION AUTH Y PERMISOS

### Problemas Detectados Post-Reorganizacion

1. **Login no conectaba con Firebase Auth**
   - Sintoma: Usuario decia "ya registrado" pero login fallaba
   - Causa: Sistema de login no integrado correctamente con Firebase Auth

2. **Tabs de admin rebotaban al Dashboard**
   - Sintoma: Click en P&L, Configuracion, Roles -> volvia a Dashboard
   - Causa: `ProtectedRoute.tsx` solo reconocia roles legacy (PREDEFINED_ROLES), no SYSTEM_ROLES (`director_operaciones`)

3. **Errores de permisos Firebase** (reportado por Chrome Extension)
   ```
   [Firebase] Missing or insufficient permissions for:
   - gastosFijos, cierres, facturas, albaranes, inventarios
   - delivery, transfers, mermas, orders, pnl_adjustments
   ```
   - Causa: `firestore.rules` usaba `isAdmin()` que solo reconocia `rolId == 'admin'`

4. **Llamadas duplicadas a Firebase**
   - Sintoma: Cada query aparecia 2 veces en consola
   - Causa: React StrictMode + useEffect con dependencias inestables

5. **Vite WebSocket HMR fallaba**
   - Sintoma: Error de conexion WebSocket en desarrollo
   - Causa: Configuracion HMR incompleta

### Soluciones Implementadas

#### 1. Sistema de Autenticacion Firebase Auth

**Archivos creados/modificados:**
- `src/core/services/AuthService.ts` - Servicio de autenticacion
- `src/pages/LoginPage.tsx` - Pagina de login simplificada
- `src/pages/SignUpPage.tsx` - Registro de nuevo negocio
- `src/pages/InvitationSignUpPage.tsx` - Registro por invitacion
- `src/core/context/AppContext.tsx` - Contexto con `onAuthStateChanged` listener

**Flujo de autenticacion:**
1. Usuario entra credenciales en LoginPage
2. `loginUser()` llama a Firebase Auth `signInWithEmailAndPassword()`
3. `onAuthStateChanged` en AppContext detecta el cambio
4. AppContext carga perfil de usuario desde Firestore `usuarios/{uid}`
5. Usuario autenticado, navegacion habilitada

#### 2. Correccion de Permisos de Roles

**Archivo:** `src/shared/hooks/useUserPermissions.ts`

Ahora soporta SYSTEM_ROLES ademas de PREDEFINED_ROLES:
```typescript
function getRoleById(roleId: string | number | undefined): Role | undefined {
  // 1. Primero intenta SYSTEM_ROLES (nuevo sistema)
  if (roleIdStr in SYSTEM_ROLES) {
    return { id: systemRole.id, nombre: systemRole.nombre, permisos: systemRole.permisos, ... };
  }
  // 2. Fallback a PREDEFINED_ROLES (legacy)
  // 3. Default a Director si no reconoce el rol
}
```

**Archivo:** `src/shared/components/ProtectedRoute.tsx`

Eliminada funcion duplicada `getRoleByName()`, ahora usa `useUserPermissions()` hook.

#### 3. Firestore Rules Actualizadas

**Archivo:** `firestore.rules`

Nueva funcion `isDirector()` que reconoce todos los roles de director:
```javascript
function isDirector() {
  return isAuthenticated() && (
    getUserData().rolId == 'director_operaciones' ||
    getUserData().rolId == 'director_restaurante' ||
    getUserData().rolId == 'admin'
  );
}
```

**Desplegado:** `npx firebase deploy --only firestore:rules --project pylhospitality`

#### 4. Eliminacion de Llamadas Duplicadas

**Archivo:** `src/core/hooks/useRestaurant.ts`

Agregado guard para prevenir doble inicializacion de React StrictMode:
```typescript
const hasInitialized = useRef(false);

useEffect(() => {
  if (hasInitialized.current) return;
  hasInitialized.current = true;
  // ... resto de inicializacion
}, []);
```

#### 5. Configuracion Vite HMR

**Archivo:** `vite.config.ts`
```typescript
server: {
  port: 3000,
  open: true,
  hmr: { host: 'localhost', port: 3000 },
},
```

---

## FASE 3: LIMPIEZA Y REORGANIZACION DE DOCUMENTACION

### Archivos Temporales Eliminados

Se eliminaron 42+ archivos `tmpclaude-*-cwd` de la raiz del proyecto.

**Agregado a `.gitignore`:**
```
# Claude Code temporary files
tmpclaude-*
```

### Logs Grandes Eliminados (~170 MB liberados)

| Archivo | Tamano |
|---------|--------|
| `debug_error.log` | 42 MB |
| `e2e_error.txt` | 25 MB |
| `test_output.txt` | 103 MB |
| `build_log.txt` | - |

### Reorganizacion de Documentacion

**Carpetas movidas:**
| Origen | Destino |
|--------|---------|
| `firebase-audit-report/` | `docs/40_LOGS/firebase-audit/` |
| `firebase-fix-plan/` | `docs/60_FIREBASE_PLAN/` |
| `.agent/rules/` | `docs/70_PROCESS_RULES/` |

**Carpeta eliminada:** `.agent/` (era redundante)

### Archivo de Onboarding Creado

**Archivo:** `.claude/CLAUDE.md`

Guia completa para nuevas sesiones de Claude.

---

## FASE 4: REESTRUCTURACION UI CON TABS

### 1. Roles integrados en Configuracion

**Archivo creado:** `src/features/config/components/RolesTab.tsx`
- CRUD completo para roles (crear, editar, eliminar)
- Editor de permisos con checkboxes agrupados por categoria
- Modal de confirmacion para eliminar
- Integrado como tab en RestaurantConfigPage

### 2. Nominas integradas en Plantilla

**Archivo creado:** `src/features/personal/components/NominasTab.tsx`
- Gestion completa de nominas (CRUD)
- Filtro por mes/año
- Resumen de costes (total, brutos, SS empresa)
- Calculo automatico de salario neto

### 3. AlmacenPage creada

**Archivo creado:** `src/pages/AlmacenPage.tsx`
- Agrupa Inventarios, Mermas y Pedidos en tabs horizontales
- Reutiliza InventariosPage y MermasPage como contenido de tabs

### 4. Navegacion simplificada

**Antes:**
```
OPERACIONES: Dashboard, Cierres
COMPRAS: Facturas, Inventarios, Mermas, Pedidos, Proveedores, Traspasos
EQUIPO: Plantilla, Nominas, Roles
FINANZAS: P&L, Gastos Fijos, Recetas
AJUSTES: Configuracion
```

**Ahora:**
```
OPERACIONES: Dashboard, Cierres
GESTION: Facturas, Almacen, Proveedores, Traspasos
EQUIPO: Plantilla (con 6 tabs incluyendo Nominas)
FINANZAS: P&L, Gastos Fijos, Recetas y Costes
AJUSTES: Configuracion (con tabs: Restaurante, Grupo, Roles)
```

### Permisos Añadidos a PERMISSION_GROUPS

```typescript
{ label: 'Personal', permissions: ['personal.view', 'personal.edit'] },
{ label: 'Nominas', permissions: ['nominas.view', 'nominas.create', 'nominas.edit', 'nominas.delete'] },
{ label: 'Gastos Fijos', permissions: ['gastos.view', 'gastos.create', 'gastos.edit', 'gastos.delete'] },
{ label: 'Mermas', permissions: ['mermas.view', 'mermas.create', 'mermas.edit', 'mermas.delete'] },
{ label: 'Pedidos', permissions: ['pedidos.view', 'pedidos.create', 'pedidos.edit', 'pedidos.delete'] },
{ label: 'Traspasos', permissions: ['transferencias.view', 'transferencias.create', ...] },
{ label: 'Invitaciones', permissions: ['invitaciones.view', 'invitaciones.create', 'invitaciones.delete'] },
{ label: 'Restaurantes', permissions: ['restaurantes.view', 'restaurantes.create', ...] },
```

---

## FASE 5: COMPONENTE TABSHORIZONTAL Y NAVEGACION FINAL

### 1. Componente TabsHorizontal (NUEVO)

**Archivo:** `src/shared/components/TabsHorizontal.tsx`
- Componente reutilizable para tabs horizontales
- Props: `tabs`, `activeTab`, `onTabChange`, `noBorder`, `size`
- Hover states, sombra sutil en tab activa, transiciones suaves
- Scroll horizontal en mobile

### 2. Navegacion Simplificada Final

**Archivo:** `src/shared/components/layout/navConfig.ts`

Nuevo orden sin titulos de seccion:
```
Dashboard      /
Docs           /docs (antes /ocr)
Cierres        /cierres
Escandallos    /escandallos
Almacen        /almacen
Plantilla      /equipo
P&L            /pnl
Configuracion  /configuracion
```

Rutas eliminadas (ahora son tabs):
- `/proveedores` -> `/almacen?tab=proveedores`
- `/transferencias` -> `/almacen?tab=traspasos`
- `/gastos-fijos` -> `/pnl?tab=gastos-fijos`

### 3. Sidebar sin Titulos de Seccion

**Archivo:** `src/shared/components/layout/Sidebar.tsx`
- Eliminados los titulos de seccion ("OPERACIONES", "COMPRAS", etc.)

### 4. AlmacenPage - 6 Tabs

**Archivo:** `src/pages/AlmacenPage.tsx`

Tabs:
1. **Existencias** (default) - Vista de stock con filtros
2. **Inventarios** - Embed de InventariosPage
3. **Mermas** - Embed de MermasPage
4. **Pedidos** - Placeholder (TODO: implementar)
5. **Proveedores** - Embed de ProvidersPage
6. **Traspasos** - Embed de TransfersPage

### 5. PnLPage - Tab Gastos Fijos

**Archivo:** `src/pages/PnLPage.tsx`

Tabs:
1. **Resultados** (default) - KPIs y tabla P&L
2. **Gastos Fijos** - Embed de GastosFijosPage

### 6. RestaurantConfigPage - Tabs Arriba

**Archivo:** `src/pages/RestaurantConfigPage.tsx`
- Tabs usando TabsHorizontal (antes TabButton custom)
- Tabs PRIMERO, selector de restaurante DESPUES
- Selector solo visible en tab "Holding/Grupo" con permisos

### 7. OCRPage -> Docs

**Archivo:** `src/pages/OCRPage.tsx`
- Vista unificada de documentos
- Incluye: facturas, albaranes, cierres, nominas

---

## SISTEMA DE ROLES

### SYSTEM_ROLES (nuevo sistema)
| Role ID | Nombre | Permisos Clave |
|---------|--------|----------------|
| `director_operaciones` | Director de Operaciones | TODOS |
| `director_restaurante` | Director de Restaurante | TODOS |
| `encargado` | Encargado | cierres, inventarios, delivery |
| `jefe_cocina` | Jefe de Cocina | inventarios, mermas, escandallos |
| `camarero` | Camarero | cierres basico |
| `cocinero` | Cocinero | inventarios basico |

---

## ARCHIVOS MODIFICADOS (TOTAL)

### Nuevos
| Archivo | Descripcion |
|---------|-------------|
| `src/core/services/AuthService.ts` | Servicio de autenticacion |
| `src/pages/SignUpPage.tsx` | Registro de negocio |
| `src/pages/InvitationSignUpPage.tsx` | Registro por invitacion |
| `src/shared/hooks/useUserPermissions.ts` | Hook de permisos |
| `src/features/escandallos/components/MenuAnalysisTab.tsx` | Tab de analisis menu |
| `src/features/config/components/RolesTab.tsx` | Tab de gestion de roles |
| `src/features/personal/components/NominasTab.tsx` | Tab de nominas |
| `src/pages/AlmacenPage.tsx` | Pagina hub para Almacen |
| `src/shared/components/TabsHorizontal.tsx` | Componente tabs reutilizable |
| `.claude/CLAUDE.md` | Guia de onboarding |

### Modificados
| Archivo | Cambio |
|---------|--------|
| `firestore.rules` | Nueva funcion `isDirector()` |
| `src/core/context/AppContext.tsx` | Firebase Auth integrado |
| `src/shared/components/layout/navConfig.ts` | Nueva estructura, permisos |
| `src/shared/components/layout/Sidebar.tsx` | Sin titulos seccion, filtrado |
| `src/shared/components/layout/MobileBottomNav.tsx` | Scroll horizontal |
| `src/shared/components/ProtectedRoute.tsx` | Usa useUserPermissions |
| `src/pages/EscandallosPage.tsx` | Sistema de tabs |
| `src/pages/PnLPage.tsx` | Tab Gastos Fijos |
| `src/pages/RestaurantConfigPage.tsx` | Tabs arriba, selector abajo |
| `src/pages/OCRPage.tsx` | Renombrado a Docs |
| `src/App.tsx` | Nuevas rutas y redirects |
| `vite.config.ts` | Configuracion HMR |

---

## VERIFICACIONES REALIZADAS

1. **Build:** `npm run build` - OK
2. **Deploy reglas:** `npx firebase deploy --only firestore:rules` - OK
3. **Login:** Funciona correctamente con Firebase Auth
4. **Tabs protegidos:** Director ve todos, otros roles ven segun permisos
5. **Errores Firebase:** Eliminados tras deploy de nuevas reglas
6. **Navegacion mobile:** Scroll horizontal funcional
7. **TabsHorizontal:** Estandarizado en todas las paginas

---

## TODOs PENDIENTES (para proxima sesion)

1. [ ] Implementar tab "Pedidos" en AlmacenPage (actualmente placeholder)
2. [ ] Verificar scroll horizontal de tabs en mobile
3. [ ] Probar app en dispositivo movil real
4. [ ] Sistema de invitaciones E2E
5. [ ] Multi-restaurante UI

---

*Ultima actualizacion: 2026-01-18*
*Sesion anterior: sesion-001-auditoria-firebase.md*
