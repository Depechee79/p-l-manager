# 📚 P&L Manager - Documentación Central

**Última actualización**: 2026-01-12

> ⚠️ **Este es el índice maestro de documentación.**  
> Todos los documentos del proyecto están centralizados aquí.

---

## 📋 Tabla de Contenidos

### 🏛️ [01_CANON/](01_CANON/) - Documentos Canónicos
Documentos obligatorios que definen estándares del proyecto.

| Documento | Descripción |
|-----------|-------------|
| [RULES.md](01_CANON/RULES.md) | Reglas de arquitectura obligatorias (R-01 a R-14) |
| [TOKENS_REFERENCE.md](01_CANON/TOKENS_REFERENCE.md) | Sistema de diseño y tokens CSS |
| [HANDOFF.md](01_CANON/HANDOFF.md) | Estado del proyecto y handoff para continuidad |
| [BUGS.md](01_CANON/BUGS.md) | Bugs conocidos y pre-existentes |

---

### 🏗️ [10_ARCHITECTURE/](10_ARCHITECTURE/) - Arquitectura
Documentación técnica del sistema.

| Documento | Descripción |
|-----------|-------------|
| [DATABASE_SCHEMA.md](10_ARCHITECTURE/DATABASE_SCHEMA.md) | Esquema completo de Firestore |
| [FIREBASE_SETUP.md](10_ARCHITECTURE/FIREBASE_SETUP.md) | Configuración de Firebase |
| [MULTI_RESTAURANTE.md](10_ARCHITECTURE/MULTI_RESTAURANTE.md) | Arquitectura multi-tenant |

---

### 🔐 [20_SECURITY/](20_SECURITY/) - Seguridad
Reglas y políticas de seguridad.

| Documento | Descripción |
|-----------|-------------|
| [FIREBASE_RULES.md](20_SECURITY/FIREBASE_RULES.md) | Reglas de seguridad Firestore |

---

### 📖 [30_RUNBOOKS/](30_RUNBOOKS/) - Guías Operativas
Procedimientos y runbooks.

*Carpeta reservada para futuras guías operativas.*

---

### 📊 [40_LOGS/](40_LOGS/) - Auditorías y Backlogs
Registros consolidados de auditorías y tareas.

| Documento | Descripción |
|-----------|-------------|
| [AUDIT_CONSOLIDADO.md](40_LOGS/AUDIT_CONSOLIDADO.md) | Todas las auditorías consolidadas |
| [BACKLOG_CONSOLIDADO.md](40_LOGS/BACKLOG_CONSOLIDADO.md) | Backlog maestro de tareas |

---

### 🧪 [50_QA/](50_QA/) - Testing y QA
Documentación de calidad y testing.

| Documento | Descripción |
|-----------|-------------|
| [TESTING_STATUS.md](50_QA/TESTING_STATUS.md) | Estado actual de tests |
| [BACKEND_CODE_TREE.md](50_QA/BACKEND_CODE_TREE.md) | Árbol de código backend |
| [BACKEND_BRANCH_MAP.md](50_QA/BACKEND_BRANCH_MAP.md) | Mapa de ramas lógicas |
| [BACKEND_TEST_MATRIX.md](50_QA/BACKEND_TEST_MATRIX.md) | Matriz de casos de prueba |
| [BACKEND_FIREBASE_CONNECTIVITY.md](50_QA/BACKEND_FIREBASE_CONNECTIVITY.md) | Verificación Firebase |
| [BACKEND_RULES_TESTS.md](50_QA/BACKEND_RULES_TESTS.md) | Tests de reglas Firestore |
| [BACKEND_RISK_REGISTER.md](50_QA/BACKEND_RISK_REGISTER.md) | Registro de riesgos |

---

### 🗄️ [_ARCHIVE/](_ARCHIVE/) - Archivo Histórico
Documentos históricos y obsoletos (preservados, no eliminados).

| Subcarpeta | Contenido |
|------------|-----------|
| [legacy/](_ARCHIVE/legacy/) | READMEs antiguos, prompts |
| [audits/](_ARCHIVE/audits/) | Auditorías individuales originales |
| [backlogs/](_ARCHIVE/backlogs/) | Backlogs originales |
| [tasks/](_ARCHIVE/tasks/) | Tasks completadas/obsoletas |

---

## 🔗 Enlaces Rápidos

- **¿Nuevo en el proyecto?** → Lee [HANDOFF.md](01_CANON/HANDOFF.md)
- **¿Vas a programar?** → Revisa [RULES.md](01_CANON/RULES.md)
- **¿Cambios de estilo?** → Consulta [TOKENS_REFERENCE.md](01_CANON/TOKENS_REFERENCE.md)
- **¿Seguridad Firebase?** → Ver [FIREBASE_RULES.md](20_SECURITY/FIREBASE_RULES.md)

---

## ⚠️ Nota sobre `.agent/`

La carpeta `.agent/` en la raíz contiene **stubs** que redireccionan a esta documentación centralizada. Si encuentras un archivo en `.agent/`, busca la versión actual aquí en `docs/`.
