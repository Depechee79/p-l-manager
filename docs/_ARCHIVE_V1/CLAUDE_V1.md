# CLAUDE.md - Guia de Onboarding para Nuevas Sesiones

> **IMPORTANTE**: Lee este archivo COMPLETO antes de hacer cualquier cambio en el proyecto.

---

## Que es este proyecto?

**P&L Antigravity** es una aplicacion de gestion para restaurantes construida con:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase (Firestore + Auth)
- **Arquitectura**: Cloud-First, Multi-restaurante

---

## ORDEN DE LECTURA OBLIGATORIO

### Paso 1: Contexto del Proyecto
Lee primero para entender el estado actual:

```
.claude/sessions/INDICE-SESIONES.md       # Historial de todas las sesiones
.claude/sessions/sesion-002-reorganizacion-ui.md  # Ultima sesion (mas reciente)
```

### Paso 2: Reglas Obligatorias
**DEBES** seguir estas reglas al programar:

```
docs/01_CANON/RULES.md                    # Reglas de arquitectura R-01 a R-14
docs/01_CANON/TOKENS_REFERENCE.md         # Sistema de diseno y tokens CSS
docs/01_CANON/BUGS.md                     # Bugs conocidos (no reinventar soluciones)
```

### Paso 3: Arquitectura del Sistema

```
docs/10_ARCHITECTURE/DATABASE_SCHEMA.md   # Esquema completo de Firestore
docs/10_ARCHITECTURE/FIREBASE_SETUP.md    # Configuracion de Firebase
docs/10_ARCHITECTURE/MULTI_RESTAURANTE.md # Arquitectura multi-tenant
docs/20_SECURITY/FIREBASE_RULES.md        # Reglas de seguridad Firestore
```

### Paso 4: Estado de Calidad y Testing

```
docs/50_QA/TESTING_STATUS.md              # Estado de tests
docs/50_QA/BACKEND_RISK_REGISTER.md       # Riesgos identificados
```

### Paso 5: Auditorias y Planes (si vas a trabajar en Firebase)

```
docs/40_LOGS/firebase-audit/README.md     # Resumen de auditoria Firebase
docs/60_FIREBASE_PLAN/README.md           # Plan de correcciones pendientes
```

### Paso 6: Reglas de Proceso Detalladas (opcional, consultar segun necesidad)

```
docs/70_PROCESS_RULES/00-KERNEL.md        # Reglas nucleares
docs/70_PROCESS_RULES/10-arquitectura/    # Reglas de arquitectura
docs/70_PROCESS_RULES/20-codigo-limpio/   # Reglas de codigo limpio
docs/70_PROCESS_RULES/30-testing/         # Reglas de testing
```

---

## RESUMEN EJECUTIVO DEL PROYECTO

### Sistema de Autenticacion
- **Firebase Auth** integrado completamente
- Login en `/login`, registro en `/crear-negocio`, invitaciones en `/registro`
- Contexto de auth en `src/core/context/AppContext.tsx`
- Servicio de auth en `src/core/services/AuthService.ts`

### Sistema de Roles (SYSTEM_ROLES)
| Role ID | Permisos |
|---------|----------|
| `director_operaciones` | TODOS |
| `director_restaurante` | TODOS |
| `encargado` | cierres, inventarios, delivery |
| `jefe_cocina` | inventarios, mermas, escandallos |
| `camarero` | cierres basico |
| `cocinero` | inventarios basico |

### Permisos Clave
- `pnl.view` - Ver P&L y Gastos Fijos
- `usuarios.edit` - Gestionar Nominas y Roles
- `configuracion.edit` - Acceso a Configuracion

### Estructura de Navegacion
```
OPERACIONES:  Dashboard, Cierres, Delivery
COMPRAS:      Facturas, Inventarios, Mermas, Pedidos, Proveedores, Traspasos
EQUIPO:       Plantilla, Nominas*, Roles*
FINANZAS:     P&L*, Gastos Fijos*, Recetas y Costes
AJUSTES:      Configuracion*

* = Requiere permisos especificos (se ocultan si no tienes permiso)
```

### Colecciones Firebase Principales
- `usuarios` - Perfiles de usuario (vinculados a Firebase Auth)
- `restaurants` - Restaurantes
- `companies` - Empresas/Holdings
- `cierres` - Cierres de caja
- `facturas` - Facturas de compra
- `productos` - Productos
- `proveedores` - Proveedores
- `escandallos` - Recetas/Escandallos
- `inventarios` - Inventarios

### Archivos Clave del Codigo
```
src/
├── core/
│   ├── context/AppContext.tsx      # Auth state, user data
│   ├── services/AuthService.ts     # Firebase Auth operations
│   ├── services/DatabaseService.ts # CRUD operations (Cloud-First)
│   └── services/FirestoreService.ts # Firebase Firestore wrapper
├── shared/
│   ├── hooks/useUserPermissions.ts # Permission checking
│   ├── components/ProtectedRoute.tsx # Route protection
│   └── components/layout/navConfig.ts # Navigation structure
└── pages/
    ├── LoginPage.tsx
    └── [otras paginas]
```

---

## COMANDOS UTILES

```bash
# Desarrollo
npm run dev

# Build (verificar antes de commit)
npm run build

# Deploy reglas Firestore
npx firebase deploy --only firestore:rules --project pylhospitality
```

---

## REGLAS CRITICAS (NO IGNORAR)

1. **Cloud-First**: Todas las escrituras van a Firebase PRIMERO, luego estado local
2. **No StrictMode duplicates**: Usar `useRef` guards en useEffects que hacen fetch
3. **Permisos**: Verificar con `useUserPermissions()` hook
4. **SYSTEM_ROLES**: Usar roles del archivo `src/shared/config/systemRoles.ts`
5. **Toast feedback**: Usar `ToastService` para feedback de operaciones
6. **No hardcodear**: Usar tokens CSS de `TOKENS_REFERENCE.md`

---

## USUARIO DE PRUEBA

| Campo | Valor |
|-------|-------|
| Email | director@pltest.com |
| Role | `director_operaciones` |
| Coleccion | `usuarios/{uid}` |

---

## ESTRUCTURA DE DOCUMENTACION

```
docs/
├── 00_INDEX.md                 # Indice maestro de documentacion
├── 01_CANON/                   # Reglas obligatorias
├── 10_ARCHITECTURE/            # Arquitectura tecnica
├── 20_SECURITY/                # Seguridad
├── 30_RUNBOOKS/                # Guias operativas
├── 40_LOGS/
│   ├── firebase-audit/         # Auditoria Firebase
│   └── *.md                    # Logs consolidados
├── 50_QA/                      # Testing y QA
├── 60_FIREBASE_PLAN/           # Plan correcciones Firebase
├── 70_PROCESS_RULES/           # Reglas de proceso detalladas
└── _ARCHIVE/                   # Historico

.claude/
├── CLAUDE.md                   # ESTE ARCHIVO
└── sessions/                   # Historial de sesiones
    ├── INDICE-SESIONES.md
    ├── sesion-001-*.md
    └── sesion-002-*.md
```

---

## AL TERMINAR UNA SESION

1. Actualizar `.claude/sessions/INDICE-SESIONES.md`
2. Crear o actualizar `sesion-XXX-*.md` con resumen del trabajo
3. Si hay cambios importantes, actualizar `docs/01_CANON/HANDOFF.md`

---

## CONTACTO Y CONTEXTO

- **Proyecto**: pylhospitality (Firebase)
- **Propietario**: Usuario no programador, director de restaurante
- **Objetivo**: Gestion completa de operaciones de restaurante

---

*Ultima actualizacion: 2026-01-18*
