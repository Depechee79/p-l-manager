# P&L Manager - Handoff Document
**Última actualización**: 2026-01-01T17:10:00+01:00
**Estado General**: 🟢 AUDIT-01 COMPLETADO - P&L Estructura Completa

---

## 🟢 ÚLTIMA SESIÓN (2026-01-01 17:00)

### AUDIT-01 COMPLETADO ✅
- **PnLPage.tsx** reescrita con estructura P&L completa:
  - 5 secciones: Ingresos, COGS, Personal, OPEX, Resultados
  - 6 cards KPI: Ingresos, Food Cost, Labor Cost, Prime Cost, EBITDA, Beneficio Neto
  - Colores semafóricos según umbrales de hostelería
  - Migrado a componentes shared (Select, PageHeader) per R-13
- **pnl.types.ts**: Añadidos laborCostPct, primeCostPct a PnLKPIs
- **pnl-service.ts**: Actualizado extractKPIs()
- **components/index.ts**: Añadidos exports PageHeader, PageContainer, FilterBar

### Documentos Generados:

| Documento | Propósito |
|-----------|-----------|
| [AUDIT_FINDINGS.md](../40_LOGS/AUDIT_CONSOLIDADO.md) | Hallazgos técnicos detallados |
| [AUDIT_BACKLOG.md](../40_LOGS/AUDIT_CONSOLIDADO.md) | Backlog priorizado de mejoras |
| [AUDITORIA_ROLES_UX.md](../_ARCHIVE/audits/AUDITORIA_ROLES_UX.md) | Auditoría de Roles y UX |
| [AUDIT_PROMPT.md](../_ARCHIVE/audits/AUDIT_PROMPT.md) | PROMPT para desarrollador fullstack |

### Hallazgos Críticos:

1. **SEGURIDAD**: Rutas abiertas (`App.tsx` sin Guards). **Acción Inmediata**.
2. **P&L Completo** - ✅ COMPLETADO con calidad.
3. **Multi-Local** - ✅ COMPLETADO UI (Datos simulados dashboard).
4. **Roles** - Definida nueva matriz (Director, Manager, Staff).

### Fortalezas:

- ✅ Mobile-First excepcional
- ✅ Wizard de Cierres completo
- ✅ Integración Delivery (Glovo, Just Eat, etc.)

---

## 🚨 ACCIÓN INMEDIATA: Frontend + Auditoría FODA

### Auditoría R-12/R-13 Frontend - 400+ Violaciones Detectadas

**Documento completo**: [AUDIT_CONSOLIDADO.md](../40_LOGS/AUDIT_CONSOLIDADO.md)

**Resumen**:
- 15 elementos HTML raw (`<input>`, `<select>`, `<button>`)
- 6 imports legacy (`from '../components'`)
- 4+ páginas sin layout estándar
- 300+ valores hardcoded (padding, fontSize, gap, borderRadius)

**Ya preparado**:
- ✅ Tokens expandidos en `tokens.css`
- ✅ Componentes estándar creados: `PageHeader`, `PageContainer`, `FilterBar`
- ✅ Documento de auditoría con todas las violaciones y mappings

## 🎯 Estado Actual del Proyecto

### Arquitectura
- **Stack**: React 18 + TypeScript + Vite + Firebase
- **Estructura**: Feature-based (`src/features/[feature]/`)
- **Design System**: Tokens CSS centralizados en `src/shared/tokens/`
- **Componentes Compartidos**: `src/shared/components/` (Button, Card, Input, Select, Modal, Table, DatePicker, TimePicker, StepIndicator, NumericKeypad)

### Últimas Sesiones de Trabajo

#### Sesión 2025-12-31 AM (Actual)
**Objetivo**: Ejecutar tareas de alta prioridad del backlog.

**Completado**:
1. **TASK-UI-01 - Unificar alturas de componentes** ✅
2. **TASK-TEST-01 - Cleanup E2E Tests** ✅
3. **TASK-DATA-01 - Datos Mock** ✅
4. **TASK-FEAT-01 - Delivery en Cierres** ✅
5. **TASK-FEAT-02 - Configuración Restaurante** ✅
6. **TASK-FEAT-03 - Fusionar Empleados y Roles** ✅
7. **TASK-FEAT-04 - Panel Admin de Roles** ✅
8. **TASK-MOBILE-01 - Mobile First Layout** ✅
9. **TASK-OCR-01 - Configuración OCR Centralizada** ✅

---

## 📋 Backlog Prioritario

### ALTA PRIORIDAD
1. **TEST-02**: Limpiar tests E2E frágiles y añadir datos mock completos
2. **FIX-02**: Verificar integración `useFinance` con Firebase real
3. **ARCH-09**: Completar migración de servicios restantes a `@features`

### MEDIA PRIORIDAD
4. **CLEAN-01**: Remover `as any` restantes en codebase
5. **DOC-01**: Actualizar README principal con arquitectura actual
6. **TEST-03**: Añadir tests unitarios a todos los hooks custom

### BAJA PRIORIDAD
7. **STYLE-01**: Estandarizar naming (español/inglés) en páginas
8. **PERF-01**: Auditar y optimizar re-renders innecesarios

---

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Tests
npm test                           # Watch mode
npm test -- --run                  # Single run
npm test -- src/path/to/file.test.tsx --run  # Archivo específico

# Build
npm run build

# Lint
npm run lint
```

---

## 📁 Estructura de Archivos Clave

```
src/
├── features/
│   ├── cierres/
│   │   ├── components/
│   │   │   ├── ClosingWizard.tsx      # Orquestador principal
│   │   │   ├── ClosingList.tsx        # Lista de cierres
│   │   │   └── wizard/
│   │   │       ├── types.ts           # ClosingFormData
│   │   │       └── steps/             # ConfigurationStep, CashCountingStep, etc.
│   │   └── index.ts
│   ├── inventarios/
│   ├── providers/
│   └── ...
├── shared/
│   ├── components/                    # Button, Card, Input, Select, etc.
│   ├── hooks/                         # useMediaQuery, useIsMobile
│   └── tokens/                        # colors.ts, typography.ts, etc.
├── pages/                             # Page components (routing entry points)
├── hooks/                             # Global hooks (useFinance, useDatabase, etc.)
└── types/                             # TypeScript definitions
```

---

## ⚠️ Bugs Conocidos

1. **Tests E2E con selectores frágiles**: Algunos tests buscan texto específico ("1050", "Proveedor Test") que depende de datos mock.
2. **Warnings de LoggerService**: Aparecen warnings de integridad de datos durante tests (productos sin proveedorId).
3. **Lint warnings en tests**: Algunos archivos `.test.tsx` tienen imports no usados.

---

## 📌 Reglas del Proyecto

Ver [RULES.md](./RULES.md) para reglas arquitectónicas completas. Las más importantes:

1. **Imports por alias**: Usar `@/features`, `@shared`, `@core`, `@types`
2. **Componentes en shared**: Deben ser genéricos y reutilizables
3. **Servicios en features**: Lógica de negocio específica va en su feature
4. **No `as any`**: Tipar correctamente, usar genéricos si es necesario
5. **Tests junto al código**: `Component.test.tsx` junto a `Component.tsx`

---

## 🔗 Archivos de Referencia

- [RULES.md](./RULES.md) - Reglas arquitectónicas
- [BACKLOG_CONSOLIDADO.md](../40_LOGS/BACKLOG_CONSOLIDADO.md) - Backlog completo
- [TOKENS_REFERENCE.md](./TOKENS_REFERENCE.md) - Guía del design system
- [BUGS.md](./BUGS.md) - Bugs conocidos
