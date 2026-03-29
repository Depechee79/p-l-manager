# AUDITORIA IMPLACABLE -- P&L MANAGER (POST-TURMIX)

> Fecha: 2026-03-29
> Modo: SOLO LECTURA -- 0 archivos modificados
> Alcance: sesiones #001 a #007 (construccion + gobernanza + transformacion completa)
> Agentes: 5 agentes paralelos, auditoria exhaustiva con grep y evidencia

---

## RESUMEN EJECUTIVO

| Metrica | Valor |
|---------|-------|
| Total hallazgos | 78 |
| CRITICOS | 9 |
| GRAVES | 24 |
| IMPORTANTES | 30 |
| MENORES | 15 |

---

## HALLAZGOS CRITICOS

| # | Categoria | Hallazgo | Archivo:Linea | Evidencia | Impacto | Sesion |
|---|-----------|----------|---------------|-----------|---------|--------|
| C-01 | Seguridad/Rules | `canAccessDocument()` permite acceso a CUALQUIER documento sin `restaurantId` (legacy bypass). Cualquier usuario autenticado accede a datos de otros restaurantes si el doc no tiene `restaurantId`. | `firestore.rules:52-58` | `!('restaurantId' in resource.data) \|\| resource.data.restaurantId == null` | Multi-tenant ROTO para datos legacy | #007 (documentado, no resuelto) |
| C-02 | Seguridad/Rules | 13 colecciones operativas usan `canAccessDocument()` que hereda el bypass C-01. Cualquier doc sin `restaurantId` en estas colecciones es accesible cross-tenant. | `firestore.rules:119-227` | Todas las colecciones de negocio afectadas | Fuga datos cross-tenant | #007 |
| C-03 | Seguridad | `getAll()` en FirestoreService obtiene TODOS los docs sin filtro `restaurantId` ni `limit()`. | `FirestoreService.ts:338-340` | `getDocs(collectionRef)` sin where, sin limit | Lectura masiva cross-tenant | #001+ |
| C-04 | Visual/Tokens | **Triple fuente de verdad en conflicto.** `tokens.css`, `index.css` e ambos definen `:root` con valores DIFERENTES para `--text-secondary`. tokens.css: `#6b7280`, index.css: `#4b5563`. El que carga ultimo gana. | `tokens.css:29` vs `index.css:23` | Dos `:root` blocks con mismo token, valores distintos | Color impredecible en produccion | #005 |
| C-05 | Visual/Tokens | **Escala tipografica completamente divergente.** VISUAL_CONTRACT documenta una escala, tokens.css implementa OTRA. 6 de 8 valores difieren (ej: `--font-size-lg`: contrato=20px, tokens=18px; `--font-size-3xl`: contrato=40px, tokens=28px). | `VISUAL_CONTRACT.md:85-93` vs `tokens.css` | 6 valores discrepantes | Agentes implementan segun contrato pero codigo tiene otros valores | #005 |
| C-06 | Visual/Tokens | **Regla `02-design-system.md` tiene 4 colores semanticos DISTINTOS a tokens.css.** Regla: success=#16a34a, warning=#d97706, danger=#dc2626, info=#2563eb. tokens.css: success=#10b981, warning=#f59e0b, danger=#ef4444, info=#3b82f6. | `02-design-system.md` vs `tokens.css` | 4 colores shade-600 en regla vs shade-500 en tokens | Agentes usan colores equivocados | #005 |
| C-07 | Visual/Tokens | **Regla `02-design-system.md` define 5 tokens que NO EXISTEN en tokens.css:** `--bg`, `--bg-subtle`, `--bg-muted`, `--border-strong`, `--accent-light`. | `02-design-system.md` vs `tokens.css` | Tokens fantasma en la regla | Codigo que los use obtiene valor vacio | #005 |
| C-08 | Tests | **80% de componentes shared SIN tests.** Solo 8 de 40 componentes tienen tests (Button, Card, FormField, Input, LoadingState, Modal, ProtectedRoute, Table). 32 componentes sin cobertura: Badge, Select, DatePicker, ErrorBoundary, todos los layout, etc. | `src/shared/components/` | 8/40 = 20% cobertura | Regresiones invisibles en 32 componentes | #001-#007 |
| C-09 | Timestamps | **ItemsService.ts: 6 metodos escriben SOLO en memoria con `new Date().toISOString()`.** addFamilia, addSubfamilia, addTerminal, addMedioPago, addPlataformaDelivery, addPersona NO escriben a Firestore. Datos efimeros perdidos al refrescar. | `ItemsService.ts:90,149,190,223,256,295` | `new Date().toISOString()` + sin Firestore write | Datos se pierden en refresh | #001+ |

---

## HALLAZGOS GRAVES

| # | Categoria | Hallazgo | Archivo:Linea | Evidencia | Impacto | Sesion |
|---|-----------|----------|---------------|-----------|---------|--------|
| G-01 | Rules | `companies`: cualquier usuario autenticado puede crear/actualizar CUALQUIER empresa. Sin ownership check. | `firestore.rules:71-76` | `allow create/update: if isAuthenticated()` | Manipulacion cross-tenant | #007 |
| G-02 | Rules | `restaurants`: cualquier usuario autenticado puede crear/actualizar CUALQUIER restaurante. | `firestore.rules:79-84` | `allow create/update: if isAuthenticated()` | Manipulacion cross-tenant | #007 |
| G-03 | Rules | `invitations`: cualquier usuario autenticado puede crear invitaciones para CUALQUIER restaurante. | `firestore.rules:95-100` | `allow create/update: if isAuthenticated()` | Invitaciones fraudulentas | #007 |
| G-04 | Rules | **Sin field whitelist en updates.** Ningun update valida QUE campos se escriben. Un usuario podria inyectar campos arbitrarios (ej: `isAdmin: true`). | `firestore.rules:*` | No `request.resource.data.keys().hasOnly(...)` | Escalacion privilegios | #001-#007 |
| G-05 | Seguridad | `getWithQuery()` tiene `restaurantId` OPCIONAL. Si el caller omite restaurantId, no se filtra por restaurante. | `FirestoreService.ts:437-491` | `if (options.restaurantId) { constraints.push(...) }` | Queries cross-tenant si se omite | #001+ |
| G-06 | Timestamps | **AuthService: 5 ubicaciones con `new Date().toISOString()` para timestamps de Firestore** en signup, login, invitation. Inconsistente con DatabaseService que usa `Timestamp.now()`. | `AuthService.ts:124,247,295,349,441` | Misma funcion usa Timestamp.now() para company pero new Date() para user | Timestamps mixtos en misma coleccion | #007 (parcialmente migrado) |
| G-07 | Timestamps | **escandallo-service.ts: createdAt/updatedAt con `new Date().toISOString()`** en servicio legacy. | `escandallo-service.ts:60-61,107-108` | `new Date().toISOString()` | Timestamps inconsistentes | #001+ |
| G-08 | Timestamps | **FichajesPage: clock-in/clock-out con `new Date()` del cliente.** Empleados podrian manipular reloj del dispositivo para falsear fichajes. | `FichajesPage.tsx:81,87,114` | `new Date()` para registro horario | Fichajes falsificables | #001+ |
| G-09 | Timestamps | **PnLPage: write con `new Date().toISOString()` directamente en pagina** (deberia ser servicio). | `PnLPage.tsx:396` | `createdAt: new Date().toISOString()` | Timestamp en capa incorrecta | #001+ |
| G-10 | UX | **9 `window.confirm()` en 6 paginas.** Viola UX_CONTRACT (modal de confirmacion) Y ERROR_HANDLING_CONTRACT (anti-patron). | `CierresPage.tsx:74`, `AlmacenPage.tsx:428,434`, `InventariosPage.tsx:58`, `OCRPage.tsx:190`, `ProvidersPage.tsx:66`, `InvoicesPage.tsx:59`, `OrdersPage.tsx:61,67` | `window.confirm(...)` | Experiencia inconsistente | #001+ |
| G-11 | UX | **DashboardPage sin estados obligatorios.** No tiene LOADING (skeleton), ERROR ni EMPTY state. Viola UX_CONTRACT seccion 2. | `DashboardPage.tsx` | Sin `if (loading)`, `if (error)`, empty check | Pagina principal sin feedback | #001+ |
| G-12 | Visual | **17+ colores hex hardcodeados en index.css** fuera de `:root`. En `.btn-danger`, `.btn-success`, `.step.active`, etc. | `index.css:349,355,407,433...` | `#fef2f2`, `#fecaca`, `#3b82f6`, etc. | Viola contrato visual regla 1.7 | #001+ |
| G-13 | Visual | **Border radius: contrato vs tokens completamente distinto.** Contrato: `RADIUS_SM=8px, RADIUS=12px, RADIUS_LG=16px`. tokens.css: `--radius-sm=6px, --radius=8px, --radius-lg=12px`. | `VISUAL_CONTRACT.md:160` vs `tokens.css` | Nombres y valores no coinciden | Radios impredecibles | #005 |
| G-14 | Routing | **Contrato dice lazy-loaded pages. CERO paginas usan `React.lazy()`.** Todas se importan sincronamente. | `ROUTING_CONTRACT.md:266` vs `App.tsx` | No `React.lazy()`, no `Suspense` | Contrato no se cumple | #005 |
| G-15 | Tests | **~74 `as any` en tests** en 6 archivos de test. Bypasean TypeScript, ocultan cambios de tipos. | `FinanceService.test.ts` (16), `useFinance.test.ts` (10), `useInventory.test.ts` (17), `useProviders.test.ts` (12), `useInvoices.test.ts` (12), `InventoryService.test.ts` (7) | `as any` en datos de test | Tests no validan tipos reales | #001-#007 |
| G-16 | Dead code | **7 archivos temporales de debug en raiz del repo.** `tsc_errors.txt`, `tsc_errors2.txt`, `tsc_output.txt`, `tsc_output2.txt`, `vitest_errors.txt` (1383 lineas), `wizard_test_error.txt` (762 lineas, TRACKED por git), `nul` (artefacto Windows). | Raiz del proyecto | `ls -la tsc_errors.txt ...` | Basura en repositorio | #006-#007 |
| G-17 | Dead code | **InviteUserModal.tsx: 360 lineas de codigo muerto.** Nunca importado en ningun archivo del proyecto. | `src/features/users/components/InviteUserModal.tsx` | `grep -r InviteUserModal src/` = solo auto-referencias | 360 lineas sin usar | #001+ |
| G-18 | Docs | **README.md completamente obsoleto.** Dice 319 tests (son 383), Tesseract.js (eliminado), Inter font (es Public Sans), colores #1171ef (es #e11d48), estructura `src/components/` (eliminado), "100% local" (es Firebase). | `README.md:19,24,55,143,139` | Comparacion directa README vs CLAUDE.md y codigo | README de otra era | #001 (nunca actualizado) |
| G-19 | Docs | **COMPONENT_INVENTORY.md lista ButtonV2 como existente y V2 components como pendientes de consolidar.** Todo esto se resolvio en #007. | `COMPONENT_INVENTORY.md:6-9,70-85` | "Consolidar en uno solo" -- ya hecho | Inventario 2 sesiones atrasado | #005 (no actualizado tras #007) |
| G-20 | Docs | **TESTING_CONTRACT dice "51 tests".** Hay 383 tests reales. Diferencia de 332. | `TESTING_CONTRACT.md:6` | 51 vs 383 | Contrato 7x desactualizado | #005 |
| G-21 | Visual | **Button.tsx: 4 hex fallbacks para tokens que NO EXISTEN en tokens.css.** `--danger-hover`, `--success-hover`, `--warning-hover`, `--info-hover` no estan definidos. Los fallbacks hex siempre se usan. | `Button.tsx:60,64,68,72` | `var(--danger-hover,#b91c1c)` -- variable no existe | Colores "tokenizados" que son hardcoded | #007 |
| G-22 | Docs | **FIREBASE_CONTRACT muestra patron de rules PRE-#007.** El contrato dice `allow read: if isAuthenticated()` pero las rules reales usan `canAccessDocument()`. Las rules son MEJORES que el contrato. | `FIREBASE_CONTRACT.md:126-128` | Contrato stale | Contrato no refleja mejora | #007 |
| G-23 | Tests | **23 tests SIEMPRE skipped** (2 suites de integracion + 1 it.skip). Nunca corren en local ni CI. | `FirestoreService.connection.test.ts`, `FirebaseArchitecture.integration.test.ts`, `DatabaseService.test.ts:67` | `describe.skipIf(!runIntegration)` + `it.skip` | Cobertura inflada: reporta "24 skipped" pero nadie los ejecuta | #007 |
| G-24 | Docs | **ROUTING_CONTRACT documenta redirects que no existen y omite 11 que si existen.** Dice `/recetas -> /escandallos` y `/ajustes -> /configuracion` (no existen). App.tsx tiene 13 redirects, solo 2 documentados. | `ROUTING_CONTRACT.md:399-401` vs `App.tsx` | 2 de 13 redirects documentados | Contrato inutil para descubrir rutas | #005 |

---

## HALLAZGOS IMPORTANTES

| # | Categoria | Hallazgo | Archivo:Linea | Evidencia | Impacto |
|---|-----------|----------|---------------|-----------|---------|
| I-01 | Aliases | `@services/*` en tsconfig tiene dual fallback (core→legacy) pero vite solo resuelve a `src/services`. Import `@services/AuthService` fallaria en build. | `tsconfig.json` vs `vite.config.ts:14` | Mismatch alias resolution | Build potencialmente roto |
| I-02 | Aliases | `@hooks/*` mismo problema: tsconfig dual, vite solo legacy. Mitigado por re-export barrel. | `tsconfig.json` vs `vite.config.ts:16` | Mismatch alias resolution | Fragilidad oculta |
| I-03 | Aliases | `@context` bare alias en tsconfig apunta a `./src/context` que NO EXISTE. | `tsconfig.json` | `src/context/` no existe como directorio | Alias roto |
| I-04 | Auth | AppContext: sin estado `authError` dedicado. Si `onAuthStateChanged` falla, el usuario obtiene `null` silenciosamente. No hay feedback de error. | `AppContext.tsx:30,77` | `catch { logError(); setUser(null) }` sin setAuthError | Error de auth invisible |
| I-05 | Auth | AppContext: cast `as string` en `appUser.uid \|\| appUser.id`. Si ambos son undefined, pasa falsy como uid. | `AppContext.tsx:64` | `as string` cast inseguro | Uid potencialmente falsy |
| I-06 | Auth | FichajesPage: fallback `'unknown'` como workerId. Crea registros huerfanos imposibles de atribuir. | `FichajesPage.tsx:84` | `user?.uid \|\| 'unknown'` | Fichajes no atribuibles |
| I-07 | Timestamps | 7 ubicaciones mas con `new Date().toISOString()` en writes: ProviderService (2), RolesAdminPage, UserFormWizard, PersonalPage, RolesTab. | Multiples archivos | `new Date().toISOString()` para createdAt | Timestamps cliente inconsistentes |
| I-08 | Rules | `usuarios`: cualquier usuario autenticado lee TODOS los usuarios. Sin scoping por restaurante. | `firestore.rules:87-92` | `allow read: if isAuthenticated()` | Datos de usuarios cross-tenant |
| I-09 | Rules | `nominas` usa `canAccessDocument()` para reads -- hereda bypass legacy (C-01). Nominas = datos salariales sensibles. | `firestore.rules:266-271` | `canAccessDocument()` con legacy bypass | Nominas accesibles cross-tenant |
| I-10 | Rules | Workers index usa `companyId+activo` pero rules verifican `restaurantId`. Query por companyId no matchea la regla. | `firestore.indexes.json:100-105` vs `firestore.rules:234` | Index y rules con campos distintos | Queries potencialmente bloqueadas |
| I-11 | Rules | No deny-by-default catch-all explicitao en rules. Firestore lo aplica por defecto pero el contrato lo exige explicito. | `firestore.rules:1-273` | Falta `match /{document=**} { allow read, write: if false; }` | Depende de default implicito |
| I-12 | Rules | Config collections (`companies`, `restaurants`, `invitations`) son legibles por CUALQUIER usuario autenticado. | `firestore.rules:71-72,79-80,95-96` | `allow read: if isAuthenticated()` | Info organizacional expuesta |
| I-13 | Seguridad | DatabaseService `save()` escribe datos de negocio a localStorage. Datos sensibles (facturas, nominas) accesibles a JS del mismo origin. | `DatabaseService.ts:334` | `localStorage.setItem(key, JSON.stringify(serializable))` | Datos sensibles en browser |
| I-14 | Seguridad | FirestoreService constructor inicializa db al instanciarse. Si es singleton a nivel modulo, viola regla de init en cuerpo de funcion. | `FirestoreService.ts:88-93` | `constructor() { this.db = getFirestoreInstance(); }` | Init prematuro potencial |
| I-15 | Visual | `--height-button-sm` mismatch: contrato dice 36px, tokens.css dice 32px desktop (36px solo mobile). | `VISUAL_CONTRACT.md:184` vs `tokens.css` | 32px vs 36px en desktop | Botones 4px mas pequenos |
| I-16 | UX | ExistenciasTab sin LOADING ni ERROR state. Solo EMPTY y DATA. | `AlmacenPage.tsx (ExistenciasTab)` | Sin skeleton ni error UI | Sin feedback de carga |
| I-17 | Routing | Contrato dice ProtectedRoute con Outlet pattern. App.tsx usa conditional rendering con `isAuthenticated`. Codigo de ejemplo del contrato es incorrecto. | `ROUTING_CONTRACT.md:96-104` vs `App.tsx` | Patron distinto al documentado | Contrato confunde |
| I-18 | Routing | Contrato documenta 4 redirects, solo 2 matchean. 11 redirects reales no documentados. | `ROUTING_CONTRACT.md:399-401` | 11 de 13 sin documentar | Contrato incompleto |
| I-19 | Error handling | Varias paginas tienen catch sin toast para usuario. Solo logError(), sin feedback visual. | Multiples paginas | `catch { logError() }` sin showToast | Errores silenciosos para usuario |
| I-20 | Dead code | 8 `as unknown as Record<string, unknown>` en 6 archivos produccion. Mismo patron repetido, deberia ser utility tipado. | `migration.ts:22`, `ocr-service.ts:103`, `migrateRestaurantIds.ts:65`, `databaseDiagnostics.ts:52,436`, `ItemsService.ts:42,47`, `DataIntegrityService.ts:41` | `as unknown as` bypass | Unsafe casts en produccion |
| I-21 | Dead code | `databaseDiagnostics.ts`: 436+ lineas exportadas via barrel pero nunca consumidas. | `src/core/utils/databaseDiagnostics.ts` | grep muestra 0 imports fuera de barrel | Codigo muerto exportado |
| I-22 | Tests | 14 `.toBeTruthy()` en tests de DOM donde deberia ser `.toBeInTheDocument()`. Pasa para cualquier valor truthy, no verifica DOM real. | `E2E.complete.test.tsx`, `App.test.tsx` | `expect(nav).toBeTruthy()` x14 | Tests debiles |
| I-23 | Tests | Mock boilerplate duplicado en 11 archivos de test. Mismos mocks de FirestoreService + DataIntegrityService copiados identicos. | 11 test files | 22 bloques mock identicos | Mantenimiento fragil |
| I-24 | Tests | OCRFlow.test.tsx mockea los componentes completos con `<div>` triviales. Test verifica el mock, no el componente real. | `OCRFlow.test.tsx:42-50` | `vi.mock` retorna `<div>` simple | Test no testea nada real |
| I-25 | Docs | CLAUDE.md dice `--text-secondary: #4b5563`, tokens.css tiene `#6b7280`. CLAUDE.md discrepa con su propia fuente de verdad. | `CLAUDE.md:128` vs `tokens.css:29` | Valores distintos | Documentacion contradictoria |
| I-26 | Docs | FIREBASE_CONTRACT documenta indice gastosFijos con campo `fecha DESC`. Indice real usa `tipo ASC`. | `FIREBASE_CONTRACT.md:34` vs `firestore.indexes.json:74` | Campo distinto en indice | Contrato no refleja realidad |
| I-27 | Docs | COMPONENT_INVENTORY dice "~54 components" incluyendo duplicados V2. Post-consolidacion el numero real es menor. | `COMPONENT_INVENTORY.md:119` | Total incluye eliminados | Inventario inflado |
| I-28 | Docs | COMPONENT_INVENTORY dice "Ultima actualizacion: Sesion #005". 2 sesiones de cambios no reflejados. | `COMPONENT_INVENTORY.md` | Fecha vs sesion actual | 2 sesiones atrasado |
| I-29 | Legacy | 5 servicios en `src/services/` (legacy) sin migrar a `src/core/services/`: FinanceService, TransferService, escandallo-service, ocr-service, pnl-service. | `src/services/` | 5 archivos legacy | Deuda tecnica documentada |
| I-30 | Legacy | 5 hooks en `src/hooks/` (legacy) sin migrar a `src/core/hooks/`: useFinance, useInventory, useInvoices, useProviders, useTransfers. | `src/hooks/` | 5 archivos legacy | Deuda tecnica documentada |

---

## HALLAZGOS MENORES

| # | Categoria | Hallazgo | Archivo:Linea | Evidencia |
|---|-----------|----------|---------------|-----------|
| M-01 | Naming | AppShellV2, TopbarV2, SidebarNavV2 mantienen sufijo V2 mientras todos los demas se consolidaron sin V2. | `src/shared/components/layout/` | Inconsistencia de nomenclatura |
| M-02 | Alias | 18 archivos usan `@components` en vez del canonico `@shared/components`. Ambos funcionan. | Multiples features | Inconsistencia de convencion |
| M-03 | Comments | `routeMeta.ts:5` referencia "PageHeaderV2" que no existe. | `routeMeta.ts:5` | Comentario stale |
| M-04 | Comments | `Button.tsx:7` menciona "ButtonV2" en comentario historico. | `Button.tsx:7` | Comentario obsoleto |
| M-05 | Rules | `roles` collection: cualquier autenticado lee todos los roles. Menor porque roles son datos de sistema. | `firestore.rules:107-109` | `allow read: if isAuthenticated()` |
| M-06 | Rules | `test_connection` en codigo sin regla en firestore.rules. Default deny lo bloquea en prod. | `FirestoreService.ts:617` | No rules para test_connection |
| M-07 | Rules | `schedules` mencionado como coleccion HR pero no existe en codigo ni rules. | N/A | Solo 4 HR collections + nominas |
| M-08 | Seguridad | Firebase config validation solo verifica apiKey y projectId, no los 6 campos. | `firebase.config.ts:81` | Validacion parcial |
| M-09 | Seguridad | `getInvitationByToken()` sin `limit(1)`. Podria retornar multiples docs en colision. | `AuthService.ts:386-392` | Query sin limit |
| M-10 | Seguridad | `seedSystemRoles()` y `checkFirebaseConnection()` leen roles sin `limit()`. Menor por coleccion pequena. | `AuthService.ts:74-82,634` | getDocs sin limit |
| M-11 | Docs | README dice "100% Local" y "localStorage" en seccion privacidad. Datos estan en Firebase. | `README.md:139` | Factualmente incorrecto |
| M-12 | Docs | Routing contract documenta NotFound page que no existe. App.tsx redirige a `/`. | `ROUTING_CONTRACT.md:411` vs `App.tsx:117` | NotFound vs redirect |
| M-13 | Tests | `as unknown as null` en test de AppContext. | `AppContext.test.tsx:208` | Cast inseguro |
| M-14 | Tests | 1 test en DatabaseService permanentemente skipped sin justificacion. | `DatabaseService.test.ts:67` | `it.skip(...)` |
| M-15 | Dead code | Archivo `nul` (artefacto Windows de `> NUL` en bash). | Raiz proyecto | Artefacto de shell |

---

## COHERENCIA POST-TURMIX

| Aspecto | Estado | Evidencia |
|---------|--------|-----------|
| Imports a `src/components/` (eliminado) | LIMPIO | 0 imports encontrados |
| Nombres V2 en consumidores | LIMPIO | 0 V2 en imports (excepto 3 layout activos) |
| Barrel exports apuntan a archivos existentes | LIMPIO | 29/29 exports verificados |
| Aliases tsconfig vs vite | PROBLEMATICO | 3 mismatches criticos (I-01, I-02, I-03) |
| Legacy services/hooks | PENDIENTE | 10 archivos sin migrar a core (documentado) |
| Componentes V2 consolidados | COMPLETO | 0 ButtonV2, SelectV2, etc. Solo 3 layout V2 activos |

---

## CONTRATOS vs CODIGO

| Contrato | Regla clave | Cumple? | Evidencia |
|----------|-------------|---------|-----------|
| VISUAL_CONTRACT | Tokens como fuente unica | NO | Triple `:root`, valores divergentes (C-04, C-05, C-06) |
| VISUAL_CONTRACT | Sin hex hardcodeados | NO | 17+ en index.css + 4 fallbacks en Button.tsx (G-12, G-21) |
| VISUAL_CONTRACT | Escala tipografica | NO | 6 de 8 valores difieren contrato vs tokens (C-05) |
| VISUAL_CONTRACT | Border radius | NO | Nombres y valores distintos (G-13) |
| UX_CONTRACT | 4 estados pagina | NO | Dashboard sin loading/error/empty (G-11) |
| UX_CONTRACT | Confirmacion destructiva | NO | 9x window.confirm (G-10) |
| FIREBASE_CONTRACT | Rules pattern | PARCIAL | Rules mejores que contrato (I-26), contrato stale |
| FIREBASE_CONTRACT | Indices | PARCIAL | gastosFijos: contrato dice `fecha`, indice tiene `tipo` (I-26) |
| ROUTING_CONTRACT | Lazy loading | NO | 0 paginas lazy-loaded (G-14) |
| ROUTING_CONTRACT | ProtectedRoute pattern | NO | App.tsx usa patron distinto (I-17) |
| ROUTING_CONTRACT | Redirects documentados | NO | 2/13 documentados (G-24) |
| ERROR_HANDLING_CONTRACT | Sin window.confirm | NO | 9 instancias (G-10) |
| ERROR_HANDLING_CONTRACT | catch + logError + toast | PARCIAL | Muchos catch sin toast (I-19) |
| TESTING_CONTRACT | Metricas tests | NO | Dice 51, hay 383 (G-20) |
| PERFORMANCE_CONTRACT | Code splitting | NO | 0 React.lazy (G-14) |

---

## AUTH MIGRATION -- VERIFICACION

| Flujo | Usa Firebase Auth? | Restos localStorage? | Estado |
|-------|--------------------|-----------------------|--------|
| AppContext login state | SI (onAuthStateChanged) | NO | OK |
| SignUpPage | SI | NO | OK |
| InvitationSignUpPage | SI | NO | OK |
| FichajesPage workerId | SI (user.uid) | NO | OK (con fallback 'unknown', I-06) |
| DatabaseService cache | N/A | SI (data cache) | localStorage para datos negocio (I-13) |
| Restaurant selection | N/A | sessionStorage | OK (migrado en #007) |

---

## CODIGO MUERTO DETECTADO

| Archivo | Evidencia | Sesion |
|---------|-----------|--------|
| `InviteUserModal.tsx` (360 lineas) | 0 imports en todo el proyecto | #001+ |
| `databaseDiagnostics.ts` (436 lineas) | Exportado en barrel, 0 consumidores | #005+ |
| `tsc_errors.txt` (22 lineas) | Archivo debug en raiz | #006-#007 |
| `tsc_errors2.txt` (2 lineas) | Archivo debug en raiz | #006-#007 |
| `tsc_output.txt` (22 lineas) | Archivo debug en raiz | #006-#007 |
| `tsc_output2.txt` (22 lineas) | Archivo debug en raiz | #006-#007 |
| `vitest_errors.txt` (1383 lineas) | Archivo debug en raiz | #007 |
| `wizard_test_error.txt` (762 lineas) | Tracked por git, archivo debug | #007 |
| `nul` (2 lineas) | Artefacto Windows | #006-#007 |

---

## DOCUMENTACION DESACTUALIZADA

| Documento | Lo que dice | Realidad |
|-----------|-------------|----------|
| README.md | 319 tests | 383 tests (359 pass + 24 skip) |
| README.md | Tesseract.js + PDF.js para OCR | Pendiente migracion a Claude API Vision |
| README.md | Font Inter | Font Public Sans |
| README.md | Colores #1171ef | Colores #e11d48 (Rose 600) |
| README.md | Estructura con src/components/ | Eliminado en #007, ahora src/shared/components/ |
| README.md | "100% Local, localStorage" | Firebase Firestore como backend |
| COMPONENT_INVENTORY.md | ButtonV2 existe | Consolidado en Button en #007 |
| COMPONENT_INVENTORY.md | V2 components pendientes | Consolidados en #007 |
| COMPONENT_INVENTORY.md | ~54 componentes | Menos tras consolidacion |
| TESTING_CONTRACT.md | 51 tests | 383 tests |
| VISUAL_CONTRACT.md | font-size-lg = 20px | tokens.css tiene 18px |
| VISUAL_CONTRACT.md | radius = 12px | tokens.css tiene 8px |
| FIREBASE_CONTRACT.md | allow read: if isAuthenticated() | Rules reales usan canAccessDocument() |
| FIREBASE_CONTRACT.md | gastosFijos: restaurantId + fecha | Indice real: restaurantId + tipo |
| ROUTING_CONTRACT.md | React.lazy() en rutas | 0 rutas lazy-loaded |
| ROUTING_CONTRACT.md | ProtectedRoute con Outlet | App.tsx usa conditional rendering |
| 02-design-system.md | success=#16a34a | tokens.css tiene #10b981 |
| 02-design-system.md | --bg, --bg-subtle, --bg-muted | No existen en tokens.css |
| CLAUDE.md | --text-secondary: #4b5563 | tokens.css tiene #6b7280 |

---

## ARCHIVOS TEMPORALES EN REPO

| Archivo | Tamano | Tracked por git? | Deberia estar? |
|---------|--------|-----------------|----------------|
| tsc_errors.txt | 22 lineas | NO | NO -- eliminar |
| tsc_errors2.txt | 2 lineas | NO | NO -- eliminar |
| tsc_output.txt | 22 lineas | NO | NO -- eliminar |
| tsc_output2.txt | 22 lineas | NO | NO -- eliminar |
| vitest_errors.txt | 1383 lineas | NO | NO -- eliminar |
| wizard_test_error.txt | 762 lineas | SI | NO -- eliminar + untrack |
| nul | 2 lineas | NO | NO -- eliminar |

---

## PREGUNTAS PARA AITOR

1. **canAccessDocument() legacy bypass (C-01/C-02):** Es el hallazgo mas grave. Cualquier documento sin `restaurantId` es accesible cross-tenant. Hay plan de migracion de datos legacy para anadir `restaurantId` a todos los docs? O aceptamos este riesgo temporalmente?

2. **companies/restaurants/invitations sin ownership (G-01/G-02/G-03):** Cualquier usuario autenticado puede crear empresas y restaurantes. Es intencional para el flow de onboarding? O deberia restringirse?

3. **ItemsService solo en memoria (C-09):** Los 6 metodos add* no escriben a Firestore. Los datos se pierden al refrescar. Es un stub temporal esperando implementacion? O estas colecciones son deliberadamente efimeras?

4. **window.confirm (G-10):** 9 instancias en 6 paginas. Quieres que se migren TODAS a Modal/ConfirmDialog de una vez? O progresivamente?

5. **README.md (G-18):** Esta completamente obsoleto. Quieres reescribirlo desde cero o solo actualizar las secciones erroneas?

6. **Lazy loading (G-14):** No hay code splitting. El bundle carga TODO. Quieres implementarlo ahora o es prioridad baja?

7. **Tokens/colores triple fuente de verdad (C-04/C-05/C-06/C-07):** Hay 3 archivos definiendo tokens con valores distintos. Cual es LA fuente de verdad que quieres conservar? tokens.css? Y se corrigen los demas?

8. **Fichajes con reloj del cliente (G-08):** Los empleados podrian manipular la hora. Quieres Cloud Function para validar server-side? O aceptamos client-side por ahora?

---

## PLAN DE REMEDIACION

### Critico (bloquea seguridad o integridad de datos)

| # | Hallazgo | Accion | Esfuerzo |
|---|----------|--------|----------|
| C-01/C-02 | Legacy bypass en canAccessDocument() | Migrar datos legacy (anadir restaurantId) + eliminar bypass | ALTO |
| C-03 | getAll() sin filtro ni limit | Hacer restaurantId obligatorio en getAll() + anadir limit(500) | BAJO |
| C-04/C-05/C-06/C-07 | Triple fuente de verdad tokens | Unificar en tokens.css, eliminar `:root` de index.css, corregir contratos y reglas | MEDIO |
| C-08 | 80% shared components sin tests | Crear tests para los 32 componentes faltantes | ALTO |
| C-09 | ItemsService solo en memoria | Decidir: persistir a Firestore o documentar como efimero | BAJO-MEDIO |
| G-01/G-02/G-03 | companies/restaurants sin ownership | Anadir ownership check en rules (requiere decision de Aitor) | MEDIO |
| G-04 | Sin field whitelist en updates | Anadir `hasOnly()` en rules para cada coleccion | ALTO |
| G-05 | getWithQuery restaurantId opcional | Hacer restaurantId obligatorio o forzar en metodo | BAJO |

### Alto (viola contratos o crea inconsistencias graves)

| # | Hallazgo | Accion | Esfuerzo |
|---|----------|--------|----------|
| G-06/G-07/G-08/G-09/I-07 | 19+ new Date() en writes | Migrar a Timestamp.now() o serverTimestamp() | MEDIO |
| G-10 | 9x window.confirm | Migrar a ConfirmDialog | BAJO |
| G-11/I-16 | Paginas sin estados obligatorios | Anadir loading/error/empty a Dashboard y ExistenciasTab | BAJO |
| G-12/G-21 | Colores hardcodeados | Reemplazar hex por var(--token) en index.css y Button.tsx | MEDIO |
| G-14 | 0 lazy loading | Implementar React.lazy + Suspense en rutas | MEDIO |
| G-15 | 74 as any en tests | Reemplazar con interfaces tipadas y Partial<T> | MEDIO |
| G-16 | 7 archivos temp en raiz | Eliminar + anadir a .gitignore | BAJO |
| G-17 | InviteUserModal dead code | Eliminar archivo | BAJO |

### Medio (documentacion desactualizada, deuda tecnica)

| # | Hallazgo | Accion | Esfuerzo |
|---|----------|--------|----------|
| G-18 | README obsoleto | Reescribir completo | MEDIO |
| G-19/I-27/I-28 | COMPONENT_INVENTORY stale | Actualizar post-consolidacion | BAJO |
| G-20 | TESTING_CONTRACT dice 51 tests | Actualizar metricas | BAJO |
| G-22/G-24/I-17/I-18/I-26 | Contratos stale (Firebase, Routing) | Actualizar 4 contratos | MEDIO |
| I-01/I-02/I-03 | Alias mismatches tsconfig/vite | Sincronizar aliases | BAJO |
| I-20 | 8x as unknown as en prod | Crear utility tipado | BAJO |
| I-21 | databaseDiagnostics dead code | Eliminar o conectar | BAJO |
| I-29/I-30 | 10 archivos legacy | Migrar a core (documentado) | MEDIO |

### Bajo (cosmetico, convenciones)

| # | Hallazgo | Accion | Esfuerzo |
|---|----------|--------|----------|
| M-01 | V2 suffix en 3 layout components | Renombrar AppShell, Topbar, SidebarNav | BAJO |
| M-02 | @components vs @shared/components | Estandarizar a @shared/components | BAJO |
| M-03/M-04 | Comentarios stale | Limpiar | BAJO |
| M-05-M-15 | Hallazgos menores varios | Corregir progresivamente | BAJO |
