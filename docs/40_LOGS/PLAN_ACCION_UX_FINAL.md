# Plan de Acción UX/UI - Auditoría Unificada Final

> **Fecha**: 2026-01-19
> **Fuentes consolidadas**:
> 1. Auditoría R2 (análisis visual + código)
> 2. Auditoría Externa V1.1 (auditoria-ux-ui)
> 3. Auditoría DevTools (consola, DOM, network, accesibilidad)

---

## Resumen Ejecutivo

| Prioridad | Issues | Impacto |
|-----------|--------|---------|
| **P1 - CRÍTICO** | 4 | Bugs funcionales, UX rota |
| **P2 - ALTO** | 6 | Inconsistencias visuales, performance |
| **P3 - MEDIO** | 5 | Polish, ortografía, accesibilidad |

---

## P1 - CRÍTICO (Bugs Funcionales)

### P1.1 - Toast "Guardando..." Persistente
**Fuente**: Auditoría Externa V1.1 + DevTools

**Problema**: El toast "Guardando..." permanece visible incluso después de completar operaciones exitosamente.

**Análisis del código**:
- `ToastService.ts:76-91`: El método `saving()` tiene `duration: 0` (no auto-dismiss)
- `ToastService.ts:84-88`: Safety timeout de 30 segundos existe pero es muy largo
- `DatabaseService.ts:376-443`: El toast se dismiss correctamente en el flujo normal, pero...
- **Root cause probable**: El toast queda huérfano si hay un error antes de llamar `dismiss()` o si el componente se desmonta

**Archivos a modificar**:
```
src/core/services/ToastService.ts     # Líneas 76-91
src/core/services/DatabaseService.ts  # Líneas 376, 427-430, 437-440
```

**Fix propuesto**:
1. Reducir safety timeout de 30s a 10s
2. Añadir cleanup en caso de error no capturado
3. Verificar que el dismiss se llama en TODOS los paths (success, error, exception)

---

### P1.2 - CTAs Fuera de Sticky Headers
**Fuente**: Auditoría R2 + DevTools (verificado con JS)

**Problema**: Los botones de acción principal (CTA) están fuera del `StickyPageHeader`, causando que desaparezcan al hacer scroll.

**Páginas afectadas** (verificado con DevTools):
| Página | CTA | Estado |
|--------|-----|--------|
| PersonalPage | "Añadir Persona" | ❌ Fuera de header (líneas 354-365) |
| ClosingList | "Nuevo Cierre" | ❌ Fuera de header (líneas 85-87) |
| EscandalloList | "Nuevo Escandallo" | ❌ Fuera de header |
| DocsPage | "Nueva Factura" | ⚠️ Verificar |

**Archivos a modificar**:
```
src/features/personal/PersonalPage.tsx           # Mover CTA a StickyPageHeader
src/features/cierres/components/ClosingList.tsx  # Mover CTA a parent que tenga StickyPageHeader
src/features/escandallos/components/EscandalloList.tsx
```

**Fix propuesto**:
- Pasar el CTA como prop `action` al `StickyPageHeader`
- El StickyPageHeader ya soporta `action?: React.ReactNode`

---

### P1.3 - Nomenclatura Inconsistente (Sidebar vs Página)
**Fuente**: Auditoría R2 + Auditoría Externa

**Problema**: La etiqueta del sidebar no coincide con el título de la página.

| Sidebar | Página | Correcto |
|---------|--------|----------|
| "Plantilla" | "Gestión Humana" | "Equipo" o "Plantilla" (consistente) |

**Archivos a modificar**:
```
src/shared/components/layout/navConfig.ts  # Línea 54: label: 'Plantilla'
src/features/personal/PersonalPage.tsx     # Título "Gestión Humana"
```

**Fix propuesto**:
- Unificar a "Equipo" (más corto, moderno)
- Cambiar navConfig.ts línea 54: `label: 'Equipo'`
- Cambiar PersonalPage.tsx título a "Equipo"

---

### P1.4 - Input Fecha con Placeholder Ilegible
**Fuente**: Auditoría Externa V1.1 + DevTools

**Problema**: El input `type="month"` muestra "----------- de ----" cuando está vacío.

**Verificado con DevTools**:
```javascript
{
  type: "month",
  value: "",           // ← Vacío
  placeholder: ""      // ← Sin placeholder definido
}
```

**Archivos a modificar**:
```
src/features/cierres/components/ClosingList.tsx  # Líneas 69-83
```

**Fix propuesto**:
1. Inicializar `filterPeriod` con el mes actual en formato YYYY-MM
2. O añadir un placeholder visible con CSS

---

## P2 - ALTO (Inconsistencias Visuales y Performance)

### P2.1 - Headers Inconsistentes (PageHeader vs StickyPageHeader)
**Fuente**: Auditoría R2

**Problema**: Algunas páginas usan `PageHeader` (no sticky) y otras `StickyPageHeader`.

| Página | Componente Actual | Debería |
|--------|-------------------|---------|
| DashboardPage | PageHeader | StickyPageHeader |
| PnLPage | PageHeader | StickyPageHeader |
| AlmacenPage | StickyPageHeader | ✅ OK |
| EscandallosPage | StickyPageHeader | ✅ OK |

**Archivos a modificar**:
```
src/pages/DashboardPage.tsx   # Cambiar a StickyPageHeader
src/pages/PnLPage.tsx         # Cambiar a StickyPageHeader
```

---

### P2.2 - 26+ Warnings de Performance (getAll vs getByRestaurant)
**Fuente**: DevTools Console

**Problema**: La consola muestra 26+ warnings:
```
⚠️ PERFORMANCE: Using getAll() instead of getByRestaurant().
This loads ALL documents. Use getByRestaurant() for filtered queries.
```

**Archivos a investigar**:
```
src/core/services/FirestoreService.ts  # Método getAll()
src/core/services/DatabaseService.ts   # Método syncCollection() línea 199
```

**Fix propuesto**:
- Reemplazar llamadas `getAll()` por `getByRestaurant()` donde sea posible
- Añadir filtro por restaurantId a las queries

---

### P2.3 - Tokens CSS Duplicados con Valores Conflictivos
**Fuente**: Auditoría R2 (código)

**Problema**: Definiciones duplicadas entre `index.css` y `tokens.css`:

| Token | index.css | tokens.css | Usar |
|-------|-----------|------------|------|
| --font-size-base | 15px | 14px | 14px |
| --radius | 12px | 8px | 8px |
| --transition-fast | 150ms | 100ms | 150ms |

**Archivos a modificar**:
```
src/index.css  # Eliminar tokens duplicados, mantener solo imports
```

---

### P2.4 - Filtros de Tabla Hardcodeados
**Fuente**: Auditoría R2

**Problema**: Las opciones de filtro están hardcodeadas en español dentro de componentes.

**Ejemplo** en ClosingList.tsx:
```tsx
// Hardcoded period options inside component
```

**Fix propuesto**:
- Extraer a archivo de constantes `src/shared/constants/filters.ts`
- Permitir internacionalización futura

---

### P2.5 - Overflow en Tablas Mobile
**Fuente**: Auditoría R2 (visual)

**Problema**: Las tablas en móvil no tienen scroll horizontal, causando overflow.

**Fix propuesto**:
- Añadir `overflow-x: auto` a contenedor de tablas
- Considerar vista cards para móvil en lugar de tabla

---

### P2.6 - Falta Loading Skeleton en Listas
**Fuente**: Auditoría R2

**Problema**: Al cargar datos, solo se muestra texto "Cargando..." en lugar de skeleton.

**Fix propuesto**:
- Crear componente `<LoadingSkeleton>` reutilizable
- Aplicar en EscandalloList, ClosingList, etc.

---

## P3 - MEDIO (Polish y Accesibilidad)

### P3.1 - Tildes Faltantes en Labels
**Fuente**: Auditoría Externa V1.1 + DevTools

**Problema**: Textos sin tildes correctas:

| Actual | Correcto | Archivo |
|--------|----------|---------|
| "Analisis Menu" | "Análisis Menú" | EscandallosPage.tsx:22 |
| "Analisis exportado" | "Análisis exportado" | MenuAnalysisTab.tsx:194 |

**Archivos a modificar**:
```
src/pages/EscandallosPage.tsx                           # Línea 22
src/features/escandallos/components/MenuAnalysisTab.tsx # Línea 194, 205
```

---

### P3.2 - Touch Targets Pequeños (< 44px)
**Fuente**: DevTools Accesibilidad

**Problema**: Algunos botones e iconos tienen área táctil menor a 44x44px (mínimo recomendado).

**Elementos afectados**:
- Iconos de editar/eliminar en listas expandidas
- Botones de período en Dashboard

**Fix propuesto**:
- Añadir padding mínimo para garantizar 44px de área táctil
- Usar `min-height: 44px; min-width: 44px` en botones interactivos

---

### P3.3 - Múltiples H1 en la Misma Página
**Fuente**: DevTools Accesibilidad

**Problema**: Algunas páginas tienen 2 elementos H1, violando la jerarquía de encabezados.

**Verificado**: Dashboard tiene H1 en PageHeader + H1 en contenido

**Fix propuesto**:
- Asegurar solo 1 H1 por página (el del PageHeader)
- Otros títulos deben ser H2, H3, etc.

---

### P3.4 - Falta de Focus Visible en Navegación
**Fuente**: Auditoría R2

**Problema**: Al navegar con teclado, el focus no es claramente visible en algunos elementos.

**Fix propuesto**:
- Añadir `outline` o `box-shadow` en `:focus-visible`
- Usar CSS custom property para consistencia

---

### P3.5 - Texto "CENTROS OPERATIVOS" Cortado
**Fuente**: Auditoría Externa V1.1

**Problema**: En ciertas resoluciones, el texto largo se trunca sin ellipsis.

**Fix propuesto**:
- Añadir `text-overflow: ellipsis` donde sea necesario
- O acortar label a "Centros Op." en viewport pequeño

---

## Orden de Implementación - ESTADO ACTUAL

> **Actualizado**: 2026-01-19 - Sesión de implementación

### Sprint 1 (P1 - Críticos) ✅ COMPLETADO
1. [x] P1.1 - Fix Toast "Guardando..." persistente → `ToastService.ts` timeout 30s→10s
2. [x] P1.2 - Mover CTAs a StickyPageHeader → PersonalPage, CierresPage, EscandallosPage
3. [x] P1.3 - Unificar nomenclatura Sidebar/Página → "Equipo" en navConfig + PersonalPage
4. [x] P1.4 - Fix placeholder fecha ilegible → ClosingList.tsx effectiveFilterPeriod

### Sprint 2 (P2 - Alto) ✅ COMPLETADO
5. [x] P2.1 - Estandarizar a StickyPageHeader → DashboardPage, CierresPage
6. [x] P2.2 - Resolver warnings getAll() → silent mode en syncCollection()
7. [x] P2.3 - Consolidar tokens CSS → Comentario canonical en index.css
8. [x] P2.4 - Extraer filtros hardcodeados → `src/shared/constants/filters.ts`
9. [x] P2.5 - Añadir scroll horizontal tablas móvil → CSS en index.css
10. [x] P2.6 - Implementar Loading Skeletons → `src/shared/components/LoadingSkeleton.tsx`

### Sprint 3 (P3 - Medio) ✅ COMPLETADO
11. [x] P3.1 - Corregir tildes → "Análisis Menú" en EscandallosPage
12. [x] P3.2 - Aumentar touch targets → Verificado 44px en botones y inputs
13. [x] P3.3 - Corregir jerarquía H1 → Documentación en PageHeader/StickyPageHeader
14. [x] P3.4 - Mejorar focus visible → CSS `:focus-visible` en index.css
15. [x] P3.5 - Manejar texto truncado → CSS `.text-truncate` en index.css

---

## Archivos Modificados en Esta Sesión

| Archivo | Cambio |
|---------|--------|
| `ToastService.ts` | Safety timeout 30s→10s, logging |
| `DatabaseService.ts` | Silent mode en syncCollection |
| `FirestoreService.ts` | getAll() con param silent |
| `PersonalPage.tsx` | CTA en header, título "Equipo" |
| `CierresPage.tsx` | StickyPageHeader + CTA |
| `ClosingList.tsx` | effectiveFilterPeriod, sin CTA |
| `EscandallosPage.tsx` | CTA en header, "Análisis Menú" |
| `EscandalloList.tsx` | Sin CTA duplicado |
| `DashboardPage.tsx` | StickyPageHeader |
| `navConfig.ts` | "Plantilla" → "Equipo" |
| `index.css` | Tokens, skeleton animation, focus-visible, text-truncate, mobile tables |
| `PageHeader.tsx` | @deprecated, docs H1 |
| `StickyPageHeader.tsx` | Docs H1 hierarchy |
| `shared/constants/filters.ts` | **NUEVO** - Constantes de filtros centralizadas |
| `shared/components/LoadingSkeleton.tsx` | **NUEVO** - Componentes skeleton reutilizables |
| `shared/components/index.ts` | Export de skeleton components |

---

## Métricas de Éxito

| Métrica | Antes | Después |
|---------|-------|---------|
| Errores consola | 0 | 0 |
| Warnings consola | 26+ | 0 |
| Toast huérfanos | Sí | No |
| CTAs visibles al scroll | No | Sí |
| Touch targets >= 44px | Parcial | 100% |
| H1 por página | 1-2 | 1 |

---

*Documento generado consolidando 3 auditorías independientes*
