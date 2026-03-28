# P&L Manager — Backlog

> Ultima actualizacion: 2026-03-28 (Sesion #006 — Plan TURMIX completo + auditoria)

## Estado actual

- **tsc:** 0 errores en todo el proyecto
- **Build:** pendiente verificar (error CSS/Tailwind preexistente)
- **Tests:** 430 tests (273 passing, 156 failing preexistentes)
- **Deploy:** Manual (Firebase CLI). Sin deploy desde sesion #004.
- **Sesiones completadas:** 6
- **Plan TURMIX:** 14 fases COMPLETADAS (T1-T14)

## Sesion #006 — Plan TURMIX completo + auditoria (28 marzo 2026)

Ejecucion completa del plan TURMIX: pasar CADA seccion del codigo por TODOS los contratos aplicables.
15 commits. ~120 archivos tocados. ~350+ violaciones corregidas.

### Fases completadas (15 commits):
1. **T2 Core Services** (4db2cb9) — 10 archivos, 106 violaciones. P0: hasAccess deny-by-default.
2. **T3 Design System** (f56f222) — 45 archivos, ~49 violaciones. Tokens, named exports, z-index, colores.
3. **T4 Legacy Migration** (0a69cf6) — 12 archivos. Dead code eliminado (useToast placeholder), tests huerfanos.
4. **Fix tsc preexistentes** (fa5bdde) — 5 archivos, 7 errores TS eliminados.
5. **T5 Dashboard** (b192884) — 3 archivos, 9 violaciones.
6. **T6 Cierres** (31e0183) — 8 archivos, 23 violaciones.
7. **T7 Escandallos** (a067c86) — 6 archivos, 15 violaciones.
8. **T8 Almacen** (33b29cf) — 22 archivos, ~80 violaciones.
9. **T9 P&L** (3ec96ed) — 3 archivos, 22 violaciones.
10. **T10 Personal** (25a06c4) — 5 archivos, 35 violaciones.
11. **T11 OCR** (7958758) — 4 archivos, 15 violaciones.
12. **T12 Config+Usuarios** (868bc49) — 9 archivos, 30+ violaciones.
13. **T13 App+Routing** (04ed441) — 2 archivos, 4 violaciones.
14. **Limpieza final** (811bde2) — 8 archivos residuales fuera del plan original.
15. **Auditoria reparacion** (5aff09b) — 20 archivos. DatabaseService rediseñado (CollectionTypeMap), ResponsablesTab reescrito, LoggerService any eliminados, Layout Rules of Hooks fix, dead code purgado.

### Metricas antes/despues:
| Metrica | Antes | Despues |
|---------|-------|---------|
| tsc errores | 8+ | 0 |
| `as any` | ~60 | 0 |
| `any` tipo | ~60 | 0 produccion |
| `console.*` | ~50 | 0 produccion |
| catch sin tipo | ~30 | 0 |
| export default | ~11 | 0 |
| TODOs | 8 | 0 |
| Dead code | 6 metodos/archivos | Eliminado |

## Sesiones anteriores

### Sesion #005 — Gobernanza + T1 Turmix (27 marzo 2026)
Gobernanza completa desde cero + Fase T1 (types+utils+config, 35 violaciones).

### Sesion #004 — AppShellV2 Completo (19 enero 2026)
AppShellV2 con TopbarV2, SidebarNavV2, MobileBottomNav, StickyPageHeader.

### Sesion #003 — Sticky Headers + Estandarizacion (18 enero 2026)
Headers fijos en scroll, estandarizacion UI componentes.

### Sesion #002 — Reorganizacion UI + Auth + Permisos (17-18 enero 2026)
Auth system, roles/permisos, tabs reorganizacion.

### Sesion #001 — Auditoria Firebase + Plan (17 enero 2026)
Auditoria completa Firebase, plan de correcciones.

## Pendiente (priorizado)

### DECISIONES DE PRODUCTO (requieren Aitor)
Ver `docs/DECISIONES_PRODUCTO_PENDIENTES.md` para detalle completo.
- AppContext: migrar a Firebase Auth real o mantener localStorage?
- Firestore rules: endurecer con restaurantId o priorizar features primero?
- BaseEntity timestamps: migrar de string ISO a Firestore Timestamp?
- Tokens de invitacion: migrar Math.random a crypto.getRandomValues?

### Alta
- [ ] Migrar AppContext de localStorage a Firebase Auth real (SEGURIDAD)
- [ ] Endurecer firestore.rules con restaurantId por coleccion (SEGURIDAD)
- [ ] Migrar OCR de Tesseract a Claude API Vision + Cloud Function
- [ ] Consolidar Button.tsx + ButtonV2.tsx → un solo componente
- [ ] Ampliar cobertura testing (156 tests fallando, 273 passing)
- [ ] Migrar BaseEntity.createdAt/updatedAt de string a Timestamp

### Media
- [ ] Implementar Cloud Functions base (europe-west1)
- [ ] Migrar tokens invitacion a crypto.getRandomValues (Cloud Function)
- [ ] CI/CD con GitHub Actions
- [ ] Code splitting con React.lazy en todas las rutas
- [ ] Implementar onboarding + formacion
- [ ] Implementar checklists operativos

### Baja
- [ ] Informes diarios automaticos
- [ ] Panel admin empresarial (app separada)
- [ ] TypeScript 6.0 migration (cuando ecosistema soporte)
- [ ] Service Worker para offline
