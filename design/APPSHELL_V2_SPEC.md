# AppShell V2 - Especificaciones Extraídas del Canon Stitch

> Documento generado: 2026-01-19
> Fuente: `design/almacen/codealmacen.html` y `design/docs/codedocs.html`

---

## 1. Tokens Layout V2 (Medidas Exactas del Canon)

### Topbar
```css
--app-topbar-h: 64px;        /* h-16 */
--app-topbar-bg: var(--surface); /* bg-white */
--app-topbar-border: var(--border); /* border-slate-200 */
--app-topbar-z: 50;
--app-topbar-px: 24px;       /* px-6 */
```

### Sidebar
```css
--app-sidebar-w: 256px;      /* w-64 */
--app-sidebar-bg: var(--surface);
--app-sidebar-border: var(--border);
--app-sidebar-z: 40;
--app-sidebar-py: 24px;      /* py-6 */
--app-sidebar-px: 16px;      /* px-4 */
```

### Main Content
```css
--app-content-pad-x: 24px;   /* p-6 default */
--app-content-pad-x-lg: 32px; /* lg:p-8 */
--app-content-pad-y: 24px;
--app-content-pad-y-lg: 32px;
```

### Interactive Elements
```css
--app-interactive-h: 36px;   /* height: 36px */
--app-interactive-radius: 8px; /* rounded-[8px] */
--app-interactive-font-size: 12px;
--app-interactive-font-weight: 600;
```

### Filter Inputs (Compact)
```css
--app-filter-input-h: 32px;  /* h-[32px] */
--app-filter-label-size: 8px; /* text-[8px] */
--app-filter-input-size: 11px; /* text-[11px] */
```

---

## 2. Estructura DOM del Canon

### Header (Topbar)
```html
<header class="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-6">
  <!-- LEFT: Brand + Breadcrumb -->
  <div class="flex items-center space-x-8">
    <!-- Brand -->
    <div class="flex items-center space-x-2">
      <div class="w-8 h-8 bg-primary rounded-lg">ICON</div>
      <div class="flex flex-col leading-none">
        <span class="font-bold text-xl text-primary">P&L Manager</span>
        <span class="text-[9px] text-slate-400 uppercase">Gestión Premium</span>
      </div>
    </div>
    <!-- Breadcrumb + Description (hidden md:flex) -->
    <div class="hidden md:flex flex-col">
      <nav class="flex items-center text-xs text-slate-400">
        <span>Management</span>
        <span>chevron_right</span>
        <span class="text-slate-600">Almacén</span>
      </nav>
      <p class="text-[11px] text-slate-400">Existencias, inventarios, mermas...</p>
    </div>
  </div>

  <!-- RIGHT: Notifications + Help + Divider + User -->
  <div class="flex items-center space-x-4">
    <button class="p-2 text-slate-500 hover:bg-slate-100 rounded-full">BELL</button>
    <button class="p-2 text-slate-500 hover:bg-slate-100 rounded-full">HELP</button>
    <div class="h-8 w-px bg-slate-200 mx-2"></div>
    <div class="flex items-center space-x-3">
      <div class="text-right hidden sm:block">
        <p class="text-sm font-bold">Admin User</p>
        <p class="text-[10px] text-slate-400 uppercase">Super Admin</p>
      </div>
      <img class="w-10 h-10 rounded-full" src="avatar"/>
      <span>expand_more</span>
    </div>
  </div>
</header>
```

### Sidebar (debajo del topbar)
```html
<aside class="fixed left-0 bottom-0 top-16 w-64 bg-white border-r overflow-y-auto z-40 hidden lg:block">
  <div class="py-6 px-4 space-y-1">
    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-4">Main Menu</p>
    <!-- Nav Items -->
    <a class="interactive-element space-x-3 px-3 text-slate-600 hover:bg-slate-50">
      <span class="material-symbols-outlined">dashboard</span>
      <span>Dashboard</span>
    </a>
    <!-- Active item -->
    <a class="interactive-element space-x-3 px-3 bg-primary text-white shadow-md">
      <span class="material-symbols-outlined">inventory_2</span>
      <span>Almacén</span>
    </a>
    <!-- Sections -->
    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mt-8 mb-4">Analytics</p>
    ...
  </div>
</aside>
```

### Main Content
```html
<main class="flex-1 lg:ml-64 min-h-[calc(100vh-64px)] p-6 lg:p-8">
  <!-- Content Toolbar: Tabs + Actions -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <!-- Tabs Container -->
    <div class="flex items-center space-x-1 bg-slate-100/50 p-1 rounded-lg w-fit">
      <button class="interactive-element px-4 bg-primary text-white">Existencias</button>
      <button class="interactive-element px-4 text-slate-500 hover:bg-slate-200/50">Inventarios</button>
      ...
    </div>
    <!-- Action Buttons -->
    <div class="flex items-center space-x-2">
      <button class="interactive-element px-4 bg-primary text-white">+ Nuevo</button>
    </div>
  </div>

  <!-- Filter Panel -->
  <div class="bg-white p-5 rounded-xl shadow-sm border mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Inputs h-[32px], labels text-[8px] -->
    </div>
  </div>

  <!-- Content Panel -->
  <div class="bg-white rounded-xl shadow-sm border">
    ...
  </div>
</main>
```

---

## 3. Componentes a Crear

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| TopbarV2 | `shared/components/layout/TopbarV2.tsx` | Header fijo con brand, breadcrumb, user |
| SidebarNavV2 | `shared/components/layout/SidebarNavV2.tsx` | Sidebar fixed debajo del topbar |
| PageHeaderV2 | `shared/components/layout/PageHeaderV2.tsx` | Toolbar con tabs + acciones (reemplaza StickyPageHeader en AppShellV2) |
| AppShellV2 | `shared/components/layout/AppShellV2.tsx` | Wrapper que orquesta topbar + sidebar + main |

---

## 4. Route Meta Config

```typescript
// shared/config/routeMeta.ts
export const routeMeta: Record<string, RouteMeta> = {
  '/almacen': {
    breadcrumb: ['Management', 'Almacén'],
    title: 'Almacén',
    subtitle: 'Existencias, inventarios, mermas y pedidos.',
  },
  '/docs': {
    breadcrumb: ['Management', 'Docs'],
    title: 'Docs',
    subtitle: 'Facturas, albaranes y cierres escaneados.',
  },
  // ... más rutas
};
```

---

## 5. Decisiones de Diseño

### Mantener (del sistema actual):
- Colores: `--accent: #e11d48` (Rose 600) - NO cambiar a #D81E5B
- Tipografía: `Public Sans` - NO cambiar a Inter
- Iconos: `lucide-react` - NO cambiar a Material Symbols

### Adoptar (del canon):
- Topbar fijo de 64px full width
- Sidebar de 256px posicionado fixed debajo del topbar
- Interactive elements de 36px altura
- Filter inputs compactos de 32px
- Padding de main: 24px / 32px (lg)
- Border radius: 8px para elementos interactivos

### Rollout:
- Fase 1: Solo /almacen y /docs usan AppShellV2
- El resto sigue con Layout actual
- Feature flag por ruta en App.tsx

---

## 6. Checklist Pre-Implementación

- [x] HTML canon analizado
- [x] Tokens identificados
- [x] Estructura DOM documentada
- [x] Componentes listados
- [x] Decisiones de diseño definidas
- [ ] Tokens añadidos a index.css
- [ ] Componentes implementados
- [ ] Rollout configurado
- [ ] Validación visual
- [ ] Documentación final
