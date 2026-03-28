# Visual Design Contract — P&L Antigravity

> **Source of truth:** `src/shared/styles/tokens.css` (CSS custom properties)
> **TypeScript mirror:** `src/shared/tokens/` (programmatic access)
> **Enforced by:** Supreme Rule (`.claude/rules/00-regla-suprema.md`) Section "UI Visual"

---

## 1. Color System

### 1.1 Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f3f4f6` (Cool Gray 100) | App background, page canvas |
| `--surface` | `#ffffff` | Cards, modals, panels |
| `--surface-muted` | `#f9fafb` (Cool Gray 50) | Subtle surface, alternating rows |

### 1.2 Text

| Token | Value | Usage |
|-------|-------|-------|
| `--text-main` | `#111827` (Gray 900) | Headings, primary content |
| `--text-secondary` | `#4b5563` (Gray 600) | Descriptions, secondary info. WCAG AA compliant. |
| `--text-light` | `#9ca3af` (Gray 400) | Placeholders, timestamps, metadata |

### 1.3 Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--border` | `#e5e7eb` (Gray 200) | Card borders, dividers, input borders |
| `--border-focus` | `#d1d5db` (Gray 300) | Focus state on non-accent inputs |

### 1.4 Primary (Brand)

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#111827` (Gray 900) | Primary buttons, nav active states |
| `--primary-hover` | `#374151` (Gray 700) | Primary button hover |
| `--primary-light` | `#f3f4f6` (Gray 100) | Primary ghost button background |

### 1.5 Accent (CTA)

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#e11d48` (Rose 600) | CTA buttons, links, active indicators |
| `--accent-hover` | `#be123c` (Rose 700) | Accent hover state |

TS tokens also provide `ACCENT_SHADOW` (`rgba(225,29,72,0.3)`) and `ACCENT_FOCUS_RING` (`rgba(225,29,72,0.1)`).

### 1.6 Semantic Colors

| Token | Value | Background | Border | Usage |
|-------|-------|-----------|--------|-------|
| `--success` | `#10b981` (Emerald 500) | `#ecfdf5` | `#d1fae5` | Confirmed, saved, positive KPI |
| `--warning` | `#f59e0b` (Amber 500) | `#fffbeb` | `#fef3c7` | Pending action, threshold warning |
| `--danger` | `#ef4444` (Red 500) | `#fef2f2` | `#fecaca` | Error, delete, negative KPI |
| `--info` | `#3b82f6` (Blue 500) | `#eff6ff` | `#dbeafe` | Informational, neutral highlight |

Semantic background/border tokens are in `src/shared/tokens/colors.ts` (e.g., `SUCCESS_BG`, `WARNING_BORDER`).

### 1.7 Absolute Rules

- **NEVER** use raw hex values in components. Always reference CSS custom properties or TS token constants.
- **NEVER** use Tailwind color utilities like `gray-500`, `red-600` directly. Use the token system.
- **NEVER** rely on color alone to convey meaning. Pair with icon + text.

---

## 2. Typography

### 2.1 Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-heading` | `'Public Sans', sans-serif` | All headings (h1-h6) |
| `--font-body` | `'Public Sans', sans-serif` | Body text, inputs, labels |

Loaded via Google Fonts: `Public+Sans:wght@300;400;500;600;700`.

### 2.2 Font Size Scale

| CSS Token | Value | TS Constant | Usage |
|-----------|-------|-------------|-------|
| `--font-size-xs` | `10px` | `FONT_SIZE_XS` (11px*) | Micro labels, badges |
| `--font-size-sm` | `12px` | `FONT_SIZE_SM` (13px*) | Labels, secondary text, filters |
| `--font-size-base` | `14px` | `FONT_SIZE_BASE` (15px*) | Body, tabs, inputs |
| `--font-size-md` | `16px` | `FONT_SIZE_MD` (17px*) | Small headings |
| `--font-size-lg` | `20px` | `FONT_SIZE_LG` (21px*) | Section titles |
| `--font-size-xl` | `24px` | `FONT_SIZE_XL` (28px*) | Page titles |
| `--font-size-2xl` | `32px` | `FONT_SIZE_2XL` (36px*) | Hero headings |
| `--font-size-3xl` | `40px` | `FONT_SIZE_3XL` (48px*) | Display text |

> *Note: CSS tokens and TS tokens have slight discrepancies. CSS tokens (in `index.css`) are the authoritative values for rendering. TS tokens are used for programmatic/inline style calculations.

### 2.3 Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Decorative, large display text |
| Regular | 400 | Body text, descriptions |
| Medium | 500 | Labels, table headers, form labels |
| Semibold | 600 | Subheadings, card titles |
| Bold | 700 | Page headings, KPI values |

### 2.4 Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `LINE_HEIGHT_DEFAULT` | 1.5 | Body text |
| `LINE_HEIGHT_HEADING` | 1.25 | Headings |
| `LINE_HEIGHT_TIGHT` | 1.2 | Large display text, KPI numbers |

### 2.5 Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `LETTER_SPACING_LABEL` | `0.05em` | Uppercase labels, badge text |

---

## 3. Shadows & Elevation

| Token | CSS Value | Elevation | Usage |
|-------|-----------|-----------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgba(0,0,0,0.05)` | 1 | Subtle cards, inputs |
| `--shadow` | `0 4px 6px -1px rgba(0,0,0,0.1), ...` | 2 | Standard cards, containers |
| `--shadow-md` | `0 10px 15px -3px rgba(0,0,0,0.1), ...` | 3 | Dropdowns, popovers |
| `--shadow-lg` | `0 20px 25px -5px rgba(0,0,0,0.1), ...` | 4 | Modals, floating elements |
| `SHADOW_ACCENT` | `0 4px 12px rgba(225,29,72,0.3)` | Special | Accent CTA buttons |
| `SHADOW_FOCUS_RING` | `0 0 0 3px rgba(225,29,72,0.1)` | Special | Focus rings |

**Rules:**
- **NEVER** use Tailwind `shadow-sm`, `shadow-md`, `shadow-lg` directly. Use `var(--shadow-sm)` etc.
- Elevation increases with interaction importance: resting card (1) < dropdown (3) < modal (4).

---

## 4. Z-Index Scale

| Level | Value | Usage |
|-------|-------|-------|
| Dropdown | `100` | Select menus, autocomplete |
| Sticky | `200` | Sticky headers, table headers |
| Fixed | `300` | Fixed sidebar, bottom nav |
| Modal backdrop | `400` | Dark overlay behind modals |
| Modal | `500` | Modal dialogs |
| Popover | `600` | Tooltips triggered by click |
| Tooltip | `700` | Hover tooltips |
| Toast | `800` | Notification toasts |

**Rule:** NEVER use arbitrary z-index values. Only these 7 levels.

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `RADIUS_SM` / `--radius` (8px context) | `8px` | Buttons, inputs, small elements |
| `RADIUS` / `--radius` | `12px` | Cards, modals, panels |
| `RADIUS_LG` | `16px` | Large containers, hero sections |
| `RADIUS_FULL` | `50%` | Avatars, circular badges |

---

## 6. Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | `6px` | Tight gaps (icon-to-text, badge padding) |
| `--spacing-sm` | `12px` | Inner card padding, form gaps |
| `--spacing-md` | `20px` | Default gap between sections |
| `--spacing-lg` | `32px` | Major section separators |
| `--spacing-xl` | `48px` | Page-level vertical spacing |
| `--spacing-2xl` | `64px` | Hero sections, major vertical breaks |

---

## 7. Component Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--height-input` | `44px` | Inputs, default buttons (44px touch target) |
| `--height-button-sm` | `36px` | Small/compact buttons |
| `HEIGHT_MOBILE_HEADER` | `60px` | Mobile top bar |
| `SIZE_STEP_NUMBER` | `36px` | Wizard step indicators |

---

## 8. Interaction States

### 8.1 Touch Targets
- **Minimum 44x44px** on all interactive elements (buttons, links, checkboxes, toggles).
- This is non-negotiable: the app is used by waiters with one hand on a phone in service.

### 8.2 Focus Rings
- Visible on **ALL** interactive elements (buttons, inputs, links, tabs, checkboxes).
- Style: `box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.1)` (accent focus ring).
- NEVER remove `outline` without providing an equivalent visible indicator.

### 8.3 Transitions
- All hover/focus state changes must have `transition: all 200ms ease` (or the specific property variant).
- No abrupt visual changes. Use `TRANSITION_DEFAULT` or `TRANSITION_COLORS`.
- Duration scale: fast (150ms), default (200ms), medium (300ms), slow (500ms).

---

## 9. Component-Specific Styles

### Button
- Height: `44px` (default), `36px` (small)
- Border radius: `8px`
- Primary: `bg: --primary`, `color: white`, hover: `--primary-hover`
- Accent: `bg: --accent`, `color: white`, hover: `--accent-hover`, shadow: `SHADOW_ACCENT`
- Ghost: `bg: transparent`, `border: 1px solid --border`, hover: `bg: --surface-muted`
- Disabled: `opacity: 0.5`, `cursor: not-allowed`

### Card
- Background: `--surface`
- Border: `1px solid --border`
- Border radius: `--radius` (12px)
- Shadow: `--shadow-sm` (resting), `--shadow` (hover, if interactive)
- Padding: `--spacing-md` (20px)

### Input
- Height: `--height-input` (44px)
- Border: `1px solid --border`
- Border radius: `8px`
- Focus: `border-color: --accent` + `box-shadow: SHADOW_FOCUS_RING`
- Placeholder color: `--text-light`

### Modal
- Background: `--surface`
- Border radius: `--radius` (12px)
- Shadow: `--shadow-lg`
- Z-index: `500` (backdrop: `400`)
- Backdrop: `rgba(0, 0, 0, 0.5)`

### Badge
- Font size: `--font-size-xs`
- Letter spacing: `LETTER_SPACING_LABEL`
- Border radius: `RADIUS_FULL` (pill shape)
- Semantic variants: success/warning/danger/info with matching bg + text colors

---

## 10. Responsive Breakpoints

| Name | Value | Target |
|------|-------|--------|
| `xs` | `480px` | Small phones |
| `sm` | `640px` | Phones |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Tablets landscape / small desktop |
| `xl` | `1280px` | Desktop |
| `2xl` | `1536px` | Large desktop |

Approach: **Mobile-first** (`min-width` media queries). Use `max-width` only for mobile-specific overrides (`MQ_MAX_MD`, `MQ_MAX_LG`).

---

## 11. Executable Verification Checklist

Before any PR that touches visual code, verify:

- [ ] All colors reference CSS custom properties or TS token constants (zero raw hex)
- [ ] All shadows use token system (`var(--shadow-*)` or TS constants)
- [ ] All z-index values come from the 7-level scale
- [ ] All spacing uses token values (no arbitrary px values)
- [ ] All interactive elements have 44x44px minimum touch target
- [ ] All interactive elements have visible focus ring
- [ ] All hover/focus transitions use token durations (no abrupt changes)
- [ ] Typography uses `--font-heading` or `--font-body` (no arbitrary font-family)
- [ ] Font sizes reference the token scale (no arbitrary px)
- [ ] Border radius uses token values
- [ ] WCAG AA contrast met on all text (especially `--text-secondary` on `--surface`)
- [ ] No Tailwind color utilities bypassing the token system
