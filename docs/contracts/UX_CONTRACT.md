# UX Patterns Contract — P&L Antigravity

> **Primary user:** Director de restaurante checking overnight activity from phone/tablet.
> **Secondary user:** Waiter/cook using mobile with one hand during service.
> **Enforced by:** Supreme Rule (`.claude/rules/00-regla-suprema.md`) Section "UX Experience"

---

## 1. Page Archetypes

Every page in the application must follow one of these 7 archetypes. No hybrid pages.

### 1.1 Dashboard

- **Purpose:** At-a-glance overview of operations status.
- **Structure:** KPI cards (top) + activity feed or charts (body) + quick actions.
- **Route:** `/`
- **Key rule:** Data must be real-time or near-real-time. No stale data without indicator.

### 1.2 List + Detail

- **Purpose:** Browse a collection, drill into a single record.
- **Structure:** Filterable/searchable table or card grid. Clicking a row opens a detail view (side panel on desktop, full page on mobile).
- **Routes:** `/almacen`, `/equipo`, `/proveedores`
- **Key rule:** Table on desktop, cards on mobile. Always include empty state.

### 1.3 Wizard

- **Purpose:** Multi-step data entry for complex operations.
- **Structure:** Step indicator (top), form content (body), navigation buttons (bottom: Back + Next/Finish).
- **Routes:** Cierres (4 steps), Escandallos (wizard), Inventarios (wizard)
- **Key rules:**
  - Step indicator shows current/total and step names.
  - Back button always available (except step 1).
  - Data persists between steps (no loss on Back).
  - Final step shows summary before submit.
  - Unsaved changes warning on navigation away.

### 1.4 Config

- **Purpose:** Settings and configuration for the restaurant.
- **Structure:** Grouped settings sections with inline editing or modal forms.
- **Route:** `/configuracion`
- **Key rule:** Protected by `configuracion.edit` permission. Changes take effect immediately with toast confirmation.

### 1.5 Training / Onboarding (Future)

- **Purpose:** Staff training materials, technical sheets, exams, certifications.
- **Structure:** Course-like navigation with progress tracking.
- **Key rule:** Mobile-optimized for staff viewing during breaks.

### 1.6 Checklist (Future)

- **Purpose:** Daily operational checklists (opening, closing, cleaning).
- **Structure:** Checkbox list with optional photo capture and supervisor review.
- **Key rule:** Must work offline-first for areas with poor connectivity.

### 1.7 Report

- **Purpose:** Financial and operational reports for director analysis.
- **Structure:** Date range selector (top) + KPI summary + detailed data table + export action.
- **Routes:** `/pnl`
- **Key rule:** All monetary values formatted with `Intl.NumberFormat('es-ES')`. Export to CSV/PDF.

---

## 2. Mandatory Page States (4 States)

Every page that loads data **must** implement all 4 states. No exceptions.

### 2.1 LOADING

- Display skeleton placeholders matching the layout shape.
- Never show a blank page. Never show a spinner alone.
- Skeleton must match the exact shape of the eventual content (cards skeleton for cards, table rows for tables).

### 2.2 DATA

- Normal state with actual content.
- Data must be formatted correctly (dates in `es-ES`, amounts with currency).

### 2.3 EMPTY

- Shown when query returns zero results.
- Must include:
  - A relevant icon (not a generic empty box).
  - A clear message explaining what would appear here.
  - A CTA button to create the first item (if user has permission).
- Example: "No hay cierres de caja este mes. Pulsa 'Nuevo cierre' para registrar uno."

### 2.4 ERROR

- Shown when data fetch fails.
- Must include:
  - Error icon.
  - User-friendly message (never raw error codes).
  - "Reintentar" (Retry) button.
  - If persistent, suggest contacting support.

```tsx
// Pattern for all async pages
if (loading) return <PageSkeleton />;
if (error) return <ErrorState message={error} onRetry={refetch} />;
if (data.length === 0) return <EmptyState icon={...} message={...} ctaLabel={...} onCta={...} />;
return <DataView data={data} />;
```

---

## 3. Async Action Phases (3 Phases)

Every button that triggers a server operation follows this pattern:

### Phase 1: IDLE
- Button is enabled, shows its label.
- Clicking transitions to LOADING.

### Phase 2: LOADING
- Button shows a spinner and becomes disabled.
- Label changes to action-in-progress text (e.g., "Guardando...").
- No double-submit possible.

### Phase 3: RESULT
- **Success:** Toast with confirmation message. UI updates to reflect new state.
- **Error:** Toast with error message. Button returns to IDLE for retry.

```tsx
const [saving, setSaving] = useState(false);

async function handleSave() {
  setSaving(true);
  try {
    await saveData(formData);
    showToast({ type: 'success', message: 'Cierre guardado correctamente' });
  } catch (error: unknown) {
    logError(error, { context: 'save-cierre' });
    showToast({ type: 'error', message: 'Error al guardar el cierre. Intenta de nuevo.' });
  } finally {
    setSaving(false);
  }
}
```

---

## 4. Destructive Actions

Any action that deletes data or is irreversible requires a **confirmation modal** with:

- **Title:** Specific action name (not "Are you sure?").
  - Correct: "Eliminar cierre del 15/03/2026"
  - Wrong: "Confirmar accion"
- **Body:** Explains consequences.
- **Confirm button:** Red, repeats the action verb ("Eliminar", "Anular").
- **Cancel button:** Ghost/outline style, positioned left of confirm.

```
+------------------------------------------+
|  Eliminar cierre del 15/03/2026          |
|                                          |
|  Esta accion no se puede deshacer.       |
|  Se eliminaran todos los datos de este   |
|  cierre de caja.                         |
|                                          |
|  [ Cancelar ]          [ Eliminar ]      |
+------------------------------------------+
```

---

## 5. Wizard Patterns

### 5.1 General Rules
- Step indicator visible at all times (top of wizard).
- Navigation: "Anterior" (left) + "Siguiente" / "Finalizar" (right).
- "Siguiente" validates current step before advancing. Inline errors on failure.
- "Anterior" preserves all entered data (no reset).
- Exit confirmation if there are unsaved changes.

### 5.2 Cierre de Caja Wizard (4 Steps)
1. **Metodos de pago** — Cash, card terminals, other methods.
2. **Delivery** — Third-party platform income (Glovo, Uber Eats, etc.).
3. **Resumen** — Calculated totals, variance detection.
4. **Confirmacion** — Final review and submit.

### 5.3 Escandallo Wizard
- Recipe name and category.
- Ingredients with quantities, units, and costs.
- Yield and portion cost calculation.
- Margin targets and selling price suggestion.

### 5.4 Inventario Wizard
- Select inventory zone (bar, cocina, camara, almacen).
- Product list with current stock and count entry.
- Variance detection (counted vs. expected).
- Submit with optional notes.

---

## 6. Mobile-First Patterns

The app is designed for restaurant staff using phones during service. Every UI decision must respect this.

### 6.1 One-Hand Operation
- Primary actions reachable with thumb (bottom of screen).
- Bottom navigation for main sections.
- No critical actions in top-right corner on mobile.

### 6.2 Touch Targets
- All interactive elements: **minimum 44x44px**.
- Spacing between tap targets: minimum 8px to prevent mis-taps.

### 6.3 Scrolling
- **No nested scrolling.** One scroll direction per view.
- **No horizontal scroll on tables.** Either make columns responsive or switch to card layout on mobile.
- Long forms: vertical scroll only, sticky submit button at bottom.

### 6.4 Card Nesting
- **Maximum 2 levels of Card nesting.** Never Card > Card > Card.
- On mobile, prefer flat layouts with dividers over nested cards.

### 6.5 Modal Behavior
- **No modal-over-modal.** If a modal needs another modal, close the first.
- On mobile, modals should be full-screen (bottom sheet pattern acceptable).
- Close with X button, backdrop tap, or swipe down.

---

## 7. Navigation Patterns

### 7.1 Back Button
- Always present on detail/edit pages.
- Returns to the previous list/page (not browser history).
- On mobile: top-left arrow icon. On desktop: text link "Volver".

### 7.2 Tab Navigation
- Used within pages for sub-sections (e.g., Almacen has 6 tabs).
- Tabs: Existencias, Inventarios, Mermas, Pedidos, Proveedores, Traspasos.
- Active tab has accent underline indicator.
- Tab content changes without page reload.
- On mobile: horizontally scrollable tab bar if too many tabs.

### 7.3 Sidebar Navigation (Desktop)
- Collapsible sidebar with module icons and labels.
- Active page highlighted with accent indicator.
- Collapsed state shows icons only.

### 7.4 Bottom Navigation (Mobile)
- Maximum 5 items visible.
- "More" overflow menu for additional pages.
- Active item has accent color indicator.

---

## 8. Data Display Patterns

### 8.1 Tables
- Desktop: full table with sortable column headers.
- Mobile: cards or simplified 2-column layout.
- Always include row count indicator.
- Pagination or infinite scroll for large datasets (never load unbounded).

### 8.2 Monetary Values
- Format: `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.
- Display: `1.234,56 EUR` (Spanish locale).
- Positive values in `--text-main`. Negative values in `--danger`.

### 8.3 Dates
- Format: `dd/MM/yyyy` for display, `dd/MM/yyyy HH:mm` with time.
- Relative dates for recent items: "Hace 2 horas", "Ayer".
- Always use `es-ES` locale.

### 8.4 Empty States
- Icon + message + CTA pattern (see Section 2.3).
- Empty states are not errors. They are invitations to act.
- Tone: helpful and encouraging, not apologetic.

---

## 9. Verification Checklist

Before any PR that changes user-facing behavior:

- [ ] All 4 page states implemented (LOADING, DATA, EMPTY, ERROR)
- [ ] All async actions follow 3-phase pattern (IDLE, LOADING, RESULT)
- [ ] Destructive actions have specific confirmation modals
- [ ] No nested scrolling anywhere in the flow
- [ ] No triple Card nesting
- [ ] No modal-over-modal
- [ ] Touch targets are 44px minimum
- [ ] Wizard steps preserve data on Back navigation
- [ ] Empty states have icon + message + CTA
- [ ] Mobile view tested (responsive layout, bottom nav)
- [ ] Monetary values use `Intl.NumberFormat` with `es-ES` locale
- [ ] Dates use `es-ES` locale formatting
