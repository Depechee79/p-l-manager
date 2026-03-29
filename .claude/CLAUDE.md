# P&L Antigravity — Gestor de Operaciones de Hosteleria

> **REGLA SUPREMA: CALIDAD 10/10 O NO SE HACE.** Ver `.claude/rules/00-regla-suprema.md`.
> 7 fases obligatorias: Checklist → Leer contratos → Leer codigo → Pensar → Planificar → Ejecutar → Verificar de verdad.
> No hay prisa. No hay atajos. No hay parches. Solo existe hacer las cosas PERFECTAS.

App de gestion de operaciones diarias de hosteleria para restaurantes en Espana.
React 19 + TypeScript 5.9 + Vite 7.2 + Firebase + Tailwind CSS 4.
Single app (futuro: +admin empresarial). Proyecto Firebase: pylhospitality.
Desarrollo activo temprano. Puerto 3004. 7 sesiones completadas.

## Vision del producto

Centro de control para las operaciones diarias de un restaurante:
cierres de caja, recepcion de albaranes, inventarios, escandallos, gestion de personal,
horarios, formacion de camareros, checklists operativos, informes diarios.
Pensado para directores que quieren saber que pasa en su restaurante sin estar fisicamente.
Y para encargados/camareros que necesitan herramientas moviles rapidas en sala.

## Arquitectura

```
src/
├── core/              # Infraestructura base (servicios, contextos, hooks core)
│   ├── context/       # AppContext, DatabaseContext, RestaurantContext
│   ├── hooks/         # useDatabase, useRestaurant
│   ├── services/      # AuthService, DatabaseService, FirestoreService, CompanyService...
│   └── utils/         # migration.ts
├── shared/            # Sistema de diseno + componentes reutilizables
│   ├── components/    # 40+ componentes (Button, Card, Input, Modal, Badge, Select...)
│   │   ├── layout/    # AppShellV2, TopbarV2, SidebarNavV2, MobileBottomNav...
│   │   └── ConfigLayout/
│   ├── config/        # systemRoles.ts (6 roles, 18 modulos, 33 permisos)
│   ├── hooks/         # Hooks genericos compartidos
│   ├── styles/        # tokens.css (fuente de verdad visual)
│   ├── types/         # Tipos UI compartidos
│   └── utils/         # Utilidades genericas
├── features/          # Modulos de negocio (feature-based architecture)
│   ├── cierres/       # Cierre de caja (wizard 4 pasos)
│   ├── dashboard/     # Panel principal
│   ├── escandallos/   # Recetas y calculo de costes
│   ├── inventarios/   # Control de stock
│   ├── invoices/      # Facturas y albaranes
│   ├── ocr/           # Reconocimiento de documentos (→ Claude API Vision)
│   ├── orders/        # Pedidos a proveedores
│   ├── personal/      # RRHH, plantilla, nominas, horarios
│   ├── config/        # Configuracion restaurante
│   ├── providers/     # Gestion de proveedores
│   └── users/         # Gestion de usuarios y permisos
├── pages/             # Paginas de alto nivel (composicion final)
├── types/             # Tipos TypeScript del dominio (6 archivos)
├── config/            # Firebase config
├── services/          # Servicios LEGACY (migrando a @core)
├── hooks/             # Hooks LEGACY (migrando a @core)
└── App.tsx            # Routing + providers
```

**Puerto:** 3004

**Futuro:** Monorepo con app principal + panel admin empresarial.
La estructura `src/shared/` ya prepara esta separacion.

## Imports canonicos (SIEMPRE estos paths)

| Alias | Resuelve a | Uso |
|-------|-----------|-----|
| `@shared/*` | `src/shared/*` | Componentes, tokens, config |
| `@core` / `@core/*` | `src/core/*` | Infraestructura base |
| `@services` / `@services/*` | `src/core/services/*` → `src/services/*` (legacy fallback) | Servicios Firebase y negocio |
| `@context` / `@context/*` | `src/core/context/*` → `src/context/*` (legacy fallback) | Contextos React |
| `@hooks` / `@hooks/*` | `src/core/hooks/*` → `src/hooks/*` (legacy fallback) | Hooks custom |
| `@types/*` | `src/types/*` | Tipos del dominio |
| `@features/*` | `src/features/*` | Modulos de negocio |
| `@pages/*` | `src/pages/*` | Paginas |
| `@utils/*` | `src/utils/*` | Utilidades |
| `@components/*` | `src/shared/components/*` | Shortcut for shared components |
| `@/*` | `src/*` | Fallback general |

## Modulos del producto

### Existentes
| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| Dashboard | `/` | Panel de control con KPIs |
| Almacen | `/almacen` | 6 tabs: Existencias, Inventarios, Mermas, Pedidos, Proveedores, Traspasos |
| Cierres | `/cierres` | Cierre de caja (wizard con metodos de pago) |
| Documentos | `/docs` | Reconocimiento de albaranes/facturas (Claude API Vision) |
| P&L | `/pnl` | 2 tabs: Resultados, Gastos Fijos |
| Escandallos | `/escandallos` | Recetas, calculo de costes, margenes |
| Personal | `/equipo` | Plantilla, nominas, horarios |
| Configuracion | `/configuracion` | Config restaurante (protegido: configuracion.edit) |

### Previstos (sin implementar)
| Modulo | Descripcion |
|--------|-------------|
| Onboarding + Formacion | Dosieres, fichas tecnicas, examenes, certificaciones |
| Checklists Operativos | Apertura, cierre, limpieza, mantenimiento (con fotos, revisiones) |
| Informes Diarios | Resumen automatico del dia para director |
| Panel Admin Empresarial | App separada para gestion multi-empresa |

## Roles y permisos

Sistema abierto y extensible. Roles actuales (src/shared/config/systemRoles.ts):

| Rol | Nivel | Multi-restaurante | Acceso |
|-----|-------|-------------------|--------|
| director_operaciones | 1 | Si | Todo (18 modulos) |
| director_restaurante | 2 | No | Todo excepto multi-restaurante |
| encargado | 3 | No | Operaciones diarias |
| jefe_cocina | 3 | No | Cocina, escandallos, inventarios |
| camarero | 4 | No | Dashboard, bar, escandallos (lectura) |
| cocinero | 5 | No | Dashboard, cocina, escandallos (lectura) |

**Extensible:** Nuevos roles (financiero, admin, auditor, etc.) se anaden en systemRoles.ts.
18 modulos de permisos. Permisos granulares por modulo (no todos tienen los 4: view/create/edit/delete).
Zonas de inventario por rol (bar, cocina, camara, almacen).

## Tokens de diseno (fuente de verdad: src/shared/styles/tokens.css)

```css
/* Colores principales */
--primary: #111827          /* Gray 900 — brand */
--accent: #e11d48           /* Rose 600 — CTA */
--background: #f3f4f6       /* Cool Gray 100 */
--surface: #ffffff
--text-main: #111827
--text-secondary: #4b5563   /* WCAG AA compliant */
--border: #e5e7eb

/* Semanticos */
--success: #10b981          /* Emerald */
--warning: #f59e0b          /* Amber */
--danger: #ef4444           /* Red */

/* Tipografia */
--font-heading: 'Public Sans'
--font-body: 'Public Sans'

/* Sombras elevacion */
--shadow-sm, --shadow, --shadow-md, --shadow-lg

/* Z-index escala */
dropdown:100 sticky:200 fixed:300 modal-backdrop:400 modal:500 popover:600 tooltip:700 toast:800
```

**Touch targets:** 44px minimo (mobile-first, camareros con movil en sala).

## Reglas absolutas

1. **CALIDAD > VELOCIDAD.** Sin excepciones.
2. **BLOQUEO POR DEFECTO.** Todo codigo no nombrado en la tarea esta BLOQUEADO. Leer ≠ permiso para modificar. Si necesitas tocar algo bloqueado: PARA, informa, espera decision.
3. **NUNCA crear en features/ lo que puede ir en shared/.** Buscar primero con Glob.
4. **NUNCA hardcodear:** colores (usar tokens CSS), z-index (usar escala), shadows (usar tokens).
5. **NUNCA `any`**, `@ts-ignore`, `as unknown as X`. TypeScript strict siempre.
6. **NUNCA `console.log`** en codigo final. Usar LoggerService.
7. **NUNCA catch vacio.** Pattern: `catch (error: unknown) { logError(error, context); showToast.error(msg) }`.
8. **Arreglar TODAS las instancias** de un patron, no solo algunas.
9. **Hooks React ANTES de returns condicionales.** SIEMPRE.
10. **Ante ambiguedad:** PARAR y preguntar a Aitor. Nunca asumir. Nunca inventar.
11. **4 estados obligatorios** en paginas con datos async: LOADING, DATA, EMPTY, ERROR.
12. **3 fases obligatorias** en acciones async: IDLE → LOADING → RESULT (toast).
13. **Acciones destructivas** requieren confirmacion explicita con nombre de accion.
14. **Claude API Vision** para reconocimiento de documentos. NO Tesseract/OCR generico.
15. **Cloud Functions** (europe-west1) cuando la logica lo requiera. Siempre idempotentes.
16. **Imports ordenados:** React → third-party → @shared → @core → @features → local.
17. **Named exports ONLY.** No default exports.
18. **Un componente por archivo.** PascalCase.
19. **Hooks custom:** prefijo `use`, en carpeta hooks/.
20. **Constantes** en archivos `constants.ts`. Nunca strings magicos sueltos.
21. **NUNCA eliminar ni modificar codigo no pedido explicitamente.** Hallazgos van al reporte final.

## Contratos (tabla trigger → contrato obligatorio)

| Si la tarea involucra... | Contratos OBLIGATORIOS |
|--------------------------|----------------------|
| className, estilos, colores, sombras, bordes | `VISUAL_CONTRACT.md` |
| Pantalla nueva o arquetipo de pagina | `UX_CONTRACT.md` + `VISUAL_CONTRACT.md` |
| Firestore queries, rules, colecciones, indices | `FIREBASE_CONTRACT.md` |
| Flujo de usuario, estados, textos visibles | `PRODUCT_CONTRACT.md` |
| Componente nuevo o modificacion de shared | `COMPONENT_INVENTORY.md` |
| Tests, verificacion, coverage | `TESTING_CONTRACT.md` |
| Deploy, hosting, functions | `DEPLOYMENT_CONTRACT.md` |
| Rutas, navegacion, code-splitting | `ROUTING_CONTRACT.md` |
| Error handling, catch blocks, toasts | `ERROR_HANDLING_CONTRACT.md` |
| Accesibilidad, ARIA, keyboard nav | `ACCESSIBILITY_CONTRACT.md` |
| Performance, bundle, lazy loading | `PERFORMANCE_CONTRACT.md` |
| Estado, Context, useState | `STATE_MANAGEMENT_CONTRACT.md` |
| OCR, albaranes, facturas, documentos | `DOCUMENT_RECOGNITION_CONTRACT.md` |

> **NUNCA decidir que un contrato "no es relevante" sin verificar la tabla.**

## Colecciones Firebase principales

| Coleccion | Descripcion | Clave |
|-----------|-------------|-------|
| productos | Ingredientes y productos | proveedor FK |
| proveedores | Proveedores del restaurante | 14 campos |
| facturas | Facturas recibidas | InvoiceProduct[] |
| albaranes | Notas de entrega | Similar a facturas |
| inventarios | Conteos de stock | InventoryProductCount[] |
| escandallos | Recetas con coste | Ingredient[], margenes |
| cierres | Cierres de caja diarios | Datafono[], OtroMetodo[], Delivery[] |
| usuarios | Usuarios del sistema | role FK, restaurantId |
| roles | Roles y permisos | Permission[] |
| companies | Empresas (multi-tenant) | restaurantIds[] |
| restaurants | Restaurantes | companyId FK |
| workers | Personal/plantilla | Fichajes, ausencias |
| fichajes | Registro de jornada | Entradas/salidas |
| nominas | Nominas mensuales | Calculos SS |
| gastosFijos | Gastos fijos recurrentes | Tipo, importe, periodo |

## Convenciones

- **Componentes React:** PascalCase, un componente por archivo, named exports
- **Hooks custom:** prefijo `use`, en carpeta hooks/
- **Types/Interfaces:** PascalCase, en src/types/ o colocados con su feature
- **Servicios:** en src/core/services/, PascalCase + "Service" suffix
- **Constantes:** UPPER_SNAKE_CASE, en archivos constants.ts
- **Imports:** ordenados (React → third-party → @shared → @core → local)
- **Codigo:** ingles. **UI visible:** espanol con tildes.
- **Git:** rama main, siempre deployable. Commits en espanol, descriptivos.
- **No commitear** codigo que no compila.

## Comandos

```bash
npm run dev          # Dev server (puerto 3004)
npm run build        # Build produccion
npm run preview      # Preview build
npm test             # Tests (Vitest)
npm run test:ui      # UI de tests
npm run test:coverage # Cobertura
```

```bash
# Firebase
npx firebase deploy --only firestore:rules --project pylhospitality
npx firebase deploy --only firestore:indexes --project pylhospitality
# Futuro: firebase deploy --only functions, hosting
```

## Usuario de prueba

- Email: `director@pltest.com`
- Rol: `director_operaciones`
- Acceso: todos los modulos

## Comunicacion

- **Aitor** es director de restaurante con 15+ anos de experiencia, NO programador.
- Las decisiones tecnicas las toma el agente. Si Aitor sugiere algo tecnico, evaluar si es la mejor opcion y orientarle.
- Codigo: ingles. Commits: espanol. UI: espanol con tildes.
- Ante duda: PARAR y preguntar. Nunca asumir. Nunca inventar.
- Reportes de tarea siempre en espanol.

## Inspector Anti-Regresiones (obligatorio)

Al final de CADA sesion de trabajo, ejecutar el skill `inspector` ANTES de decir "listo".
Ver `.claude/skills/inspector/SKILL.md`.

## Deuda tecnica activa

- Migracion gradual de servicios/hooks legacy (src/services, src/hooks) a src/core/
- Duplicidad componentes: RESUELTO (ButtonV2 consolidado en Button, sesion #007)
- OCR con Tesseract.js → migrar a Claude API Vision
- 0 Cloud Functions (se anadiran cuando proceda)
- TypeScript 6.0 → migrar cuando ecosistema lo soporte
- CI/CD: sin GitHub Actions (deploy manual)
- Testing: 359 tests, cobertura incompleta
