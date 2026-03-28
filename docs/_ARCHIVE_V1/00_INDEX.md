# P&L Manager - Documentacion Central

**Ultima actualizacion**: 2026-01-18

> Este es el indice maestro de documentacion.
> Todos los documentos del proyecto estan centralizados aqui.

---

## Tabla de Contenidos

### [01_CANON/](01_CANON/) - Documentos Canonicos
Documentos obligatorios que definen estandares del proyecto.

| Documento | Descripcion |
|-----------|-------------|
| [RULES.md](01_CANON/RULES.md) | Reglas de arquitectura obligatorias (R-01 a R-14) |
| [TOKENS_REFERENCE.md](01_CANON/TOKENS_REFERENCE.md) | Sistema de diseno y tokens CSS |
| [HANDOFF.md](01_CANON/HANDOFF.md) | Estado del proyecto y handoff para continuidad |
| [BUGS.md](01_CANON/BUGS.md) | Bugs conocidos y pre-existentes |

---

### [10_ARCHITECTURE/](10_ARCHITECTURE/) - Arquitectura
Documentacion tecnica del sistema.

| Documento | Descripcion |
|-----------|-------------|
| [DATABASE_SCHEMA.md](10_ARCHITECTURE/DATABASE_SCHEMA.md) | Esquema completo de Firestore |
| [FIREBASE_SETUP.md](10_ARCHITECTURE/FIREBASE_SETUP.md) | Configuracion de Firebase |
| [MULTI_RESTAURANTE.md](10_ARCHITECTURE/MULTI_RESTAURANTE.md) | Arquitectura multi-tenant |

---

### [20_SECURITY/](20_SECURITY/) - Seguridad
Reglas y politicas de seguridad.

| Documento | Descripcion |
|-----------|-------------|
| [FIREBASE_RULES.md](20_SECURITY/FIREBASE_RULES.md) | Reglas de seguridad Firestore |

---

### [30_RUNBOOKS/](30_RUNBOOKS/) - Guias Operativas
Procedimientos y runbooks.

*Carpeta reservada para futuras guias operativas.*

---

### [40_LOGS/](40_LOGS/) - Auditorias y Backlogs
Registros consolidados de auditorias y tareas.

| Documento | Descripcion |
|-----------|-------------|
| [AUDIT_CONSOLIDADO.md](40_LOGS/AUDIT_CONSOLIDADO.md) | Todas las auditorias consolidadas |
| [BACKLOG_CONSOLIDADO.md](40_LOGS/BACKLOG_CONSOLIDADO.md) | Backlog maestro de tareas |
| **[firebase-audit/](40_LOGS/firebase-audit/)** | **Auditoria detallada de Firebase (NUEVO)** |

#### firebase-audit/ (Auditoria Firebase)
| Documento | Descripcion |
|-----------|-------------|
| [README.md](40_LOGS/firebase-audit/README.md) | Resumen ejecutivo del veredicto |
| [INDICE-AUDITORIAS.md](40_LOGS/firebase-audit/INDICE-AUDITORIAS.md) | Indice de auditorias |
| [01-ESTRUCTURA.md](40_LOGS/firebase-audit/01-ESTRUCTURA.md) | Diagrama de colecciones |
| [02-QUERIES-COSTES.md](40_LOGS/firebase-audit/02-QUERIES-COSTES.md) | Analisis de queries y costes |
| [03-INDICES.md](40_LOGS/firebase-audit/03-INDICES.md) | Indices actuales vs faltantes |
| [AUDITORIA-COMPLETA.md](40_LOGS/firebase-audit/AUDITORIA-COMPLETA.md) | Analisis completo del codigo |

---

### [50_QA/](50_QA/) - Testing y QA
Documentacion de calidad y testing.

| Documento | Descripcion |
|-----------|-------------|
| [TESTING_STATUS.md](50_QA/TESTING_STATUS.md) | Estado actual de tests |
| [BACKEND_CODE_TREE.md](50_QA/BACKEND_CODE_TREE.md) | Arbol de codigo backend |
| [BACKEND_BRANCH_MAP.md](50_QA/BACKEND_BRANCH_MAP.md) | Mapa de ramas logicas |
| [BACKEND_TEST_MATRIX.md](50_QA/BACKEND_TEST_MATRIX.md) | Matriz de casos de prueba |
| [BACKEND_FIREBASE_CONNECTIVITY.md](50_QA/BACKEND_FIREBASE_CONNECTIVITY.md) | Verificacion Firebase |
| [BACKEND_RULES_TESTS.md](50_QA/BACKEND_RULES_TESTS.md) | Tests de reglas Firestore |
| [BACKEND_RISK_REGISTER.md](50_QA/BACKEND_RISK_REGISTER.md) | Registro de riesgos |

---

### [60_FIREBASE_PLAN/](60_FIREBASE_PLAN/) - Plan de Correcciones Firebase (NUEVO)
Plan ejecutable para corregir problemas identificados en la auditoria.

| Documento | Descripcion |
|-----------|-------------|
| [README.md](60_FIREBASE_PLAN/README.md) | Guia de inicio y estructura |
| [01-CRITICO-seguridad.md](60_FIREBASE_PLAN/01-CRITICO-seguridad.md) | Paso a paso reglas seguridad |
| [02-CRITICO-queries.md](60_FIREBASE_PLAN/02-CRITICO-queries.md) | Paso a paso optimizar queries |
| [03-ALTO-indices.md](60_FIREBASE_PLAN/03-ALTO-indices.md) | Agregar indices faltantes |
| [04-ALTO-cloud-first.md](60_FIREBASE_PLAN/04-ALTO-cloud-first.md) | Cambiar arquitectura |
| [COMANDOS-FINALES.md](60_FIREBASE_PLAN/COMANDOS-FINALES.md) | Comandos de deploy |
| [CODIGOS/](60_FIREBASE_PLAN/CODIGOS/) | Archivos listos para copiar |
| [VALIDACION/](60_FIREBASE_PLAN/VALIDACION/) | Checklists de testing |
| [ROLLBACK/](60_FIREBASE_PLAN/ROLLBACK/) | Plan de emergencia |

---

### [70_PROCESS_RULES/](70_PROCESS_RULES/) - Reglas de Proceso (NUEVO)
Reglas detalladas de arquitectura, codigo, testing y proceso.

| Carpeta | Descripcion |
|---------|-------------|
| [00-KERNEL.md](70_PROCESS_RULES/00-KERNEL.md) | Reglas nucleares |
| [01-PROTERMS.md](70_PROCESS_RULES/01-PROTERMS.md) | Terminos protegidos |
| [10-arquitectura/](70_PROCESS_RULES/10-arquitectura/) | Reglas de arquitectura |
| [20-codigo-limpio/](70_PROCESS_RULES/20-codigo-limpio/) | Reglas de codigo limpio |
| [30-testing/](70_PROCESS_RULES/30-testing/) | Reglas de testing |
| [40-seguridad/](70_PROCESS_RULES/40-seguridad/) | Reglas de seguridad |
| [50-quality/](70_PROCESS_RULES/50-quality/) | Reglas de calidad |
| [60-proceso/](70_PROCESS_RULES/60-proceso/) | Reglas de proceso |
| [70-agentes-ia/](70_PROCESS_RULES/70-agentes-ia/) | Reglas para agentes IA |
| [80-stack/](70_PROCESS_RULES/80-stack/) | Reglas del stack tecnologico |
| [90-proyecto/](70_PROCESS_RULES/90-proyecto/) | Reglas especificas del proyecto |

---

### [_ARCHIVE/](_ARCHIVE/) - Archivo Historico
Documentos historicos y obsoletos (preservados, no eliminados).

| Subcarpeta | Contenido |
|------------|-----------|
| [legacy/](_ARCHIVE/legacy/) | READMEs antiguos, prompts |
| [audits/](_ARCHIVE/audits/) | Auditorias individuales originales |
| [backlogs/](_ARCHIVE/backlogs/) | Backlogs originales |
| [tasks/](_ARCHIVE/tasks/) | Tasks completadas/obsoletas |

---

## Ubicaciones Externas

### [.claude/sessions/](../.claude/sessions/) - Historial de Sesiones Claude
Registro de sesiones de desarrollo con Claude Code.

| Archivo | Descripcion |
|---------|-------------|
| [INDICE-SESIONES.md](../.claude/sessions/INDICE-SESIONES.md) | Indice de todas las sesiones |
| [sesion-001-auditoria-firebase.md](../.claude/sessions/sesion-001-auditoria-firebase.md) | Auditoria Firebase |
| [sesion-002-reorganizacion-ui.md](../.claude/sessions/sesion-002-reorganizacion-ui.md) | Reorganizacion UI + Auth |

---

## Enlaces Rapidos

- **Nuevo en el proyecto?** -> Lee [HANDOFF.md](01_CANON/HANDOFF.md)
- **Vas a programar?** -> Revisa [RULES.md](01_CANON/RULES.md)
- **Cambios de estilo?** -> Consulta [TOKENS_REFERENCE.md](01_CANON/TOKENS_REFERENCE.md)
- **Seguridad Firebase?** -> Ver [FIREBASE_RULES.md](20_SECURITY/FIREBASE_RULES.md)
- **Historial de sesiones?** -> Ver [.claude/sessions/](../.claude/sessions/)

---

## Estructura Final de Documentacion

```
docs/
├── 00_INDEX.md                 # Este archivo
├── 01_CANON/                   # Reglas, tokens, handoff
├── 10_ARCHITECTURE/            # DB, Firebase, Multi-restaurante
├── 20_SECURITY/                # Firestore rules
├── 30_RUNBOOKS/                # Guias operativas (pendiente)
├── 40_LOGS/
│   ├── AUDIT_CONSOLIDADO.md
│   ├── BACKLOG_CONSOLIDADO.md
│   └── firebase-audit/         # Auditoria Firebase detallada
├── 50_QA/                      # Testing, riesgos
├── 60_FIREBASE_PLAN/           # Plan correcciones Firebase
├── 70_PROCESS_RULES/           # Reglas de proceso detalladas
└── _ARCHIVE/                   # Historico

.claude/sessions/               # Historial sesiones Claude (externo)
```
