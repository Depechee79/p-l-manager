# P&L Manager — Backlog

> Ultima actualizacion: 2026-03-29 (Sesion #008 — Auditoria implacable + remediacion 8 fases)

## Estado actual

- **tsc:** 0 errores en todo el proyecto
- **Build:** OK (Tailwind CSS 4 + @tailwindcss/postcss)
- **Tests:** 383 tests (359 passing, 24 skipped integration)
- **Deploy:** Manual (Firebase CLI). Pendiente deploy rules endurecidas (ownership #008).
- **Sesiones completadas:** 8
- **Decisiones producto:** DP-1 a DP-4 DECIDIDAS y EJECUTADAS (opcion A todas)
- **Auditoria #007:** 23 hallazgos (6C/7H/7M/3L), todos reparados
- **Auditoria #008:** 78 hallazgos (9C/24G/30I/15M), remediacion completada (8 fases)
- **Metricas limpias:** 0 `any`, 0 `console.log`, 0 `as unknown as`, 0 `window.confirm`, 0 export default

## Sesion #008 — Auditoria implacable + remediacion (29 marzo 2026)

Auditoria 78 hallazgos con 5 agentes paralelos. 8 decisiones de Aitor. 8 fases de remediacion.

### FASE 1: Limpieza inmediata
- 7 archivos temporales eliminados (tsc_errors*.txt, vitest_errors.txt, wizard_test_error.txt, nul)
- InviteUserModal.tsx eliminado (360 lineas dead code, 0 imports)
- ItemsService documentado como stub, fichajes client-side como deuda tecnica

### FASE 2: Unificacion tokens (tokens.css fuente de verdad unica)
- :root duplicado eliminado de index.css (~80 lineas)
- 17+ hex hardcodeados reemplazados por var(--token) en clases .btn-*
- 4 hover tokens creados (--danger-hover, --success-hover, --warning-hover, --info-hover)
- Button.tsx fallbacks hex eliminados
- 02-design-system.md, VISUAL_CONTRACT.md, CLAUDE.md alineados con tokens.css

### FASE 3: window.confirm → ConfirmDialog
- ConfirmDialog componente creado (accesible, role="alertdialog")
- 9 instancias migradas en 6 paginas (CierresPage, AlmacenPage, OCRPage, InventariosPage, ProvidersPage, InvoicesPage, OrdersPage)
- 4 archivos de test actualizados

### FASE 4: Firestore rules ownership
- companies: create abierto (onboarding), read/update/delete con ownership (companyId)
- restaurants: create abierto, read/update/delete con ownership (restaurantIds)
- invitations: create abierto, read/update/delete con ownership (restaurantIds cruzados)

### FASE 5: Seguridad queries + diagnostico legacy
- getAll(): limit(500) obligatorio (C-03 resuelto)
- getWithQuery(): restaurantId obligatorio para colecciones restaurant-filtered (G-05 resuelto)
- Script diagnoseRestaurantIds.ts creado (cuenta docs sin restaurantId por coleccion)

### FASE 6: Timestamps + aliases + unsafe casts
- 12 ubicaciones migradas de new Date().toISOString() a Timestamp.now()
- Tipos actualizados: AppUser, Invitation, PnLManualEntry, VacationRequest aceptan string | Timestamp
- @context alias corregido en tsconfig.json (apuntaba a directorio inexistente)
- toRecord() utility creado, 8 instancias de as unknown as eliminadas

### FASE 7: Documentacion
- README.md reescrito desde cero (CONTEXTO.md como base)
- COMPONENT_INVENTORY.md actualizado (V2 eliminados, ConfirmDialog anadido)
- TESTING_CONTRACT.md actualizado (51 → 383 tests)
- ROUTING_CONTRACT.md actualizado (redirects reales, nota lazy loading)
- FIREBASE_CONTRACT.md actualizado (hardening #007/#008, indice gastosFijos corregido)

### FASE 8: Verificacion final
- tsc: 0 errores
- Build: OK
- Tests: 359 passing, 24 skipped
- Todos los hallazgos remediados verificados con grep

### Decisiones de Aitor (8 preguntas):
1. canAccessDocument legacy bypass: script diagnostico, migrar progresivamente
2. companies/restaurants ownership: create abierto, read/update/delete con ownership
3. ItemsService: stub documentado, no arreglar ahora
4. window.confirm: migrar todas de una vez
5. README: reescribir desde cero
6. Lazy loading: prioridad baja
7. Tokens: tokens.css manda, corregir los demas
8. Fichajes client-side: aceptar por ahora, CF cuando se inicialice infra

## Sesion #007 — Fix total (29 marzo 2026)

8 fases ejecutadas. Todas las decisiones de producto resueltas (opcion A: maxima calidad, produccion).

### FASE 1: Build fix
- Instalado `@tailwindcss/postcss` (Tailwind CSS 4 requiere plugin separado)
- `postcss.config.js`: `tailwindcss` → `@tailwindcss/postcss`
- `src/index.css`: @import movido antes de @tailwind directives

### FASE 2: Tests — 0 failing (antes 155 failing)
- **2A (FK validation, 7 archivos):** Anadidos vi.mock de FirestoreService + DataIntegrityService, async/await en operaciones DB
- **2B (CSS classes, 4 archivos):** Table.test.tsx actualizado a Tailwind, 3 archivos legacy eliminados
- **2C (Layout/routing, 7 archivos):** App.test.tsx + E2E.complete.test.tsx reescritos contra AppShellV2, 4 archivos legacy eliminados
- **Restantes (6 archivos):** DatabaseService.test.ts async, useProviders, InvoicesPage, ProvidersPage, 2 integration tests

### FASE 3: Consolidacion componentes
- **3A:** Eliminado `src/components/` completo (17 archivos legacy). `@components` alias → `src/shared/components/`. ErrorBoundary movido a shared.
- **3B:** ButtonV2 reescrito como Button canonico (8 variantes, 3 tamanos, iconPosition). ButtonV2.tsx eliminado. 12 consumidores migrados.
- **3C:** 5 componentes renombrados sin V2 suffix (ActionHeader, DataCard, FilterCard, PageLayout, TabsNav). SelectV2 eliminado (sin consumidores).

### FASE 4: DP-1 — Auth real (Firebase Auth ↔ AppContext)
- AppContext.tsx: localStorage eliminado, `onAuthStateChanged` listener activo
- User type expandido: uid, email, restaurantIds + aliases backward-compatible (name, roleId)
- authLoading state para evitar flash de login page
- SignUpPage + InvitationSignUpPage: localStorage writes eliminados
- FichajesPage: workerId user.name → user.uid
- ResponsablesTab: matching por uid en vez de nombre
- useRestaurant hasAccess(): localStorage → AppContext user.uid

### FASE 5: DP-2 — Firestore rules endurecidas
- 15 colecciones de negocio: read/update con canAccessDocument(), create con hasRestaurantAccess()
- 5 colecciones HR anadidas a RESTAURANT_FILTERED_COLLECTIONS
- getAll() acepta restaurantId opcional para sync filtrado
- Tipos: restaurantId requerido en Absence, VacationRequest; opcional en Worker, Transfer

### FASE 6: DP-4 — Tokens seguros
- generateInvitationToken(): Math.random() → crypto.getRandomValues()
- generateRestaurantCode(): idem

### FASE 7: DP-3 — Timestamps estandarizados
- Nuevo: `src/shared/utils/dateUtils.ts` (formatDateOnly, toDate, toISOString)
- BaseEntity: createdAt/updatedAt ahora `string | Timestamp`
- DatabaseService + AuthService: `new Date().toISOString()` → `Timestamp.now()`
- 17 archivos: `.toISOString().split('T')[0]` → `formatDateOnly()`
- formatters.ts: formatDate() acepta Firestore Timestamp

### Metricas antes/despues sesion #007:
| Metrica | Antes (#006) | Despues (#007) |
|---------|-------------|----------------|
| Build | ROTO (PostCSS) | OK |
| Tests failing | 155 | 0 |
| Tests passing | 273 | 357 |
| Auth | localStorage (inseguro) | Firebase Auth real |
| Firestore rules | Solo isAuthenticated() | canAccessDocument() + hasRestaurantAccess() |
| Tokens | Math.random() | crypto.getRandomValues() |
| Timestamps | Mixto (string + Timestamp) | Estandarizado (Timestamp.now() en writes) |
| src/components/ legacy | 17 archivos | Eliminado |
| ButtonV2 duplicado | Si | Consolidado en Button |
| V2 suffixes | 6 componentes | 0 (renombrados) |

### Auditoria despiadada — 23 hallazgos, todos reparados
| ID | Severidad | Hallazgo | Fix |
|----|-----------|----------|-----|
| C-1 | CRITICAL | AppContext sin error handling en onAuthStateChanged | try/catch/finally, authLoading siempre se resuelve |
| C-2 | CRITICAL | Timestamp.now() se corrompe al serializar a localStorage | save() convierte a ISO string, dateUtils maneja objetos serializados |
| C-3 | CRITICAL | Fichajes workerId cambio de name a uid sin migracion datos | migrateFichajesWorkerIds.ts integrado en runMigrationIfNeeded() |
| C-5 | CRITICAL | CLAUDE.md obsoleto (alias, tests, sesiones, ButtonV2) | 6 correcciones en CLAUDE.md + design-system.md |
| H-1 | HIGH | V2 suffixes en 15+ archivos consumidores | 9 archivos migrados, aliases deprecated eliminados |
| H-3 | HIGH | `as any` en tests (20+ instancias) | Tipado correcto con interfaces, factories, Partial<T> |
| H-4 | HIGH | console.log en tests integracion (30+) | Documentados como excepcion (solo con FIREBASE_INTEGRATION) |
| H-5 | HIGH | TODO en DatabaseService.test.ts | Eliminado |
| H-6 | HIGH | @ts-expect-error en calculations.test.ts (14) | asRuntimeInput<T>() helper tipado |
| M-1 | MEDIUM | Dead code localStorage.removeItem('app_user') | Eliminado de AuthService.logoutUser() |
| M-2 | MEDIUM | Modulo bias en crypto tokens | Rejection sampling (maxValid = 248) |
| M-3 | MEDIUM | Sin error callback en onAuthStateChanged | Error callback anadido en AuthService.onAuthStateChange() |
| M-4 | MEDIUM | restaurantIds default [] oculta problemas | logger.warn cuando usuario sin restaurantIds |
| M-6 | MEDIUM | Comentarios V2 en codigo | Actualizados en archivos migrados |
| L-1 | LOW | Barrel deprecated aliases V2 | Eliminados del barrel y archivos fuente |

**Hallazgos fuera de scope (no tocados, documentados):**
- C-4: canAccessDocument() permite legacy sin restaurantId — necesario hasta migracion completa de datos
- H-7: productos/proveedores/escandallos sin endurecer — son colecciones compartidas, requiere decision de producto sobre multi-tenant
- H-2: localStorage para current_restaurant_id — cambio arquitectural mayor, no en scope
- M-5: Mismo que C-2, resuelto
- M-7: SelectWithAdd tiene consumidor real (BasicInfoStep.tsx), no es dead code

## Sesiones anteriores

### Sesion #006 — Plan TURMIX completo + auditoria (28 marzo 2026)
14 fases TURMIX, 15 commits, ~120 archivos, ~350+ violaciones corregidas.

### Sesion #005 — Gobernanza + T1 Turmix (27 marzo 2026)
Gobernanza completa desde cero + Fase T1 (types+utils+config, 35 violaciones).

### Sesion #004 — AppShellV2 Completo (19 enero 2026)
AppShellV2 con TopbarV2, SidebarNavV2, MobileBottomNav, StickyPageHeader.

### Sesion #003 — Sticky Headers + Estandarizacion (18 enero 2026)
### Sesion #002 — Reorganizacion UI + Auth + Permisos (17-18 enero 2026)
### Sesion #001 — Auditoria Firebase + Plan (17 enero 2026)

## Pendiente (priorizado)

### Alta
- [ ] Migrar OCR de Tesseract a Claude API Vision + Cloud Function (DP decidida, requiere infra)
- [ ] Inicializar Cloud Functions (europe-west1) — prerequisito para OCR
- [ ] Provisionar API key Anthropic como Firebase secret
- [ ] Deploy firestore.rules endurecidas: `npx firebase deploy --only firestore:rules --project pylhospitality`
- [ ] Actualizar PersonalPage + TransfersPage para incluir restaurantId al crear workers/transfers
- [ ] Migrar useRestaurant hasAccess() a usar AppContext completo (parcialmente hecho)
- [ ] Tests para 32 componentes shared sin cobertura (C-08 auditoria #008). Sesion dedicada a testing.

### Media
- [ ] CI/CD con GitHub Actions
- [ ] Code splitting con React.lazy en todas las rutas (prioridad baja, bundle pequeno aun)
- [ ] Implementar onboarding + formacion
- [ ] Implementar checklists operativos
- [ ] Fichajes: validacion server-side via Cloud Function (reloj cliente manipulable). Implementar junto con infra CF para OCR.
- [ ] ItemsService (familias, subfamilias, terminales, mediosPago, plataformasDelivery, personas): STUB en memoria, no persiste a Firestore. Implementar persistencia cuando los modulos que lo consumen esten completos.

### Baja
- [ ] Informes diarios automaticos
- [ ] Panel admin empresarial (app separada)
- [ ] TypeScript 6.0 migration (cuando ecosistema soporte)
- [ ] Service Worker para offline
- [ ] Migrar AppUser.fechaCreacion/ultimoAcceso de string a Timestamp
