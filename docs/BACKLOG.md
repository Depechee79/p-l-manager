# P&L Manager — Backlog

> Ultima actualizacion: 2026-03-27 (Sesion #005 — Implantacion gobernanza)

## Estado actual

- **Build:** OK (npm run build)
- **Tests:** 51 tests (Vitest)
- **Deploy:** Manual (Firebase CLI)
- **Sesiones completadas:** 5

## Sesion #005 — Implantacion de gobernanza (27 marzo 2026)

Reescritura completa del sistema de gobernanza desde cero:
- CLAUDE.md reescrito como constitucion del proyecto
- 5 reglas (.claude/rules/): regla suprema + 4 dominios
- 12 contratos (docs/contracts/): VISUAL, UX, FIREBASE, PRODUCT, TESTING, ERROR_HANDLING, DEPLOYMENT, ACCESSIBILITY, PERFORMANCE, ROUTING, STATE_MANAGEMENT, DOCUMENT_RECOGNITION
- 6 skills (.claude/skills/): scanner, inspector, verificar, sesion, firebase-guide, design-system
- Hooks de calidad automatica (settings.local.json)
- Documentacion operacional (BACKLOG, CONTEXTO, HISTORIAL, INDEX, PLANTILLA, INVENTARIO)
- Gobernanza anterior archivada en docs/_ARCHIVE_V1/

## Sesiones anteriores

### Sesion #004 — AppShellV2 Completo (19 enero 2026)
AppShellV2 con TopbarV2, SidebarNavV2, MobileBottomNav, StickyPageHeader. Auditoria UX.

### Sesion #003 — Sticky Headers + Estandarizacion (18 enero 2026)
Headers fijos en scroll, estandarizacion UI componentes.

### Sesion #002 — Reorganizacion UI + Auth + Permisos (17-18 enero 2026)
Auth system, roles/permisos, tabs reorganizacion.

### Sesion #001 — Auditoria Firebase + Plan (17 enero 2026)
Auditoria completa Firebase, plan de correcciones.

## Pendiente (priorizado)

### Alta
- [ ] Migrar OCR de Tesseract a Claude API Vision + Cloud Function
- [ ] Consolidar Button.tsx + ButtonV2.tsx → un solo componente
- [ ] Completar migracion servicios legacy a @core
- [ ] Ampliar cobertura testing (51 tests → objetivo 200+)
- [ ] Endurecer firestore.rules (reglas actuales demasiado permisivas)

### Media
- [ ] Implementar Cloud Functions base (europe-west1)
- [ ] CI/CD con GitHub Actions
- [ ] Code splitting con React.lazy en todas las rutas
- [ ] Implementar onboarding + formacion
- [ ] Implementar checklists operativos

### Baja
- [ ] Informes diarios automaticos
- [ ] Panel admin empresarial (app separada)
- [ ] TypeScript 6.0 migration (cuando ecosistema soporte)
- [ ] Service Worker para offline
