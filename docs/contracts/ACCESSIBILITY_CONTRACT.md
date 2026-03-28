# Accessibility Contract

> Source of truth for all accessibility standards in the P&L Manager project.
> Every component, page, and interaction MUST comply with this contract.

---

## Table of Contents

1. [Target Standard](#target-standard)
2. [Target Users and Context](#target-users-and-context)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Form Accessibility](#form-accessibility)
5. [Color and Contrast](#color-and-contrast)
6. [Touch Targets](#touch-targets)
7. [Focus Management](#focus-management)
8. [Modal and Dialog Patterns](#modal-and-dialog-patterns)
9. [Images and Icons](#images-and-icons)
10. [Live Regions and Notifications](#live-regions-and-notifications)
11. [Skip Navigation](#skip-navigation)
12. [Tables and Data](#tables-and-data)
13. [Responsive and Mobile](#responsive-and-mobile)
14. [Component Checklist](#component-checklist)
15. [Testing](#testing)

---

## Target Standard

| Standard   | Level | Status     |
| ---------- | ----- | ---------- |
| WCAG 2.2   | AA    | Mandatory  |
| WCAG 2.2   | AAA   | Aspirational (not required) |
| ARIA 1.2   | Full  | Mandatory for custom widgets |

**Non-negotiable**: Every feature MUST meet WCAG 2.2 AA before shipping.

---

## Target Users and Context

The P&L Manager is used by hospitality staff in demanding physical environments.
Accessibility is not theoretical -- it directly impacts daily operations.

### Primary Usage Scenarios

| Scenario                          | Device     | Conditions                          |
| --------------------------------- | ---------- | ----------------------------------- |
| Waiter photographing delivery note| Phone      | One-handed, standing, kitchen noise |
| Manager reviewing P&L at bar      | Tablet     | Bright overhead lighting, glare     |
| Chef checking inventory           | Phone      | Wet hands, greasy screen            |
| Owner reviewing reports at home   | Laptop     | Standard office conditions          |
| Accountant exporting data         | Desktop    | Standard office conditions          |

### Design Implications

- **Mobile-first**: phone is the primary device for operational staff
- **One-handed operation**: critical actions reachable with thumb
- **High contrast**: must be readable under bright restaurant lighting
- **Large touch targets**: fingers may be wet, greasy, or gloved
- **Fast interactions**: staff cannot spend time on complex navigation
- **Noisy environment**: never rely on audio-only feedback

---

## Keyboard Navigation

### Tab Order

All interactive elements MUST be reachable via Tab key in a logical order.

```tsx
// CORRECT: natural tab order follows visual order
<form>
  <input name="supplier" />    {/* Tab 1 */}
  <input name="date" />        {/* Tab 2 */}
  <input name="amount" />      {/* Tab 3 */}
  <button type="submit">Save</button> {/* Tab 4 */}
</form>

// FORBIDDEN: tabIndex > 0 (breaks natural order)
<input tabIndex={5} />  // NEVER
<input tabIndex={3} />  // NEVER

// ALLOWED: tabIndex values
// tabIndex={0}  -> Include in natural tab order
// tabIndex={-1} -> Programmatically focusable only
// tabIndex > 0  -> FORBIDDEN
```

### Key Bindings

| Key          | Action                                      |
| ------------ | ------------------------------------------- |
| Tab          | Move focus to next interactive element       |
| Shift+Tab    | Move focus to previous interactive element   |
| Enter        | Activate buttons, submit forms, open links   |
| Space        | Toggle checkboxes, activate buttons          |
| Escape       | Close modals, dropdowns, dismiss overlays    |
| Arrow keys   | Navigate within composites (tabs, menus)     |
| Home/End     | Jump to first/last item in lists             |

### Implementation

```tsx
// Button: responds to Enter AND Space
<button onClick={handleAction}>Save</button> // Native button handles this

// Custom clickable: MUST add keyboard support
<div
  role="button"
  tabIndex={0}
  onClick={handleAction}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAction();
    }
  }}
>
  Custom Action
</div>

// PREFERRED: Use native <button> instead of div[role="button"]
```

---

## Form Accessibility

### Labels

Every form field MUST have a visible label connected via `htmlFor`/`id`.

```tsx
// CORRECT: label connected to input
<label htmlFor="supplier-name">Supplier Name</label>
<input id="supplier-name" name="supplierName" type="text" />

// CORRECT: with required indicator
<label htmlFor="invoice-date">
  Invoice Date <span aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</label>
<input id="invoice-date" name="date" type="date" required />

// FORBIDDEN: no label
<input name="amount" placeholder="Amount" /> // Placeholder is NOT a label

// FORBIDDEN: label not connected
<label>Supplier</label>
<input name="supplier" /> // Missing htmlFor/id connection
```

### Validation Errors

```tsx
// CORRECT: accessible error message
<label htmlFor="quantity">Quantity</label>
<input
  id="quantity"
  type="number"
  aria-invalid={!!errors.quantity}
  aria-describedby={errors.quantity ? "quantity-error" : undefined}
/>
{errors.quantity && (
  <p id="quantity-error" role="alert" className="text-red-600 text-sm">
    {errors.quantity}
  </p>
)}

// RULES:
// - aria-invalid="true" when field has error
// - aria-describedby points to error message id
// - Error message has role="alert" for screen readers
// - Clear error when user corrects the field
```

### Required Fields

```tsx
// Mark required fields with both visual AND semantic indicators
<label htmlFor="price">
  Price <span className="text-red-500" aria-hidden="true">*</span>
</label>
<input id="price" required aria-required="true" />

// Provide a legend at the top of the form
<p className="text-sm text-gray-600">
  Fields marked with <span aria-hidden="true">*</span> are required.
</p>
```

---

## Color and Contrast

### Contrast Ratios (WCAG 2.2 AA)

| Element              | Minimum Ratio | How to Check                    |
| -------------------- | ------------- | ------------------------------- |
| Normal text (< 18px) | 4.5:1         | DevTools > Accessibility pane   |
| Large text (>= 18px) | 3:1           | DevTools > Accessibility pane   |
| UI components        | 3:1           | Borders, icons, focus rings     |
| Non-text content     | 3:1           | Charts, graphs, status badges   |

### Color is Never the Sole Indicator

```tsx
// FORBIDDEN: color-only status
<span className="text-green-600">Paid</span>
<span className="text-red-600">Overdue</span>

// CORRECT: color + text + icon
<span className="text-green-600 flex items-center gap-1">
  <CheckIcon aria-hidden="true" className="w-4 h-4" />
  Paid
</span>
<span className="text-red-600 flex items-center gap-1">
  <AlertIcon aria-hidden="true" className="w-4 h-4" />
  Overdue
</span>

// CORRECT: chart with patterns, not just colors
// Use dashed lines, different shapes, pattern fills alongside color
```

### Status Badge Pattern

```tsx
// Badges use color + text + shape (never color alone)
<StatusBadge variant="success">Paid</StatusBadge>    // Green + check icon + text
<StatusBadge variant="warning">Pending</StatusBadge>  // Amber + clock icon + text
<StatusBadge variant="danger">Overdue</StatusBadge>   // Red + alert icon + text
```

---

## Touch Targets

### Minimum Sizes

| Target Type          | Minimum Size | Context                           |
| -------------------- | ------------ | --------------------------------- |
| Buttons              | 44x44px      | WCAG 2.2 Target Size (Level AA)  |
| Icon buttons         | 44x44px      | Tap area, not icon size           |
| Table row actions    | 44x44px      | Critical for service staff        |
| Navigation items     | 48x48px      | Bottom nav, primary navigation    |
| Close buttons        | 44x44px      | Modals, drawers, panels           |

### Implementation

```tsx
// CORRECT: icon button with adequate tap target
<button
  className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
  aria-label="Delete item"
>
  <TrashIcon className="w-5 h-5" /> {/* Icon is 20px, tap area is 44px+ */}
</button>

// CORRECT: spacing between adjacent targets
<div className="flex gap-2">
  <button className="p-3">Edit</button>   {/* 44px+ with gap */}
  <button className="p-3">Delete</button> {/* No accidental taps */}
</div>

// FORBIDDEN: tiny targets
<button className="p-1">
  <TrashIcon className="w-4 h-4" /> {/* Tap area ~24px - TOO SMALL */}
</button>
```

---

## Focus Management

### Visible Focus Rings

ALL interactive elements MUST show a visible focus ring when focused via keyboard.

```tsx
// CORRECT: Tailwind focus-visible ring
<button className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
  Save
</button>

// CORRECT: input focus
<input className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none border border-gray-300" />

// FORBIDDEN: removing focus outlines without replacement
<button className="outline-none focus:outline-none"> {/* NEVER */}
  Save
</button>
```

### Focus-visible vs Focus

```css
/* Use focus-visible (not focus) to avoid showing rings on mouse clicks */
/* focus-visible: shows ring on keyboard focus only */
/* focus: shows ring on ALL focus (keyboard + mouse) */
```

### Global Focus Style

```css
/* In global CSS or Tailwind base layer */
@layer base {
  :focus-visible {
    outline: 2px solid var(--color-blue-500);
    outline-offset: 2px;
  }
}
```

---

## Modal and Dialog Patterns

### Required Attributes

```tsx
// CORRECT: accessible modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Delete</h2>
  <p id="modal-description">
    Are you sure you want to delete this supplier?
  </p>
  <div className="flex gap-2">
    <button onClick={onConfirm}>Delete</button>
    <button onClick={onClose}>Cancel</button>
  </div>
</div>
```

### Focus Trap

When a modal is open:

1. Focus moves to the first focusable element inside the modal
2. Tab cycles through modal elements ONLY (does not escape to background)
3. Escape key closes the modal
4. Focus returns to the element that opened the modal

```tsx
// Focus trap implementation requirements:
// - On open: focus first focusable element (or the close button)
// - Tab at last element: wrap to first element
// - Shift+Tab at first element: wrap to last element
// - Escape: close modal, return focus to trigger
// - Click outside: close modal, return focus to trigger
```

### Background Scroll Lock

```tsx
// When modal is open, prevent background scrolling
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }
}, [isOpen]);
```

---

## Images and Icons

### Alt Text Rules

| Image Type        | Alt Text                                  | Example                           |
| ----------------- | ----------------------------------------- | --------------------------------- |
| Informative       | Descriptive text                          | `alt="Invoice from Supplier X"`   |
| Decorative        | Empty string                              | `alt=""`                          |
| Icon with text    | Hidden from AT                            | `aria-hidden="true"`              |
| Icon-only button  | Label on parent                           | `aria-label="Delete"`             |
| Chart/graph       | Summary of data                           | `alt="Sales trend: +15% MoM"`    |

```tsx
// Informative image
<img src={invoice.thumbnail} alt={`Invoice #${invoice.number} preview`} />

// Decorative image
<img src="/decorative-pattern.svg" alt="" />

// Icon with text label
<button>
  <TrashIcon aria-hidden="true" className="w-5 h-5" />
  Delete
</button>

// Icon-only button
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" className="w-5 h-5" />
</button>
```

---

## Live Regions and Notifications

### Toast Notifications

```tsx
// Toast container with aria-live
<div aria-live="polite" aria-atomic="true" className="fixed bottom-4 right-4">
  {toasts.map((toast) => (
    <div key={toast.id} role="status">
      {toast.message}
    </div>
  ))}
</div>

// aria-live="polite": announces when user is idle (non-urgent)
// aria-live="assertive": interrupts immediately (critical errors only)
```

### Dynamic Content Updates

```tsx
// Status updates that screen readers should announce
<div aria-live="polite">
  {isProcessing ? "Processing document..." : `${items.length} items found`}
</div>

// Loading states
<div role="status" aria-live="polite">
  {isLoading && <span>Loading inventory data...</span>}
</div>
```

---

## Skip Navigation

### Implementation

```tsx
// In the main layout, as the FIRST focusable element
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
>
  Skip to main content
</a>

// Main content area
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

### Screen Reader Only Utility

```css
/* Tailwind sr-only class (already included) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Tables and Data

### Accessible Tables

```tsx
// CORRECT: semantic table with caption
<table>
  <caption className="sr-only">Monthly P&L summary for January 2026</caption>
  <thead>
    <tr>
      <th scope="col">Category</th>
      <th scope="col">Revenue</th>
      <th scope="col">Cost</th>
      <th scope="col">Margin</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Food</th>
      <td>12,500</td>
      <td>4,200</td>
      <td>66%</td>
    </tr>
  </tbody>
</table>

// RULES:
// - <caption> for table purpose (sr-only if visual context is sufficient)
// - scope="col" on column headers
// - scope="row" on row headers
// - Never use tables for layout
```

### Sortable Columns

```tsx
<th scope="col">
  <button
    aria-sort={sortField === "amount" ? sortDirection : "none"}
    onClick={() => handleSort("amount")}
  >
    Amount
    <SortIcon aria-hidden="true" />
  </button>
</th>
```

---

## Responsive and Mobile

### Mobile-First Approach

```tsx
// Design for mobile first, enhance for larger screens
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Content */}
  </div>
</div>
```

### Viewport and Zoom

```html
<!-- Allow user zoom - NEVER disable -->
<meta name="viewport" content="width=device-width, initial-scale=1" />

<!-- FORBIDDEN: disabling zoom -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
```

### Orientation

- App MUST work in both portrait and landscape
- Never lock orientation unless absolutely necessary
- Critical data must be visible without horizontal scroll in portrait

---

## Component Checklist

Before shipping ANY component, verify:

### Interactive Elements

- [ ] Keyboard reachable (Tab)
- [ ] Keyboard activatable (Enter/Space)
- [ ] Visible focus ring (focus-visible:ring-2)
- [ ] Touch target >= 44x44px
- [ ] Appropriate ARIA role (if not native element)
- [ ] Accessible name (label, aria-label, or aria-labelledby)

### Forms

- [ ] All inputs have connected labels (htmlFor + id)
- [ ] Required fields marked semantically (required + aria-required)
- [ ] Error messages use aria-invalid + aria-describedby
- [ ] Validation errors announced to screen readers (role="alert")
- [ ] Errors clear when user corrects the field

### Modals/Dialogs

- [ ] role="dialog" + aria-modal="true"
- [ ] aria-labelledby points to title
- [ ] Focus trapped inside modal
- [ ] Escape closes modal
- [ ] Focus returns to trigger on close
- [ ] Background scroll locked

### Color and Contrast

- [ ] Text contrast >= 4.5:1 (normal) or 3:1 (large)
- [ ] Color never the sole indicator
- [ ] Status uses color + text + icon

---

## Testing

### Manual Testing Checklist

- [ ] Navigate entire page with keyboard only (no mouse)
- [ ] Verify all focus rings are visible
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Zoom to 200% -- no content loss or overlap
- [ ] Test on actual mobile device (not just responsive mode)

### Automated Tools

| Tool               | What It Checks                  | When to Run    |
| ------------------ | ------------------------------- | -------------- |
| axe DevTools       | WCAG violations                 | During dev     |
| Lighthouse         | Accessibility score             | Pre-deploy     |
| eslint-plugin-jsx-a11y | JSX accessibility rules    | Every build    |

### Target Scores

| Tool        | Minimum Score |
| ----------- | ------------- |
| Lighthouse  | 90+           |
| axe         | 0 violations  |

---

## Version History

| Date       | Change                          | Author |
| ---------- | ------------------------------- | ------ |
| 2026-03-27 | Initial contract                | Aitor  |
