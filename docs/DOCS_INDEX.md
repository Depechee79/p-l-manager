# P&L Manager — Indice de Documentacion

> Mapa maestro de TODOS los archivos de documentacion y gobernanza del proyecto.
> Ultima actualizacion: 2026-03-27 (Sesion #005)

## Constitucion

| Archivo | Descripcion |
|---------|-------------|
| `.claude/CLAUDE.md` | Constitucion del proyecto. Reglas absolutas, arquitectura, modulos, tokens, contratos, convenciones. |

## Reglas (.claude/rules/)

| Archivo | Descripcion |
|---------|-------------|
| `00-regla-suprema.md` | Regla suprema: calidad 10/10, protocolo 7 fases, bloqueo por defecto, prohibiciones absolutas, 8 dominios de excelencia. |
| `01-architecture.md` | Estructura de proyecto, path aliases, feature modules, imports, exports, Firebase singleton, naming conventions. |
| `02-design-system.md` | Tokens de diseno (colores, tipografia, z-index, sombras, radius, spacing), componentes, layout, mobile-first, patrones prohibidos. |
| `03-firebase.md` | Reglas de Firebase: Firestore, queries, rules, indices, Cloud Functions, seguridad. |
| `04-react-patterns.md` | Patrones React 19 + TypeScript: estructura componentes, hooks, eventos, estado, formularios, error handling, loading states. |

## Contratos (docs/contracts/)

| Archivo | Trigger |
|---------|---------|
| `VISUAL_CONTRACT.md` | className, estilos, colores, sombras, bordes |
| `UX_CONTRACT.md` | Pantalla nueva, arquetipo de pagina |
| `FIREBASE_CONTRACT.md` | Firestore queries, rules, colecciones, indices |
| `PRODUCT_CONTRACT.md` | Flujo de usuario, estados, textos visibles |
| `TESTING_CONTRACT.md` | Tests, verificacion, coverage |
| `ERROR_HANDLING_CONTRACT.md` | Error handling, catch blocks, toasts |
| `DEPLOYMENT_CONTRACT.md` | Deploy, hosting, functions |
| `ROUTING_CONTRACT.md` | Rutas, navegacion, code-splitting |
| `ACCESSIBILITY_CONTRACT.md` | Accesibilidad, ARIA, keyboard nav |
| `PERFORMANCE_CONTRACT.md` | Performance, bundle, lazy loading |
| `STATE_MANAGEMENT_CONTRACT.md` | Estado, Context, useState |
| `DOCUMENT_RECOGNITION_CONTRACT.md` | OCR, albaranes, facturas, documentos |

## Skills (.claude/skills/)

| Directorio | Descripcion |
|------------|-------------|
| `scanner/` | Auditor exhaustivo de calidad contra regla suprema y contratos. |
| `inspector/` | Sistema anti-regresiones: navega todas las paginas, verifica consola, carga e interaccion. |
| `verificar/` | Verificacion obligatoria antes de marcar tarea como completada (tsc, build, tests). |
| `sesion/` | Gestion de sesiones de trabajo: documentacion y trazabilidad. |
| `firebase-guide/` | Arquitectura Firebase: colecciones, relaciones, indices, rules, queries. |
| `design-system/` | Catalogo completo del design system: componentes, tokens, patrones. |

## Documentacion operacional (docs/)

| Archivo | Descripcion |
|---------|-------------|
| `BACKLOG.md` | Estado actual del proyecto, historial de sesiones, tareas pendientes priorizadas. |
| `CONTEXTO.md` | Sintesis rapida del proyecto para agentes nuevos (2 minutos). |
| `HISTORIAL_SESIONES.md` | Registro de todas las sesiones con objetivo, resultado y pendientes. |
| `PLANTILLA_SESION.md` | Plantilla estandar para documentar sesiones de trabajo. |
| `COMPONENT_INVENTORY.md` | Catalogo de componentes shared con notas de consolidacion V1/V2. |
| `DOCS_INDEX.md` | Este archivo. Indice maestro de toda la documentacion. |

## Arquitectura y seguridad (docs/10_ARCHITECTURE/, docs/20_SECURITY/)

| Archivo | Descripcion |
|---------|-------------|
| `10_ARCHITECTURE/DATABASE_SCHEMA.md` | Esquema de base de datos Firestore. |
| `10_ARCHITECTURE/FIREBASE_SETUP.md` | Configuracion de Firebase del proyecto. |
| `10_ARCHITECTURE/MULTI_RESTAURANTE.md` | Arquitectura multi-restaurante y grupos. |
| `20_SECURITY/FIREBASE_RULES.md` | Documentacion de reglas de seguridad Firestore. |

## Runbooks (docs/30_RUNBOOKS/)

Directorio preparado para runbooks operativos. Actualmente vacio.

## Logs y auditorias (docs/40_LOGS/)

| Archivo | Descripcion |
|---------|-------------|
| `AUDIT_CONSOLIDADO.md` | Auditoria consolidada del proyecto. |
| `BACKLOG_CONSOLIDADO.md` | Backlog consolidado historico. |
| `PLAN_ACCION_UX_FINAL.md` | Plan de accion UX final. |
| `firebase-audit/` | Directorio con resultados de auditoria Firebase. |

## QA (docs/50_QA/)

| Archivo | Descripcion |
|---------|-------------|
| `BACKEND_BRANCH_MAP.md` | Mapa de ramas backend. |
| `BACKEND_CODE_TREE.md` | Arbol de codigo backend. |
| `BACKEND_FIREBASE_CONNECTIVITY.md` | Conectividad Firebase del backend. |
| `BACKEND_RISK_REGISTER.md` | Registro de riesgos backend. |
| `BACKEND_RULES_TESTS.md` | Tests de reglas backend. |
| `BACKEND_TEST_MATRIX.md` | Matriz de tests backend. |
| `TESTING_STATUS.md` | Estado actual de testing. |

## Plan Firebase (docs/60_FIREBASE_PLAN/)

| Archivo | Descripcion |
|---------|-------------|
| `01-CRITICO-seguridad.md` | Plan critico: seguridad Firebase. |
| `02-CRITICO-queries.md` | Plan critico: optimizacion de queries. |
| `03-ALTO-indices.md` | Plan alto: indices Firestore. |
| `04-ALTO-cloud-first.md` | Plan alto: Cloud Functions first. |
| `COMANDOS-FINALES.md` | Comandos de deploy Firebase. |
| `README.md` | Descripcion del plan Firebase. |
| `CODIGOS/` | Codigo fuente del plan. |
| `ROLLBACK/` | Procedimientos de rollback. |
| `VALIDACION/` | Validaciones del plan. |

## Archivos (docs/_ARCHIVE/, docs/_ARCHIVE_V1/)

| Directorio | Descripcion |
|------------|-------------|
| `_ARCHIVE/audits/` | Auditorias archivadas. |
| `_ARCHIVE/backlogs/` | Backlogs archivados. |
| `_ARCHIVE/legacy/` | Codigo legacy archivado. |
| `_ARCHIVE/tasks/` | Tareas archivadas. |
| `_ARCHIVE_V1/` | Gobernanza V1 completa archivada (CLAUDE_V1.md, 00_INDEX.md, 01_CANON/, 70_PROCESS_RULES/). |
