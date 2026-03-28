---
description: "Design system rules. CSS tokens, colors, typography, component library, mobile-first."
paths:
  - "src/shared/**/*"
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Design System Rules -- P&L Manager

## Source of Truth

All design tokens are defined in `src/shared/styles/tokens.css` as CSS custom properties. Tailwind classes consume these tokens. Never bypass the token layer.

## Color System

### Brand Colors

| Token            | Value     | Usage                                |
|------------------|-----------|--------------------------------------|
| `--primary`      | `#111827` | Gray 900 -- primary text, headings   |
| `--primary-light`| `#374151` | Gray 700 -- secondary text           |
| `--accent`       | `#e11d48` | Rose 600 -- CTAs, active states      |
| `--accent-hover` | `#be123c` | Rose 700 -- hover state for accent   |
| `--accent-light` | `#fff1f2` | Rose 50 -- accent backgrounds        |

### Semantic Colors

| Token              | Value     | Usage                            |
|--------------------|-----------|----------------------------------|
| `--success`        | `#16a34a` | Green 600 -- positive states     |
| `--success-light`  | `#f0fdf4` | Green 50 -- success backgrounds  |
| `--warning`        | `#d97706` | Amber 600 -- caution states      |
| `--warning-light`  | `#fffbeb` | Amber 50 -- warning backgrounds  |
| `--danger`         | `#dc2626` | Red 600 -- destructive, errors   |
| `--danger-light`   | `#fef2f2` | Red 50 -- error backgrounds      |
| `--info`           | `#2563eb` | Blue 600 -- informational        |
| `--info-light`     | `#eff6ff` | Blue 50 -- info backgrounds      |

### Surface Colors

| Token              | Value     | Usage                            |
|--------------------|-----------|----------------------------------|
| `--bg`             | `#ffffff` | Page background                  |
| `--bg-subtle`      | `#f9fafb` | Gray 50 -- secondary background  |
| `--bg-muted`       | `#f3f4f6` | Gray 100 -- muted background     |
| `--border`         | `#e5e7eb` | Gray 200 -- borders, dividers    |
| `--border-strong`  | `#d1d5db` | Gray 300 -- emphasized borders   |

### ZERO TOLERANCE Rules

- **No hardcoded hex/rgb colors** in className or inline styles. Use tokens.
- **No gray-\*/zinc-\*/slate-\*/neutral-\* Tailwind classes** unless mapped through tokens.
- **No opacity hacks** like `bg-black/10`. Use semantic tokens.

## Typography

### Font Family

- **Heading and body:** Public Sans (`--font-sans`)
- Loaded via Google Fonts or local woff2 files.

### Type Scale

| Token          | Size   | Weight | Usage                    |
|----------------|--------|--------|--------------------------|
| `--text-xs`    | 12px   | 400    | Captions, metadata       |
| `--text-sm`    | 14px   | 400    | Secondary text, labels   |
| `--text-base`  | 16px   | 400    | Body text                |
| `--text-lg`    | 18px   | 500    | Subheadings              |
| `--text-xl`    | 20px   | 600    | Section titles           |
| `--text-2xl`   | 24px   | 700    | Page titles              |
| `--text-3xl`   | 30px   | 700    | Hero headings            |

**Rule:** Never use arbitrary font sizes like `text-[13px]`. Use the scale tokens.

## Z-Index Scale

All z-index values MUST use the defined scale. Never use raw numbers.

| Token              | Value | Usage                              |
|--------------------|-------|------------------------------------|
| `--z-dropdown`     | 100   | Dropdown menus, select options     |
| `--z-sticky`       | 200   | Sticky headers, toolbars           |
| `--z-fixed`        | 300   | Fixed elements, floating buttons   |
| `--z-modal-backdrop` | 400 | Modal overlay/backdrop             |
| `--z-modal`        | 500   | Modal content                      |
| `--z-popover`      | 600   | Popovers, tooltips with content    |
| `--z-tooltip`      | 700   | Simple tooltips                    |
| `--z-toast`        | 800   | Toast notifications (always on top)|

```typescript
// CORRECT
className="z-[var(--z-modal)]"
// or via Tailwind config mapping

// WRONG
className="z-50"
className="z-[9999]"
```

## Shadows

Use shadow tokens exclusively. Never write shadow utilities directly.

| Token            | Usage                              |
|------------------|------------------------------------|
| `--shadow-sm`    | Subtle depth (cards at rest)       |
| `--shadow`       | Default depth (elevated cards)     |
| `--shadow-md`    | Medium depth (dropdowns)           |
| `--shadow-lg`    | High depth (modals, popovers)      |

```typescript
// CORRECT
className="shadow-[var(--shadow-md)]"
// or via Tailwind shadow mapping in config

// WRONG
className="shadow-md"
className="shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
```

## Border Radius

Use radius tokens for consistency.

| Token            | Value | Usage                      |
|------------------|-------|----------------------------|
| `--radius-sm`    | 4px   | Small elements, badges     |
| `--radius`       | 8px   | Default (cards, inputs)    |
| `--radius-md`    | 12px  | Medium elements            |
| `--radius-lg`    | 16px  | Large containers, modals   |
| `--radius-full`  | 9999px| Circular (avatars, pills)  |

## Spacing

Follow Tailwind's 4px base scale. For layout-level spacing, use consistent patterns:

- **Section gap:** `gap-6` (24px)
- **Card padding:** `p-4` (16px) desktop, `p-3` (12px) mobile
- **Form field gap:** `gap-4` (16px)
- **Inline element gap:** `gap-2` (8px)

## Component Library

### Core Components (src/shared/components/)

| Component      | Purpose                              | Key Props                      |
|----------------|--------------------------------------|--------------------------------|
| `Button`       | Primary action button                | variant, size, loading, icon   |
| `ButtonV2`     | Enhanced button with icon support    | variant, size, loading, leftIcon, rightIcon |
| `Card`         | Content container                    | padding, hoverable, bordered   |
| `Input`        | Text input field                     | label, error, helper, icon     |
| `Select`       | Dropdown select                      | options, value, onChange, error |
| `Modal`        | Dialog overlay with sections         | open, onClose, title, size, footer |
| `Badge`        | Status/category indicator            | variant, size                  |
| `FormField`    | Form field wrapper with label/error  | label, error, required         |
| `FormSection`  | Grouping for related form fields     | title, description             |
| `DatePicker`   | Date selection input                 | value, onChange, min, max      |
| `DataTable`    | Sortable, filterable data table      | columns, data, onSort          |
| `Tabs`         | Tab navigation                       | tabs, activeTab, onChange       |
| `Toast`        | Notification toast                   | message, type, duration        |

### Usage Rules

- Always check if a shared component exists before creating a new one.
- New shared components require: TypeScript interface for props, consistent with existing patterns, accessible (ARIA).
- Components MUST be accessible: proper ARIA attributes, keyboard navigation, focus management.

## Layout System

### AppShellV2

The main layout wrapper providing:
- **Topbar:** 64px fixed height (`--topbar-height: 64px`)
- **Sidebar:** 256px width on desktop (`--sidebar-width: 256px`), hidden on mobile
- **Content area:** Fills remaining space with scroll

```typescript
<AppShellV2>
  <PageContent />
</AppShellV2>
```

### Responsive Breakpoints

| Breakpoint | Width   | Target                    |
|------------|---------|---------------------------|
| `sm`       | 640px   | Large phones (landscape)  |
| `md`       | 768px   | Tablets                   |
| `lg`       | 1024px  | Small desktops            |
| `xl`       | 1280px  | Large desktops            |

**Mobile-first:** Write base styles for mobile, then add `md:` and `lg:` overrides.

## Mobile-First Rules

### Touch Targets

All interactive elements MUST have a minimum touch target of 44x44px:

```typescript
// CORRECT
className="min-h-11 min-w-11"  // 44px

// WRONG -- too small for touch
className="h-8 w-8"  // 32px, inaccessible on mobile
```

### Mobile Spacing

- Reduce padding on mobile: `p-3 md:p-4 lg:p-6`
- Stack columns: `flex flex-col md:flex-row`
- Full-width buttons on mobile: `w-full md:w-auto`
- Hide non-essential elements: `hidden md:block`

### Mobile Patterns

- Tables convert to card lists on mobile.
- Modals become full-screen on mobile (`md:max-w-lg`).
- Sidebar collapses to hamburger menu.
- Forms stack vertically with full-width inputs.

## Forbidden Patterns

| Pattern                          | Replacement                        |
|----------------------------------|------------------------------------|
| `text-gray-500`                  | Use `text-[var(--primary-light)]` or semantic token |
| `bg-zinc-100`                    | Use `bg-[var(--bg-muted)]`         |
| `z-50`, `z-[9999]`              | Use z-index scale tokens           |
| `shadow-md` directly             | Use shadow tokens                  |
| `rounded-lg` without token       | Use radius tokens                  |
| Inline `style={{ color: '#xxx' }}` | Use CSS tokens via className     |
| `text-[13px]` arbitrary sizes    | Use type scale tokens              |
| `font-arial`, `font-helvetica`   | Use `--font-sans` (Public Sans)    |
