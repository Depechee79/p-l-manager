# SESION 003: STICKY HEADERS + ESTANDARIZACION UI

**Fecha:** 2026-01-18
**Duracion:** ~3 horas
**Estado:** COMPLETADO

---

## RESUMEN EJECUTIVO

Esta sesion resolvio problemas criticos de UX reportados por el usuario:

**PROBLEMA PRINCIPAL - Headers NO sticky (solicitado 6 veces):**
- Los titulos, tabs y filtros de todas las secciones hacian scroll con el contenido
- El usuario queria que permanecieran fijos mientras el contenido scrollea debajo

**CAUSA RAIZ IDENTIFICADA:**
- En `Layout.tsx` habia un `<div>` wrapper entre `<main>` y `{children}` que rompia la cadena de `position: sticky`
- Los elementos con `sticky` deben ser hijos directos del contenedor con scroll (`overflow-y: auto`)

**SOLUCION:**
- Eliminar el div wrapper en Layout.tsx
- Usar componente `StickyPageHeader` que ya existia pero no se usaba
- Migrar todas las paginas a StickyPageHeader

---

## PROBLEMAS REPORTADOS POR EL USUARIO

| # | Problema | Veces Reportado | Estado |
|---|----------|-----------------|--------|
| 1 | Headers NO se quedan fijos (sticky) | **6 veces** | ✅ RESUELTO |
| 2 | Mucho padding entre contenido y sidebar | 3 veces | ✅ RESUELTO |
| 3 | "Escandallos" aparece 3 veces (redundante) | 2 veces | ✅ RESUELTO |
| 4 | Tab "Recetas" debe llamarse "Escandallos" | 1 vez | ✅ RESUELTO |
| 5 | Input/select vs button altura diferente | 1 vez | ✅ RESUELTO |
| 6 | Boton "Añadir Persona" fuera de su tab | 1 vez | ✅ RESUELTO |
| 7 | Selector en Docs debe ser TabsHorizontal | 1 vez | ✅ RESUELTO |

---

## HALLAZGO TECNICO CRITICO

### Por que sticky no funcionaba

**Estructura ANTES (rota):**
```html
<main style="overflow-y: auto">
  <div style="max-width: 1400px; margin: 0 auto">  <!-- ESTE DIV ROMPIA STICKY -->
    <StickyPageHeader style="position: sticky" />  <!-- NO FUNCIONA -->
    <Content />
  </div>
</main>
```

**Problema:** CSS `position: sticky` requiere que el elemento sea hijo DIRECTO del contenedor con scroll (`overflow-y: auto`). El `<div>` intermedio rompe esta relacion.

**Estructura DESPUES (funcional):**
```html
<main style="overflow-y: auto">
  <StickyPageHeader style="position: sticky" />  <!-- FUNCIONA -->
  <Content />
</main>
```

---

## ARCHIVOS MODIFICADOS

### Layout.tsx (CAMBIO CRITICO)

**Ubicacion:** `src/components/Layout.tsx`

**Cambio:** Eliminar div wrapper que rompia sticky

```typescript
// ANTES (lineas ~180-190)
<main style={{ flex: 1, overflowY: 'auto', padding: '...' }}>
  <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
    {children}
  </div>
</main>

// DESPUES
<main style={{ flex: 1, overflowY: 'auto', padding: '...' }}>
  {children}
</main>
```

---

### StickyPageHeader.tsx (ACTUALIZADO)

**Ubicacion:** `src/shared/components/layout/StickyPageHeader.tsx`

**Cambios:** Ajuste de margenes para compensar nuevo Layout

```typescript
<div
  className="sticky-page-header"
  style={{
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'var(--background)',
    paddingTop: 'var(--spacing-xs)',
    paddingBottom: 'var(--spacing-xs)',
    // Margenes negativos para extender hasta bordes
    marginLeft: 'calc(-1 * var(--spacing-md))',
    marginRight: 'calc(-1 * var(--spacing-md))',
    paddingLeft: 'var(--spacing-md)',
    paddingRight: 'var(--spacing-md)',
    marginTop: 'calc(-1 * var(--spacing-sm))',
    borderBottom: '1px solid var(--border)',
  }}
>
```

---

### PageHeader.tsx (ACTUALIZADO)

**Ubicacion:** `src/shared/components/layout/PageHeader.tsx`

**Cambio:** Eliminar propiedades sticky (ahora las maneja StickyPageHeader)

```typescript
// ANTES
<div style={{
  position: 'sticky',
  top: 0,
  zIndex: 10,
  ...
}}>

// DESPUES
<div style={{
  backgroundColor: 'var(--background)',
  paddingTop: 'var(--spacing-xs)',
  paddingBottom: 'var(--spacing-xs)',
  // Sin position: sticky
}}>
```

---

### TabsHorizontal.tsx (ACTUALIZADO)

**Ubicacion:** `src/shared/components/TabsHorizontal.tsx`

**Cambio:** Eliminar propiedades sticky (ahora las maneja StickyPageHeader)

```typescript
// ANTES
<div style={{
  position: 'sticky',
  top: '48px',
  zIndex: 9,
  ...
}}>

// DESPUES
<div style={{
  backgroundColor: 'var(--background)',
  display: 'flex',
  gap: 'var(--spacing-xs)',
  // Sin position: sticky
}}>
```

---

### EscandalloList.tsx (ACTUALIZADO)

**Ubicacion:** `src/features/escandallos/components/EscandalloList.tsx`

**Cambios:**
1. Altura de input month: 40px → 44px (para igualar botones)
2. Añadido marginTop al contenedor

```typescript
// Input month
<input
  type="month"
  style={{
    height: '44px',  // Antes: 40px
    ...
  }}
/>

// Contenedor
<div className="escandallo-list" style={{ marginTop: 'var(--spacing-md)' }}>
```

---

### EscandallosPage.tsx (MIGRADO A StickyPageHeader)

**Ubicacion:** `src/pages/EscandallosPage.tsx`

**Cambio:** Usar StickyPageHeader en lugar de header inline

```typescript
// ANTES
<PageContainer>
  <PageHeader title="Escandallos" ... />
  <TabsHorizontal ... />
  <EscandalloList ... />
</PageContainer>

// DESPUES
<PageContainer>
  {viewMode === 'list' && (
    <StickyPageHeader
      title="Escandallos"
      description="Gestiona recetas y analiza la rentabilidad del menú"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tabId) => handleTabChange(tabId as TabId)}
    />
  )}
  {/* Content */}
</PageContainer>
```

**Tab renombrada:** "Recetas" → "Escandallos"

```typescript
const TABS: TabItem[] = [
  { id: 'recetas', label: 'Escandallos', icon: <ClipboardList size={18} /> },  // Antes: 'Recetas'
  { id: 'analisis', label: 'Analisis Menu', icon: <BarChart3 size={18} /> },
];
```

---

### PersonalPage.tsx (MIGRADO + BOTON REUBICADO)

**Ubicacion:** `src/features/personal/PersonalPage.tsx`

**Cambios:**
1. Migrado a StickyPageHeader
2. Boton "Añadir Persona" movido de header a dentro del contenido de tab

```typescript
// ANTES - Boton en PageHeader (fuera de zona de tab)
<PageHeader
  title="..."
  action={<Button>Añadir Persona</Button>}
/>

// DESPUES - Boton dentro del contenido de tab staff
<StickyPageHeader
  title="Gestión Humana"
  description="Control centralizado de equipo y accesos"
  tabs={PERSONAL_TABS}
  activeTab={activeTab}
  onTabChange={(id) => { setActiveTab(id); setViewMode('list'); }}
/>

{activeTab === 'staff' && viewMode === 'list' && (
  <>
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 'var(--spacing-md)',
      marginBottom: 'var(--spacing-md)',
    }}>
      <Button variant="primary" onClick={handleOpenForm}>
        <Plus size={16} /> Añadir Persona
      </Button>
    </div>
    <StaffList ... />
  </>
)}
```

---

### AlmacenPage.tsx (MIGRADO A StickyPageHeader)

**Ubicacion:** `src/pages/AlmacenPage.tsx`

```typescript
<PageContainer>
  <StickyPageHeader
    title="Almacén"
    description="Gestión de existencias, inventarios, mermas, pedidos, proveedores y traspasos"
    tabs={TABS}
    activeTab={activeTab}
    onTabChange={(tabId) => setActiveTab(tabId as TabId)}
  />
  {/* Tab content */}
</PageContainer>
```

---

### PnLPage.tsx (MIGRADO A StickyPageHeader)

**Ubicacion:** `src/pages/PnLPage.tsx`

```typescript
<PageContainer>
  <StickyPageHeader
    title="P&L"
    icon={<BarChart3 size={28} />}
    tabs={PNL_TABS}
    activeTab={activeTab}
    onTabChange={(tabId) => setActiveTab(tabId as PnLTabId)}
    action={/* selector de periodo */}
  />
  {/* Tab content */}
</PageContainer>
```

---

### RestaurantConfigPage.tsx (MIGRADO A StickyPageHeader)

**Ubicacion:** `src/pages/RestaurantConfigPage.tsx`

```typescript
<PageContainer>
  <StickyPageHeader
    title={mode === 'create' ? 'Gestionar Nueva Unidad' : 'Configuración Corporativa'}
    description={...}
    icon={<Building2 size={28} />}
    tabs={CONFIG_TABS}
    activeTab={activeTab}
    onTabChange={(tabId) => {...}}
    action={/* selector de restaurante */}
  />
  {/* Tab content */}
</PageContainer>
```

**Error corregido:** Sintaxis `}}` cambiado a `)}` en linea 276

---

### OCRDocumentList.tsx (MIGRADO + SELECT → TABS)

**Ubicacion:** `src/features/ocr/components/OCRDocumentList.tsx`

**Cambio principal:** Transformar Select dropdown a TabsHorizontal

```typescript
// ANTES - Select dropdown
<select value={filter} onChange={(e) => onFilterChange(e.target.value)}>
  <option value="all">Todos</option>
  <option value="facturas">Facturas</option>
  ...
</select>

// DESPUES - TabsHorizontal
const FILTER_TABS: TabItem[] = [
  { id: 'all', label: 'Todos', icon: <FileText size={16} /> },
  { id: 'recent', label: 'Recientes', icon: <Clock size={16} /> },
  { id: 'facturas', label: 'Facturas', icon: <Receipt size={16} /> },
  { id: 'albaranes', label: 'Albaranes', icon: <Truck size={16} /> },
  { id: 'tickets', label: 'Tickets', icon: <CreditCard size={16} /> },
  { id: 'cierres', label: 'Cierres', icon: <Calculator size={16} /> },
];

<StickyPageHeader
  title="Documentos"
  description="Facturas, albaranes y cierres escaneados"
  tabs={FILTER_TABS}
  activeTab={filter}
  onTabChange={onFilterChange}
  action={/* boton subir */}
  filters={<Input placeholder="Buscar..." />}
/>
```

---

### MenuAnalysisTab.tsx (ACTUALIZADO)

**Ubicacion:** `src/features/escandallos/components/MenuAnalysisTab.tsx`

**Cambio:** Añadido marginTop al contenedor

```typescript
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-lg)',
  marginTop: 'var(--spacing-md)'  // NUEVO
}}>
```

---

### index.css (ACTUALIZADO)

**Ubicacion:** `src/index.css`

**Cambio:** Añadida clase CSS para sticky header

```css
.sticky-page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--background);
}

.sticky-page-header .tabs-horizontal-container {
  position: relative;
  top: auto;
}
```

---

## ERRORES ENCONTRADOS Y CORREGIDOS

### Error 1: RestaurantConfigPage.tsx - Sintaxis

**Error:** `TS1005: ')' expected`

**Causa:** Al migrar a StickyPageHeader, los brackets de cierre quedaron mal
- Linea 276 tenia `}}` en lugar de `)}`

**Solucion:**
```typescript
// ANTES (error)
onTabChange={(tabId) => {...}}}

// DESPUES (correcto)
onTabChange={(tabId) => {...})}
```

### Error 2: Sticky no funcionaba

**Sintoma:** A pesar de tener `position: sticky`, los headers hacian scroll

**Causa:** El div wrapper en Layout.tsx rompia la cadena sticky

**Leccion:** CSS `position: sticky` requiere que el elemento sea hijo DIRECTO del contenedor con `overflow-y: auto`. Cualquier div intermedio rompe esto.

---

## INSTRUCCIONES ESPECIALES DEL USUARIO

El usuario enfatizo varias veces:

1. **"Modo cirugia"** - Cambios precisos y quirurgicos, no refactorizaciones grandes
2. **"Antes de actuar en frontend, investigar"** - Analizar estructura de divs antes de modificar
3. **"No dar algo por hecho sin verificar"** - Comprobar que los cambios funcionan
4. **"No ignorar puntos"** - Completar TODOS los items solicitados, no saltarse ninguno

---

## PAGINAS MIGRADAS A StickyPageHeader

| Pagina | Archivo | Estado |
|--------|---------|--------|
| Escandallos | `EscandallosPage.tsx` | ✅ Migrado |
| Personal | `PersonalPage.tsx` | ✅ Migrado + boton reubicado |
| Almacen | `AlmacenPage.tsx` | ✅ Migrado |
| P&L | `PnLPage.tsx` | ✅ Migrado |
| Configuracion | `RestaurantConfigPage.tsx` | ✅ Migrado |
| Documentos (OCR) | `OCRDocumentList.tsx` | ✅ Migrado + Select→Tabs |

---

## TOKENS CSS USADOS

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-xs` | 8px | Padding minimo |
| `--spacing-sm` | 12px | Gaps pequenos |
| `--spacing-md` | 20px | Margenes estandar |
| `--spacing-lg` | 32px | Separacion de secciones |
| `--background` | #fff | Fondo sticky header |
| `--border` | #e5e7eb | Borde inferior header |

---

## VERIFICACIONES REALIZADAS

1. ✅ `npm run build` - Sin errores
2. ✅ Sticky headers funcionan en todas las secciones
3. ✅ Tab "Recetas" renombrada a "Escandallos"
4. ✅ Boton "Añadir Persona" dentro de su tab
5. ✅ Select en Docs transformado a TabsHorizontal
6. ✅ Altura input/button igualada (44px)
7. ✅ Padding reducido (spacing-md en lugar de spacing-lg)

---

## NOTAS IMPORTANTES PARA PROXIMAS SESIONES

1. **Layout.tsx es critico** - No añadir divs wrapper entre `<main>` y `{children}` o se rompe sticky
2. **StickyPageHeader** - Usar este componente para todas las paginas con listas largas
3. **Tokens CSS** - Usar solo tokens definidos en `index.css` (`--spacing-xs/sm/md/lg`, NO `--spacing-2/3`)
4. **Altura botones** - 44px es el estandar para inputs y botones

---

## RESUMEN DE CAMBIOS POR ARCHIVO

| Archivo | Tipo de Cambio |
|---------|----------------|
| `Layout.tsx` | Eliminar div wrapper (FIX CRITICO) |
| `StickyPageHeader.tsx` | Ajustar margenes |
| `PageHeader.tsx` | Quitar sticky props |
| `TabsHorizontal.tsx` | Quitar sticky props |
| `EscandalloList.tsx` | Fix altura input + marginTop |
| `EscandallosPage.tsx` | Migrar a StickyPageHeader + renombrar tab |
| `PersonalPage.tsx` | Migrar + reubicar boton |
| `AlmacenPage.tsx` | Migrar a StickyPageHeader |
| `PnLPage.tsx` | Migrar a StickyPageHeader |
| `RestaurantConfigPage.tsx` | Migrar + fix sintaxis |
| `OCRDocumentList.tsx` | Migrar + Select→Tabs |
| `MenuAnalysisTab.tsx` | Añadir marginTop |
| `index.css` | Añadir clase .sticky-page-header |

---

*Ultima actualizacion: 2026-01-18*
*Sesion anterior: sesion-002-reorganizacion-ui.md*
