# 📜 REGLAS DE ARQUITECTURA - P&L Manager

**Versión**: 1.0  
**Fecha**: 2025-12-30  
**Estado**: ACTIVO - Obligatorio para todos los contribuyentes

---

## 🎯 Propósito

Este documento establece las reglas y convenciones obligatorias que **TODO desarrollador o agente de IA** debe seguir al trabajar en este proyecto. El incumplimiento de estas reglas generará deuda técnica y dificultará el mantenimiento.

---

## 📁 Estructura de Proyecto

### Estructura Obligatoria

```
src/
├── shared/                 # ⚠️ NÚCLEO DEL SISTEMA DE DISEÑO
│   ├── components/         # Componentes UI reutilizables
│   │   ├── layout/         # Componentes de layout (Sidebar, etc.)
│   │   └── index.ts        # Barrel export obligatorio
│   ├── config/             # Configuración compartida (roles, permisos)
│   ├── tokens/             # Tokens de diseño (TS + CSS)
│   ├── styles/             # Estilos base (reset, typography)
│   ├── hooks/              # Hooks genéricos
│   ├── types/              # Tipos compartidos de UI
│   ├── utils/              # Utilidades genéricas
│   └── index.ts            # Barrel export principal
├── core/                   # Servicios base e infraestructura
│   ├── services/           # DatabaseService, ItemsService, etc.
│   └── context/            # Contextos globales (App, Restaurant)
├── features/               # Funcionalidad agrupada por dominio
├── components/             # Re-exports de shared + Layout
├── pages/                  # Páginas de la aplicación
├── services/               # Lógica de negocio y APIs (legacy)
├── hooks/                  # Hooks de dominio
├── context/                # Contextos de React (legacy)
├── types/                  # Tipos de dominio
└── config/                 # Configuración (Firebase, etc.)
```

---

## 🚨 REGLAS OBLIGATORIAS

### R-01: Componentes Nuevos van en `shared/`

> **Todo componente UI reutilizable DEBE ir en `src/shared/components/`**

✅ Correcto:
```
src/shared/components/Badge.tsx
src/shared/components/Dropdown.tsx
```

❌ Incorrecto:
```
src/components/Badge.tsx
src/pages/components/Badge.tsx
```

---

### R-02: Usar Tokens del Sistema de Diseño

> **Nunca hardcodear colores, espaciados o tipografía**

✅ Correcto:
```css
color: var(--text-main);
padding: var(--spacing-md);
border-radius: var(--radius);
```

```typescript
import { ACCENT, SPACING_MD } from '@/shared/tokens';
```

❌ Incorrecto:
```css
color: #111827;
padding: 20px;
border-radius: 12px;
```

---

### R-03: Sincronización de Tokens

> **Si modificas un token, actualízalo en AMBOS lugares:**

| Ubicación | Propósito |
|-----------|-----------|
| `src/shared/tokens/*.ts` | Para uso en TypeScript/props |
| `src/shared/styles/tokens.css` | Para uso en CSS |
| `src/index.css` | Archivo raíz (TODO: migrar a shared/) |

**Ejemplo de sincronización:**
```typescript
// shared/tokens/colors.ts
export const ACCENT = '#e11d48';

// shared/styles/tokens.css
:root {
  --accent: #e11d48;
}

// src/index.css (legacy, mismo valor)
--accent: #e11d48;
```

---

### R-04: Barrel Exports Obligatorios

> **Cada carpeta con múltiples archivos DEBE tener un `index.ts`**

✅ Correcto:
```typescript
// shared/components/index.ts
export { Button } from './Button';
export { Card } from './Card';

// Uso
import { Button, Card } from '@/shared/components';
```

❌ Incorrecto:
```typescript
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
```

---

### R-05: Estructura de Componentes

> **Todo componente debe seguir esta estructura:**

```typescript
/**
 * ComponentName - Brief description
 * 
 * @example
 * <ComponentName variant="primary" />
 */
import React from 'react';

export interface ComponentNameProps {
  // Props con JSDoc
}

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  return (...);
};
```

---

### R-06: No Modificar Componentes de `shared/` sin Auditoría

> **Antes de modificar cualquier componente en `shared/`:**

1. Verificar qué páginas/componentes lo usan
2. Documentar el cambio propuesto
3. Verificar que no rompe otros usos
4. Actualizar tests si existen

---

### R-07: Documentación de Tareas

> **Toda tarea debe documentarse en `docs/`:**

| Archivo | Propósito |
|---------|-----------|
| `docs/40_LOGS/BACKLOG_CONSOLIDADO.md` | Lista completa de tareas |
| `docs/_ARCHIVE/tasks/TAREA-ID_*.md` | Detalle de cada tarea |
| `docs/01_CANON/BUGS.md` | Bugs conocidos |
| `docs/01_CANON/RULES.md` | Este archivo |

---

### R-08: Archivos Grandes (>300 líneas)

> **Archivos de más de 300 líneas deben ser refactorizados**

Actualmente identificados:
- ~~Layout.tsx~~ ✅ (refactorizado)
- OCRPage.tsx (pendiente PAGE-01)
- CierresPage.tsx (pendiente PAGE-02)

---

### R-09: Siempre Cargable (Zero Downtime)

> **La aplicación DEBE cargar correctamente después de cada tarea finalizada.**

1. No se finaliza ninguna tarea si la app no carga.
2. El servidor de desarrollo (`npm run dev`) debe iniciar sin errores fatales.
3. La aplicación debe ser navegable y no mostrar pantallas en blanco (White Screen of Death).
4. Es obligatorio realizar una verificación visual en el navegador antes de entregar cualquier cambio.

---

## 📋 Checklist para Nuevos Cambios

Antes de cada commit, verificar:

- [ ] ¿Los componentes nuevos están en `shared/`?
- [ ] ¿Se usan tokens en lugar de valores hardcodeados?
- [ ] ¿Hay barrel exports actualizados?
- [ ] ¿Los archivos tienen JSDoc?
- [ ] ¿La tarea está documentada en `docs/`?
- [ ] ¿El build (`npm run build`) pasa sin errores críticos?
- [ ] ¿La aplicación CARGA correctamente en el navegador?
- [ ] ¿Se verificó la funcionalidad principal afectada?

---

## 🔄 Mantenimiento de Reglas

Este documento se actualiza cuando:
1. Se completa una tarea de arquitectura
2. Se identifica una nueva convención necesaria
3. Se corrige un problema de consistencia

**Responsable**: Project Manager o desarrollador principal

---

**Última actualización**: 2026-01-01  
**Aprobado por**: Auditoría de Arquitectura

---

## R-12: Buscar TODOS los Casos cuando se da un Ejemplo

> **CRÍTICO: Cuando el usuario reporta un problema con un ejemplo específico, SIEMPRE buscar TODAS las ocurrencias de ese patrón en toda la aplicación.**

### Proceso Obligatorio:

1. **Recibir ejemplo** del usuario (ej: "el input tiene altura diferente al select")
2. **Usar `grep_search`** para encontrar TODAS las ocurrencias del patrón
3. **Listar todos los archivos afectados** antes de implementar
4. **Crear solución global** que aplique a todos los casos
5. **NO arreglar solo el ejemplo aislado**

### Ejemplo:

❌ **Incorrecto:**
```
Usuario: "El input en TransfersPage tiene altura diferente"
> Solo arreglar TransfersPage.tsx
```

✅ **Correcto:**
```
Usuario: "El input en TransfersPage tiene altura diferente"
> Buscar: grep_search(query="minHeight:", path="src/")
> Encontrar: 20 archivos afectados
> Arreglar: TODOS los 20 archivos
```

### Patrones comunes a buscar:

| Problema | Búsqueda |
|----------|----------|
| Alturas inconsistentes | `minHeight:` |
| Anchos excesivos | `gridTemplateColumns: 'repeat(auto-fit` |
| Inputs raw | `<input` en archivos .tsx |
| Imports sin usar | Lint warnings |
| Estilos hardcoded | `#[0-9a-f]` regex |

---

## R-13: Coherencia Absoluta del Frontend

> **CRÍTICO: Todo código y diseño frontend DEBE ser coherente en TODA la aplicación. Esta regla tiene prioridad sobre velocidad de desarrollo.**

### Principio Fundamental

La coherencia NO se logra definiendo dimensiones fijas en cada elemento, sino usando los **mismos contenedores/layouts** en toda la app. Si el contenedor padre es coherente, los elementos hijos heredan esa coherencia automáticamente.

---

### Tres Niveles de Coherencia

| Nivel | Qué Cubre | Ejemplo de Incoherencia |
|-------|-----------|------------------------|
| **VISUAL** | Apariencia idéntica | Input 40px en una página, 44px en otra |
| **ESTRUCTURAL** | Mismos contenedores/wrappers | `<div><Input/></div>` vs `<div><div><Input/></div></div>` |
| **CÓDIGO** | Mismos patrones de implementación | Hook inline vs importar de `@hooks` |

---

### NIVEL 1: Coherencia Visual

Un componente del mismo tipo SIEMPRE se ve igual:

- Altura, padding, bordes → Definidos en el COMPONENTE (e.g., `Input.tsx`)
- Colores, tipografía → Desde TOKENS (`var(--token)`)
- Verificación: comparar capturas del mismo componente en 2 páginas = deben ser idénticas

---

### NIVEL 2: Coherencia Estructural (Contenedores)

**Los elementos heredan comportamiento del contenedor padre.**

Crear **contenedores estándar reutilizables**:

| Patrón | Contenedor |
|--------|------------|
| Filtros de lista | `<FilterBar>` o grid estándar |
| Formulario campos | `<FormSection>` + grid estándar |
| Cabecera de página | Flex con gap estándar |
| Campo individual | `<Input label="" fullWidth />` |

**Uso correcto:**
```tsx
// MISMA estructura en TODA la app
<div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 400px) minmax(150px, 200px)', gap: 'var(--spacing-md)' }}>
  <Input label="Buscar" fullWidth />
  <Select label="Estado" fullWidth />
</div>
```

**Anti-Patrón:**
```tsx
// ❌ PROHIBIDO - Cada página inventa su contenedor
Página A: <div style={{ width: '50%' }}>
Página B: <div style={{ maxWidth: '600px' }}>
Página C: <div style={{ flex: 1 }}>
```

---

### NIVEL 3: Coherencia de Código

Incluso el código invisible debe seguir los mismos patrones:

| Aspecto | Patrón Obligatorio |
|---------|-------------------|
| Hooks | Importar de `@hooks`, nunca crear inline |
| Componentes UI | De `@shared/components`, nunca ad-hoc |
| Tokens | `var(--token)`, nunca hardcoded |
| Tipos | De `@types`, nunca inline |
| Formateo | De `@utils/formatters` |
| Servicios | De `@services` |

---

### Checklist Antes de Escribir Código

```
□ ¿Este patrón de layout ya existe en otra página? → Copiarlo exacto
□ ¿Este hook ya existe en @hooks? → Usarlo
□ ¿Este componente ya existe en @shared/components? → Usarlo
□ ¿Estoy creando un div wrapper ad-hoc? → PARAR, buscar patrón existente
□ ¿Estoy poniendo style={{}} con valores nuevos? → PARAR, verificar si existe
```

---

### Excepciones Documentadas

Si una situación **muy específica** requiere desviarse de la coherencia:

1. **Documentar** la excepción con comentario `// EXCEPCIÓN R-13: [razón]`
2. **Justificar** por qué no se puede usar el patrón estándar
3. **Limitar** al mínimo código posible
4. **Revisar** si la excepción indica que falta un nuevo patrón estándar

```tsx
// EXCEPCIÓN R-13: Dashboard KPIs requieren grid de 4 columnas fijas por diseño específico
<div style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
```

---

### Consecuencias del Incumplimiento

- Deuda técnica exponencial
- Bugs visuales entre pantallas
- Auditorías UX imposibles
- Mantenimiento costoso

**Esta regla se aplica SIEMPRE. No hay atajos.**

---

**Última actualización**: 2026-01-01  
**Aprobado por**: Auditoría de Arquitectura
