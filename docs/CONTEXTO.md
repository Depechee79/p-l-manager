# P&L Manager — Contexto

> Sintesis para que un agente nuevo entienda el proyecto en 2 minutos.

## Que es
Gestor de operaciones diarias de hosteleria. Cierres de caja, albaranes, inventarios, escandallos, personal, horarios.

## Stack
React 19 + TypeScript 5.9 + Vite 7.2 + Firebase (pylhospitality) + Tailwind CSS 4

## Arquitectura
Single app (puerto 3004). Feature-based: src/core (infra), src/shared (design system), src/features (modulos), src/pages (composicion).

## Estado (29 marzo 2026)
- 8 sesiones completadas
- Plan TURMIX completo (14 fases) + Fix total (8 fases) + Auditoria implacable (8 fases remediacion)
- tsc: 0 errores
- Build: OK (Tailwind CSS 4 + @tailwindcss/postcss)
- Tests: 383 (359 passing, 24 skipped integration)
- 0 `any`, 0 `console.log`, 0 `export default`, 0 catch sin tipo, 0 `as unknown as` en produccion
- Auth: Firebase Auth real (onAuthStateChanged en AppContext)
- Firestore rules: endurecidas con restaurantId (15 colecciones) + ownership en companies/restaurants/invitations
- Tokens: crypto.getRandomValues()
- Timestamps: Timestamp.now() en writes (12 ubicaciones migradas en #008)
- tokens.css: fuente de verdad unica (duplicados eliminados de index.css en #008)
- window.confirm: ELIMINADO (9 instancias migradas a ConfirmDialog en #008)
- src/components/ legacy ELIMINADO, V2 suffixes ELIMINADOS
- 8 modulos existentes + 4 previstos

## Gobernanza
- CLAUDE.md: constitucion del proyecto
- .claude/rules/: 5 reglas (suprema + 4 dominio)
- docs/contracts/: 12 contratos especializados
- .claude/skills/: 6 skills (scanner, inspector, verificar, sesion, firebase-guide, design-system)

## Decisiones tecnicas vigentes
- Auth: Firebase Auth real con onAuthStateChanged (localStorage ELIMINADO, sesion #007)
- Firestore rules: canAccessDocument() + hasRestaurantAccess() en 15 colecciones (sesion #007)
- Timestamps: Timestamp.now() para writes, string | Timestamp en tipos (sesion #007)
- Tokens: crypto.getRandomValues() en cliente (sesion #007)
- DatabaseService usa CollectionTypeMap (tipado seguro, sesion #006)
- LoggerService usa `unknown[]` (cero `any`)
- Helpers centralizados para casts: getField(), toRecord(), getRecord(), getDbStore()
- useOptionalRestaurantContext() para providers opcionales (Rules of Hooks)
- ShellUser tipo en layout (acepta User de AppContext y AppUser de Firestore)
- dateUtils.ts: formatDateOnly(), toDate(), toISOString() (maneja Timestamp + string)
- Button canonico: 8 variantes, 3 tamanos, Tailwind tokens (ButtonV2 consolidado)

## Decisiones de producto DECIDIDAS (sesion #007)
- DP-1: Auth real (opcion A) — EJECUTADA
- DP-2: Firestore rules endurecidas (opcion A) — EJECUTADA
- DP-3: Timestamps nativos (opcion A) — EJECUTADA
- DP-4: Tokens cripto seguros (opcion A) — EJECUTADA

## Clave
- Aitor es director de restaurante, NO programador
- Calidad maxima siempre
- Mobile-first (camareros con movil)
- Multi-restaurante y grupos
- Claude API Vision para documentos (NO Tesseract) — pendiente implementacion
