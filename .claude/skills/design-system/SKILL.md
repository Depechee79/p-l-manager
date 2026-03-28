---
name: design-system
description: |
  P&L Manager design system catalog: components, tokens, layout patterns.
  USE WHEN creating UI, modifying styles, adding components, fixing visual bugs,
  or when user says "componente", "estilo", "diseno", "token", "color", "badge".
---

# Design System — P&L Manager

## FUENTE DE VERDAD

- **Tokens CSS:** `src/shared/styles/tokens.css` (fuente de verdad visual)
- **Contrato visual:** `docs/contracts/VISUAL_CONTRACT.md`
- **Contrato UX:** `docs/contracts/UX_CONTRACT.md`
- **Inventario de componentes:** `docs/COMPONENT_INVENTORY.md`

**SIEMPRE leer tokens.css y el contrato visual antes de crear/modificar UI.**

---

## TOKENS DE DISENO

### Colores

```css
/* Principales */
--primary: #111827          /* Gray 900 — brand, textos principales */
--accent: #e11d48           /* Rose 600 — CTAs, acciones primarias */
--background: #f3f4f6       /* Cool Gray 100 — fondo app */
--surface: #ffffff          /* Blanco — cards, modals */
--text-main: #111827        /* Texto principal */
--text-secondary: #4b5563   /* Texto secundario (WCAG AA compliant) */
--border: #e5e7eb           /* Bordes */

/* Semanticos */
--success: #10b981          /* Emerald — exito, aprobado */
--warning: #f59e0b          /* Amber — atencion, pendiente */
--danger: #ef4444           /* Red — error, peligro, eliminar */
```

**PROHIBIDO:** Colores hardcodeados (hex, gray-*, etc.). SIEMPRE usar tokens CSS.

### Tipografia

```css
--font-heading: 'Public Sans'   /* Titulos, encabezados */
--font-body: 'Public Sans'      /* Texto de cuerpo, contenido */
```

### Sombras (elevacion)

```css
--shadow-sm    /* Elevacion minima: inputs, pills */
--shadow       /* Elevacion base: cards */
--shadow-md    /* Elevacion media: dropdowns, popovers */
--shadow-lg    /* Elevacion alta: modals, dialogs */
```

**PROHIBIDO:** `shadow-sm`, `shadow-md`, `shadow-lg` de Tailwind directo. Usar tokens de elevacion.

### Z-index (escala fija)

| Nivel | Valor | Uso |
|-------|-------|-----|
| dropdown | 100 | Menus desplegables, selects |
| sticky | 200 | Headers sticky, tabs |
| fixed | 300 | Elementos fijos (topbar) |
| modal-backdrop | 400 | Fondo oscuro de modal |
| modal | 500 | Contenido de modal |
| popover | 600 | Popovers, tooltips complejos |
| tooltip | 700 | Tooltips simples |
| toast | 800 | Notificaciones toast |

**PROHIBIDO:** Z-index arbitrarios (`z-10`, `z-50`, `z-[999]`). SIEMPRE usar la escala.

---

## LAYOUT — AppShellV2

```
+------------------------------------------+
|  TopbarV2 (64px, fixed, z-300)           |
+--------+---------------------------------+
| Sidebar| Contenido principal             |
| NavV2  | (scroll independiente)          |
| 256px  |                                 |
| (desk) |                                 |
+--------+---------------------------------+
| MobileBottomNav (mobile only, fixed)     |
+------------------------------------------+
```

- **Desktop:** TopbarV2 (64px) + SidebarNavV2 (256px) + contenido
- **Mobile:** TopbarV2 (64px) + contenido + MobileBottomNav (fixed bottom)
- **Sidebar se oculta en mobile:** navegar con BottomNav
- **Contenido:** scroll independiente, nunca scroll del body completo

---

## COMPONENTES — Catalogo

### Layout (src/shared/components/layout/)

| Componente | Descripcion |
|------------|-------------|
| `AppShellV2` | Shell principal: topbar + sidebar + content area |
| `TopbarV2` | Barra superior 64px: logo, nombre restaurante, avatar |
| `SidebarNavV2` | Navegacion lateral desktop (256px) |
| `MobileBottomNav` | Navegacion inferior mobile |
| `PageShell` | Wrapper de pagina con padding y max-width |
| `ConfigLayout` | Layout para paginas de configuracion |

### Atomos (src/shared/components/)

| Componente | Descripcion |
|------------|-------------|
| `Button` / `ButtonV2` | Boton con variantes: primary, secondary, ghost, danger. Loading state. |
| `Input` | Input de texto con label, error, helper text |
| `Select` | Select nativo con label y error |
| `Checkbox` | Checkbox con label |
| `Toggle` | Switch on/off |
| `Badge` | Badge de estado (success, warning, danger, neutral) |
| `Card` | Contenedor con surface + shadow + border-radius |
| `Modal` | Dialog modal con overlay, header, body, footer |
| `Toast` | Notificacion temporal (success, error, warning, info) |
| `Tooltip` | Tooltip en hover/focus |
| `Spinner` | Loading spinner |
| `Skeleton` | Placeholder de carga |
| `EmptyState` | Estado vacio con icono + texto + CTA |
| `ErrorState` | Estado de error con retry |
| `Icon` | Wrapper de iconos (Lucide React) |
| `Avatar` | Avatar circular con iniciales o imagen |
| `Divider` | Linea separadora |

### Moleculas

| Componente | Descripcion |
|------------|-------------|
| `SearchBar` | Input de busqueda con icono y clear |
| `FilterPanel` | Panel de filtros desplegable |
| `Tabs` | Tabs con contenido switchable |
| `DataTable` | Tabla de datos con sorting y paginacion |
| `DataTableHeader` | Header sticky de tabla (visible en mobile) |
| `FormField` | Campo de formulario: label + input + error + helper |
| `ConfirmDialog` | Modal de confirmacion para acciones destructivas |
| `FileUpload` | Area de upload drag-and-drop |
| `DatePicker` | Selector de fecha |
| `NumberInput` | Input numerico con +/- buttons |
| `CurrencyInput` | Input de moneda con formato EUR |
| `PercentageInput` | Input de porcentaje |

### Organismos

| Componente | Descripcion |
|------------|-------------|
| `WizardStepper` | Wizard multi-paso con indicador de progreso |
| `KPICard` | Card de KPI con valor, label, trend |
| `StatsGrid` | Grid de KPIs |
| `ActivityFeed` | Feed de actividad reciente |
| `QuickActions` | Acciones rapidas desde dashboard |

---

## PATRONES OBLIGATORIOS

### 4 Estados de pagina

Toda pagina con datos async DEBE manejar 4 estados:

```tsx
if (loading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (data.length === 0) return <EmptyState action={<Button>Crear primero</Button>} />;
return <DataView data={data} />;
```

### 3 Fases de accion async

Todo boton que ejecuta una accion async:

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await saveData();
    showToast.success('Guardado correctamente');
  } catch (error: unknown) {
    logError(error, 'save-data');
    showToast.error('Error al guardar');
  } finally {
    setIsSubmitting(false);
  }
};

<Button loading={isSubmitting} onClick={handleSubmit}>Guardar</Button>
```

### Confirmacion destructiva

```tsx
<ConfirmDialog
  title="Eliminar producto"
  description="Esta accion no se puede deshacer."
  confirmLabel="Eliminar producto"
  variant="danger"
  onConfirm={handleDelete}
/>
```

### Touch targets

```tsx
// MINIMO 44x44px para interactivos
<button className="min-h-11 min-w-11 ...">
```

---

## MOBILE-FIRST

- **Diseno:** mobile-first, desktop como extension
- **Contexto:** camareros/encargados usando el movil en sala, con una mano
- **Touch targets:** 44px minimo (dedos, no cursor)
- **Scroll:** vertical fluido, nunca horizontal en contenido principal
- **Modals en mobile:** full-screen o bottom-sheet
- **Tablas en mobile:** columnas priorizadas, scroll horizontal solo si inevitable

---

## PROHIBICIONES VISUALES

| Prohibido | Alternativa |
|-----------|-------------|
| Colores hex/named hardcodeados | Tokens CSS: `var(--primary)` |
| `shadow-sm/md/lg` Tailwind directo | Tokens: `shadow-elevation-*` |
| Z-index arbitrarios | Escala de tokens |
| `font-sans/serif/mono` Tailwind | `font-heading` / `font-body` |
| Scroll anidado (overflow en overflow) | Reestructurar layout |
| Triple Card nesting | Maximo 2 niveles |
| Modal sobre modal | Reemplazar modal o usar steps |
| Botones sin loading state | `loading={isSubmitting}` |
| Formularios sin error state | Validacion + mensajes |
| Paginas sin empty state | `<EmptyState>` con CTA |

---

## REFERENCIA RAPIDA: DONDE LEER MAS

- **Tokens CSS:** `src/shared/styles/tokens.css`
- **Contrato visual:** `docs/contracts/VISUAL_CONTRACT.md`
- **Contrato UX:** `docs/contracts/UX_CONTRACT.md`
- **Contrato accesibilidad:** `docs/contracts/ACCESSIBILITY_CONTRACT.md`
- **Inventario componentes:** `docs/COMPONENT_INVENTORY.md`
- **Componentes shared:** `src/shared/components/`
- **Layout:** `src/shared/components/layout/`
