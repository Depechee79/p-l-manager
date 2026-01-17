# 🚀 PROMPT DE IMPLEMENTACIÓN - Auditoría Profunda P&L Manager
**Versión**: 2.0 (Post-Auditoría Forense)
**Fecha**: 2026-01-02

---

## 📋 INSTRUCCIONES DE ENGAGEMENT

Copia y pega el siguiente prompt al iniciar una nueva sesión de desarrollo:

---

```markdown
Actúa como **PROJECT MANAGER EXPERTO** en desarrollo **FULL-STACK React/TypeScript** especializado en **Seguridad y Arquitectura Enterprise**.

Tu misión PRIORITARIA es corregir las vulnerabilidades críticas y completar los gaps identificados en la auditoría "forense" de P&L Manager.

## 🔴 CONTEXTO CRÍTICO - LEE PRIMERO:

### Documentación de Auditoría (en orden de prioridad):
1. **`.agent/AUDITORIA_PROFUNDA_OPERACIONES.md`** - 🔥 INFORME FORENSE PRINCIPAL
2. `.agent/AUDIT_BACKLOG.md` - Tareas priorizadas (algunas ya completadas)
3. `.agent/RULES.md` - Reglas de arquitectura obligatorias
4. `.agent/HANDOFF.md` - Estado actual del proyecto

### Stack Tecnológico:
- React 18 + TypeScript + Vite
- Firebase (Firestore + Auth)
- Design System: `src/shared/tokens/` + `src/shared/components/`

---

## 🛑 FASE 1: SEGURIDAD (URGENTE - 4 horas)

### Tarea SEC-01: Implementar Route Guards
**Problema**: `App.tsx` no protege rutas. Cualquier usuario accede a `/pnl` o `/configuracion`.

**Implementar**:
1. Crear componente `src/shared/components/ProtectedRoute.tsx`:
   ```tsx
   interface ProtectedRouteProps {
     element: React.ReactNode;
     requiredPermissions: Permission[];
     fallback?: string; // Ruta de redirección
   }
   ```
2. Usar `hasPermission` de `src/shared/config/roles.ts` para validar.
3. Envolver rutas sensibles en `App.tsx`:
   - `/pnl` → requiere `pnl.view`
   - `/configuracion` → requiere `usuarios.edit` (solo Director)
   - `/roles` → requiere `usuarios.edit`

**Archivos a modificar**:
- `src/shared/components/ProtectedRoute.tsx` (NUEVO)
- `src/App.tsx`

**Test de Validación**:
- Loguear como "Camarero" y escribir `/pnl` en URL → Debe redirigir a `/`.

---

## 🟠 FASE 2: VERDAD FINANCIERA (1-2 días)

### Tarea FIN-01: Crear Módulo de Gastos Fijos
**Problema**: `pnl-service.ts` tiene `const alquiler = 0; const salarios = 0;`.

**Implementar**:
1. Crear tipo `GastoFijo` en `src/types/gastos.types.ts`:
   ```typescript
   interface GastoFijo {
     id: string;
     restaurantId: string;
     tipo: 'alquiler' | 'suministros' | 'seguros' | 'otros';
     importeMensual: number;
     descripcion?: string;
     fechaInicio: string;
     fechaFin?: string;
   }
   ```
2. Crear página `src/pages/GastosFijosPage.tsx` con CRUD.
3. Actualizar `PnLService.calculatePnL()` para leer de `db.gastosFijos`.

### Tarea FIN-02: Crear Módulo de Nóminas
1. Crear tipo `Nomina` en `src/types/personal.types.ts`.
2. Integrar con `PnLService` para calcular Labor Cost real.

**Archivos nuevos**:
- `src/types/gastos.types.ts`
- `src/pages/GastosFijosPage.tsx`
- `src/features/gastos/` (directorio)

---

## 🟡 FASE 3: OPERATIVA REAL (1 día)

### Tarea OPS-01: Campo EAN en Productos
**Problema**: Escáner busca por ID interno, no por código de barras real.

**Implementar**:
1. Añadir campo `barcode?: string` a `Product` en `src/types/product.types.ts`.
2. Actualizar `ProductScanner` handler:
   ```typescript
   const product = products.find(p => 
     p.barcode === decodedText || 
     String(p.id) === decodedText
   );
   ```
3. Añadir input "Código de Barras" en formulario de producto.

### Tarea OPS-02: Dashboard con Datos Reales
**Problema**: Ranking usa `Math.random()` en `DashboardPage.tsx`.

**Implementar**:
1. Conectar `restaurantKPIs` a datos reales del contexto.
2. Usar `PnLService.calculatePnL()` para cada restaurante.

---

## ✅ REGLAS OBLIGATORIAS:

1. **Mobile-First**: Toda UI táctil-friendly.
2. **Componentes Shared**: Usar `src/shared/components/` (Button, Card, Input, Select).
3. **Tokens CSS**: Variables de `tokens.css`, nunca hardcodear.
4. **R-09**: La app DEBE cargar tras cada cambio (`npm run dev`).
5. **Tests**: Añadir tests para nuevas funcionalidades críticas.

---

## 🔄 FLUJO DE TRABAJO:

1. Lee los archivos de contexto mencionados.
2. Ejecuta FASE 1 completa antes de pasar a FASE 2.
3. Verifica en navegador móvil (responsive).
4. Actualiza `AUDIT_BACKLOG.md` marcando tareas completadas.
5. Documenta cambios en `HANDOFF.md`.

---

## 🎯 PRIMERA TAREA:

Comienza con **SEC-01** (Route Guards) ya que es la vulnerabilidad más crítica.
Muéstrame primero tu plan de implementación antes de escribir código.
```

---

## 📚 ENLACES A DOCUMENTACIÓN

| Documento | Ruta | Descripción |
|-----------|------|-------------|
| **Auditoría Forense** | `.agent/AUDITORIA_PROFUNDA_OPERACIONES.md` | Informe principal con hallazgos críticos |
| Backlog Priorizado | `.agent/AUDIT_BACKLOG.md` | Tareas con estado (✅ completadas) |
| Reglas Arquitectura | `.agent/RULES.md` | Convenciones obligatorias |
| Estado Proyecto | `.agent/HANDOFF.md` | Contexto actual y sesiones previas |
| Roles y Permisos | `src/shared/config/roles.ts` | Definición de permisos existente |

---

## 📊 RESUMEN DE HALLAZGOS A IMPLEMENTAR

| ID | Severidad | Descripción | Estado |
|----|-----------|-------------|--------|
| SEC-01 | 🔴 CRÍTICO | Route Guards (Seguridad) | ⏳ Pendiente |
| FIN-01 | 🟠 GRAVE | Módulo Gastos Fijos | ⏳ Pendiente |
| FIN-02 | 🟠 GRAVE | Módulo Nóminas | ⏳ Pendiente |
| OPS-01 | 🟡 ALERTA | Campo EAN en Productos | ⏳ Pendiente |
| OPS-02 | 🟡 ALERTA | Dashboard Datos Reales | ⏳ Pendiente |

---

## 🏁 ORDEN DE EJECUCIÓN RECOMENDADO

```
SEC-01 (4h) → FIN-01 (4h) → FIN-02 (4h) → OPS-01 (2h) → OPS-02 (2h)
         ↓
   TOTAL: ~16 horas de desarrollo
```

---

**Generado**: 2026-01-02
**Origen**: Auditoría Forense por Director de Operaciones de Hostelería
