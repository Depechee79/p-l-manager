# 🎨 Sistema de Diseño - Tokens Reference

**Versión**: 1.0  
**Fecha**: 2025-12-30  
**Estado**: Sincronizado ✅

---

## Ubicación de Tokens

| Formato | Ubicación | Uso |
|---------|-----------|-----|
| TypeScript | `src/shared/tokens/*.ts` | Lógica, props, inline styles |
| CSS Variables | `src/shared/styles/tokens.css` | Estilos CSS, clases |
| Legacy CSS | `src/index.css` | Compatibilidad (migrar gradualmente) |

---

## 🎨 Colores

### Principales

| Nombre | CSS Variable | TypeScript | Valor |
|--------|--------------|------------|-------|
| Background | `--background` | `BACKGROUND` | `#f3f4f6` |
| Surface | `--surface` | `SURFACE` | `#ffffff` |
| Surface Muted | `--surface-muted` | `SURFACE_MUTED` | `#f9fafb` |
| Text Main | `--text-main` | `TEXT_MAIN` | `#111827` |
| Text Secondary | `--text-secondary` | `TEXT_SECONDARY` | `#6b7280` |
| Text Light | `--text-light` | `TEXT_LIGHT` | `#9ca3af` |
| Border | `--border` | `BORDER` | `#e5e7eb` |
| Border Focus | `--border-focus` | `BORDER_FOCUS` | `#d1d5db` |

### Semánticos

| Nombre | CSS Variable | TypeScript | Valor |
|--------|--------------|------------|-------|
| Accent | `--accent` | `ACCENT` | `#e11d48` |
| Accent Hover | `--accent-hover` | `ACCENT_HOVER` | `#be123c` |
| Success | `--success` | `SUCCESS` | `#10b981` |
| Warning | `--warning` | `WARNING` | `#f59e0b` |
| Danger | `--danger` | `DANGER` | `#ef4444` |

---

## 📐 Espaciado

| Nombre | CSS Variable | TypeScript | Valor |
|--------|--------------|------------|-------|
| XS | `--spacing-xs` | `SPACING_XS` | `6px` |
| SM | `--spacing-sm` | `SPACING_SM` | `12px` |
| MD | `--spacing-md` | `SPACING_MD` | `20px` |
| LG | `--spacing-lg` | `SPACING_LG` | `32px` |
| XL | `--spacing-xl` | `SPACING_XL` | `48px` |
| 2XL | `--spacing-2xl` | `SPACING_2XL` | `64px` |

---

## 🔵 Border Radius

| Nombre | CSS Variable | TypeScript | Valor |
|--------|--------------|------------|-------|
| Default | `--radius` | `RADIUS` | `12px` |
| SM | `--radius-sm` | `RADIUS_SM` | `6px` |
| LG | `--radius-lg` | `RADIUS_LG` | `16px` |
| Full | `--radius-full` | `RADIUS_FULL` | `9999px` |

---

## 📝 Tipografía

### Familias

| Nombre | CSS Variable | Valor |
|--------|--------------|-------|
| Heading | `--font-heading` | `'Public Sans', sans-serif` |
| Body | `--font-body` | `'Public Sans', sans-serif` |

### Tamaños

| Nombre | CSS Variable | TypeScript | Valor |
|--------|--------------|------------|-------|
| XS | `--font-size-xs` | `FONT_SIZE_XS` | `11px` |
| SM | `--font-size-sm` | `FONT_SIZE_SM` | `13px` |
| Base | `--font-size-base` | `FONT_SIZE_BASE` | `15px` |
| MD | `--font-size-md` | `FONT_SIZE_MD` | `17px` |
| LG | `--font-size-lg` | `FONT_SIZE_LG` | `21px` |
| XL | `--font-size-xl` | `FONT_SIZE_XL` | `28px` |
| 2XL | `--font-size-2xl` | `FONT_SIZE_2XL` | `36px` |
| 3XL | `--font-size-3xl` | `FONT_SIZE_3XL` | `48px` |

---

## 🌑 Sombras

| Nombre | CSS Variable | Valor |
|--------|--------------|-------|
| SM | `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |
| Default | `--shadow` | `0 4px 6px -1px rgba(0, 0, 0, 0.1)...` |
| MD | `--shadow-md` | `0 10px 15px -3px rgba(0, 0, 0, 0.1)...` |
| LG | `--shadow-lg` | `0 20px 25px -5px rgba(0, 0, 0, 0.1)...` |

---

## ⚠️ Regla de Sincronización

**Cuando modifiques un token:**

1. Actualiza `src/shared/tokens/{archivo}.ts`
2. Actualiza `src/shared/styles/tokens.css`
3. Actualiza `src/index.css` (mientras exista)
4. Verifica que la app sigue funcionando

---

**Archivos clave:**
- `src/shared/tokens/index.ts` - Exporta todos los tokens TS
- `src/shared/styles/tokens.css` - Define CSS variables
- `src/index.css` - Variables legacy (migrar gradualmente)
