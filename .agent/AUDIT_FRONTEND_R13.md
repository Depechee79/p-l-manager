# 🔴 AUDITORÍA FRONTEND R-12/R-13 - PENDIENTE DE EJECUCIÓN

**Fecha Auditoría**: 2026-01-01  
**Estado**: ⏳ PENDIENTE DE REPARACIÓN  
**Prioridad**: ALTA  

---

## 📋 REGLAS VIOLADAS

### R-12: Buscar TODOS los Casos
> Cuando se identifica un patrón problemático, buscar TODAS las instancias en el codebase antes de arreglar.

### R-13: Coherencia Absoluta del Frontend
> Todo el código y diseño frontend debe ser coherente a nivel visual, estructural y de código.

---

## 📊 RESUMEN DE VIOLACIONES

| Categoría | Archivos | Instancias | Prioridad |
|-----------|----------|------------|-----------|
| Elementos HTML raw | 11 | 15+ | ALTA |
| Imports legacy | 6 | 6 | MEDIA |
| Layout inconsistente | 4+ | N/A | ALTA |
| Valores hardcoded | 30+ | 300+ | ALTA |
| **TOTAL** | **40+** | **400+** | - |

---

## 🔴 CATEGORÍA 1: ELEMENTOS HTML RAW

**Problema**: Uso de `<input>`, `<select>`, `<button>` raw en lugar de componentes del sistema de diseño.

### Lista de violaciones:

| Archivo | Línea | Elemento | Reemplazar Por |
|---------|-------|----------|----------------|
| `src/pages/RolesAdminPage.tsx` | 198 | `<input>` | `<Input>` |
| `src/pages/PnLPage.tsx` | 112 | `<input>` | `<Input>` |
| `src/pages/InvoicesPage.tsx` | 158 | `<input type="month">` | `<DatePicker>` custom |
| `src/pages/PnLPage.tsx` | 121 | `<select>` | `<Select>` |
| `src/pages/DeliveryPage.tsx` | 126 | `<select>` | `<Select>` |
| `src/pages/DeliveryPage.tsx` | 193 | `<select>` | `<Select>` |
| `src/pages/DashboardPage.tsx` | 69 | `<button>` | `<Button>` |
| `src/pages/RolesAdminPage.tsx` | 117 | `<button>` | `<Button>` |
| `src/features/ocr/components/OCRWizard.tsx` | 358 | `<button>` | `<Button>` |
| `src/features/ocr/components/OCRDocumentDetail.tsx` | 82 | `<button>` | `<Button>` |
| `src/features/escandallos/components/wizard/EscandalloWizard.tsx` | 114 | `<button>` | `<Button>` |

### Comando para encontrar más:
```bash
grep -rn "<input" src/pages --include="*.tsx"
grep -rn "<select" src/pages --include="*.tsx"
grep -rn "<button" src/pages src/features --include="*.tsx"
```

---

## 🔴 CATEGORÍA 2: IMPORTS LEGACY

**Problema**: Algunos archivos usan `from '../components'` en lugar de `from '@shared/components'`.

### Lista de violaciones:

| Archivo | Import Actual | Debe Ser |
|---------|---------------|----------|
| `src/pages/TransfersPage.tsx` | `from '../components'` | `from '@shared/components'` |
| `src/pages/PnLPage.tsx` | `from '../components'` | `from '@shared/components'` |
| `src/pages/MermasPage.tsx` | `from '../components'` | `from '@shared/components'` |
| `src/pages/MenuEngineeringPage.tsx` | `from '../components'` | `from '@shared/components'` |
| `src/pages/DiagnosticsPage.tsx` | `from '../components'` | `from '@shared/components'` |
| `src/pages/DeliveryPage.tsx` | `from '../components'` | `from '@shared/components'` |

### Comando para encontrar más:
```bash
grep -rn "from '../components'" src/pages --include="*.tsx"
grep -rn "from '../../components'" src/features --include="*.tsx"
```

---

## 🔴 CATEGORÍA 3: LAYOUTS DE PÁGINA INCONSISTENTES

**Problema**: Las páginas no siguen un patrón estructural uniforme.

### Patrón Correcto (ejemplo: OrdersPage):
```tsx
<PageContainer>
  <PageHeader 
    title="Título" 
    description="Descripción"
    action={<Button>Acción</Button>}
  />
  <FilterBar>
    <Input ... />
    <Select ... />
  </FilterBar>
  <Table ... />
</PageContainer>
```

### Páginas que NO siguen el patrón:

| Página | Problema |
|--------|----------|
| `InvoicesPage.tsx` | Sin título, filtros inline sin Card, padding hardcoded |
| `DiagnosticsPage.tsx` | Header con estilos inline diferentes, padding hardcoded |
| `DeliveryPage.tsx` | Sin header estándar, raw selects, estructura diferente |
| `CierresPage.tsx` | Padding hardcoded, estructura diferente |

### Componentes estándar creados (ya existen):
- `src/shared/components/layout/PageHeader.tsx` ✅
- `src/shared/components/layout/PageContainer.tsx` ✅
- `src/shared/components/layout/FilterBar.tsx` ✅

---

## 🔴 CATEGORÍA 4: VALORES HARDCODED

### 4.1 backgroundColor: 'white' (debe ser var(--surface))

| Archivo | Línea |
|---------|-------|
| `src/pages/DeliveryPage.tsx` | 187 |
| `src/features/invoices/components/InvoicesList.tsx` | 111 |
| `src/features/invoices/components/InvoiceForm.tsx` | 62 |

### 4.2 boxShadow hardcoded (debe ser var(--shadow))

| Archivo | Línea | Valor |
|---------|-------|-------|
| `src/pages/DeliveryPage.tsx` | 187 | `'0 1px 3px rgba(0,0,0,0.1)'` |
| `src/features/invoices/components/InvoiceForm.tsx` | 62 | mismo |

### 4.3 padding hardcoded (87+ instancias)

**Archivos más afectados:**
- `src/pages/DiagnosticsPage.tsx` - 15+ ocurrencias
- `src/pages/DeliveryPage.tsx` - 10+ ocurrencias
- `src/features/ocr/components/*.tsx` - 20+ ocurrencias

**Mapping de valores:**
| Hardcoded | Token |
|-----------|-------|
| `'4px'` | `var(--spacing-2xs)` |
| `'8px'` | `var(--spacing-1)` |
| `'12px'` | `var(--spacing-sm)` |
| `'16px'` | `var(--spacing-2)` |
| `'24px'` | `var(--spacing-3)` |
| `'32px'` | `var(--spacing-lg)` |

### 4.4 fontSize hardcoded (141+ instancias)

**Archivos más afectados:**
- `src/pages/DiagnosticsPage.tsx` - 40+ ocurrencias
- `src/pages/DeliveryPage.tsx` - 20+ ocurrencias
- `src/shared/components/layout/*.tsx` - 15+ ocurrencias

**Mapping de valores:**
| Hardcoded | Token |
|-----------|-------|
| `'10px'` | `var(--font-size-2xs)` |
| `'11px'` | `var(--font-size-xs)` |
| `'12px'` | `var(--font-size-sm)` |
| `'14px'` | `var(--font-size-base)` |
| `'16px'` | `var(--font-size-md)` |
| `'18px'` | `var(--font-size-lg)` |
| `'20px'` | `var(--font-size-xl)` |
| `'24px'` | `var(--font-size-2xl)` |
| `'28px'` | `var(--font-size-3xl)` |

### 4.5 gap hardcoded (88+ instancias)

Mismo mapping que padding.

### 4.6 borderRadius hardcoded (26+ instancias)

| Hardcoded | Token |
|-----------|-------|
| `'4px'` | `var(--radius-xs)` |
| `'6px'` | `var(--radius-sm)` |
| `'8px'` | `var(--radius)` |
| `'10px'` | `var(--radius-md)` |
| `'12px'` | `var(--radius-lg)` |

---

## ✅ TOKENS YA EXPANDIDOS

Los tokens en `src/shared/styles/tokens.css` ya fueron actualizados para cubrir todos los valores:

```css
/* Spacing */
--spacing-2xs: 4px;
--spacing-xs: 6px;
--spacing-1: 8px;
--spacing-sm: 12px;
--spacing-2: 16px;
--spacing-md: 20px;
--spacing-3: 24px;
--spacing-lg: 32px;
--spacing-xl: 48px;
--spacing-2xl: 64px;

/* Font Size */
--font-size-2xs: 10px;
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-13: 13px;
--font-size-base: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-2xl: 24px;
--font-size-3xl: 28px;
--font-size-4xl: 32px;

/* Border Radius */
--radius-xs: 4px;
--radius-sm: 6px;
--radius: 8px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-xl: 16px;
```

---

## 🎯 ORDEN DE EJECUCIÓN RECOMENDADO

### Fase 1: Estructura (más impacto visual)
1. Aplicar `PageHeader`, `PageContainer`, `FilterBar` a todas las páginas
2. Estandarizar estructura de InvoicesPage, DiagnosticsPage, DeliveryPage, CierresPage

### Fase 2: Elementos Raw → Componentes
1. Reemplazar todos los `<input>` → `<Input>`
2. Reemplazar todos los `<select>` → `<Select>`
3. Reemplazar todos los `<button>` → `<Button>`

### Fase 3: Imports
1. Cambiar todos `from '../components'` → `from '@shared/components'`

### Fase 4: Tokenización (más numerosa)
1. `backgroundColor: 'white'` → `var(--surface)`
2. `boxShadow` hardcoded → `var(--shadow)`
3. Todos los `padding`, `margin`, `gap` → tokens
4. Todos los `fontSize` → tokens
5. Todos los `borderRadius` → tokens

### Fase 5: Verificación
1. Ejecutar `npm run build` para verificar compilación
2. Revisión visual en navegador de todas las páginas
3. Verificar que no queden valores hardcoded

---

## 📁 ARCHIVOS DE REFERENCIA

- Tokens: `src/shared/styles/tokens.css`
- Componentes layout: `src/shared/components/layout/`
- Reglas: `.agent/RULES.md` (R-12, R-13)
