---
description: "React 19 + TypeScript patterns. Component structure, hooks, state, error handling."
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
---

# React 19 + TypeScript Patterns -- P&L Manager

## Component Structure

Every component follows this exact order:

```typescript
// 1. Imports (see import order in 01-architecture.md)
import { useState, useEffect } from 'react';
import { Button } from '@shared/components/Button';
import { useToast } from '@shared/hooks/useToast';
import type { Producto } from './types';

// 2. Props interface (exported, named XProps)
export interface ProductoCardProps {
  producto: Producto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isCompact?: boolean;
}

// 3. Component function (named export, destructured props)
export function ProductoCard({
  producto,
  onEdit,
  onDelete,
  isCompact = false,
}: ProductoCardProps) {
  // 4. Hooks (ALL hooks before any conditional return)
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // side effects
  }, [producto.id]);

  // 5. Handlers
  function handleDelete() {
    setIsDeleting(true);
    onDelete(producto.id);
  }

  // 6. Conditional returns (after ALL hooks)
  if (!producto) {
    return null;
  }

  // 7. JSX
  return (
    <div className="...">
      {/* component content */}
    </div>
  );
}
```

**Rules:**
- ALL hooks MUST come before any conditional return. No exceptions.
- Named export only. No `export default`.
- One component per file.
- Props interface is always exported and named `{ComponentName}Props`.

## Hooks Rules

### Placement

```typescript
// CORRECT -- all hooks at the top
export function ProductoList({ restaurantId }: ProductoListProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => { /* ... */ }, [restaurantId]);

  if (loading) return <Spinner />;
  // ...
}

// WRONG -- hook after conditional
export function ProductoList({ restaurantId }: ProductoListProps) {
  const [loading, setLoading] = useState(true);
  if (loading) return <Spinner />;  // <-- conditional before all hooks

  const { showToast } = useToast();  // <-- VIOLATION: hook after conditional
  // ...
}
```

### useEffect

- MUST have an explicit dependency array. Never omit it.
- Empty array `[]` for mount-only effects.
- Return cleanup function for subscriptions, listeners, timers.

```typescript
// CORRECT
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback, errorCallback);
  return unsubscribe;
}, [restaurantId]);

// WRONG -- missing dependency array
useEffect(() => {
  fetchData();
});

// WRONG -- missing cleanup
useEffect(() => {
  const interval = setInterval(tick, 1000);
  // no return cleanup!
}, []);
```

### Custom Hooks

- Prefix with `use`.
- Place in `hooks/` folder (global or feature-level).
- Return typed values, not `any`.
- Handle loading, error, and data states internally.

```typescript
// src/features/productos/hooks/useProductos.ts
export function useProductos(restaurantId: string) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // fetch logic with error handling
  }, [restaurantId]);

  return { productos, loading, error } as const;
}
```

### Forbidden Hook Patterns

- No hooks inside loops: `items.map(() => useState(...))`
- No hooks inside conditions: `if (x) { useEffect(...) }`
- No hooks inside nested functions: `function inner() { useState(...) }`
- No hooks inside try/catch blocks.

## Event Handlers

### Nested Clickables

When an interactive element is inside another interactive element, stop propagation:

```typescript
<tr onClick={() => openDetail(item.id)}>
  <td>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        handleDelete(item.id);
      }}
    >
      Delete
    </button>
  </td>
</tr>
```

### Button Types

- Non-submit buttons MUST have `type="button"` to prevent form submission:

```typescript
// CORRECT
<button type="button" onClick={handleClick}>Cancel</button>

// WRONG -- defaults to type="submit"
<button onClick={handleClick}>Cancel</button>
```

### Form Submission

Always prevent default on form submit handlers:

```typescript
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  // validation and submission logic
}
```

## State Management

### Architecture

- **React Context + useState ONLY.** No Redux, Zustand, Jotai, or other state libraries.
- State lives as close to where it is used as possible.
- Lift state only when needed by sibling or parent components.

### Existing Contexts

| Context              | Purpose                          | Provider Location     |
|----------------------|----------------------------------|-----------------------|
| `AppContext`         | Auth state, current user         | App.tsx root          |
| `DatabaseContext`    | Firestore instance, helpers      | App.tsx root          |
| `RestaurantContext`  | Current restaurant selection     | Inside authenticated  |
| `ToastProvider`      | Toast notification system        | App.tsx root          |

### When to Create a New Context

Create a new context ONLY when ALL of these are true:
1. 5+ components need the same data.
2. Those components are in different branches of the tree.
3. Prop drilling would cross 3+ levels.

If fewer than 5 components need it, use prop drilling or composition.

### Context Pattern

```typescript
// 1. Define types
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// 2. Create context with undefined default
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// 3. Provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const value: ThemeContextValue = {
    theme,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// 4. Custom hook with safety check
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

## Forms

### Validation

- Manual validation for now (future: Zod schemas).
- Validate on submit, not on every keystroke.
- Clear field errors when the user modifies that field.
- Scroll to first error on submit.

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

function validate(data: ProductoFormData): Record<string, string> {
  const newErrors: Record<string, string> = {};
  if (!data.nombre.trim()) newErrors.nombre = 'Name is required';
  if (data.precio <= 0) newErrors.precio = 'Price must be positive';
  return newErrors;
}

function handleChange(field: string, value: string) {
  setFormData((prev) => ({ ...prev, [field]: value }));
  // Clear error for this field
  setErrors((prev) => {
    const next = { ...prev };
    delete next[field];
    return next;
  });
}

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const validationErrors = validate(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    // Scroll to first error
    const firstErrorField = document.querySelector('[data-error="true"]');
    firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  // proceed with submission
}
```

## Error Handling

### Catch Pattern

Always type-narrow errors. Never use `catch (error)` without narrowing:

```typescript
// CORRECT
try {
  await saveProducto(data);
  showToast.success('Product saved');
} catch (error: unknown) {
  logError(error, 'saveProducto');
  const message = error instanceof Error ? error.message : 'Unknown error';
  showToast.error(`Failed to save: ${message}`);
}

// WRONG
try {
  await saveProducto(data);
} catch (error) {
  console.log(error);  // No console.log, untyped error
}
```

### logError Utility

All caught errors MUST be logged through `logError()`, not `console.error`:

```typescript
export function logError(error: unknown, context: string): void {
  // Structured logging -- future: send to monitoring service
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  // Internal logging implementation
}
```

## Loading States

### Four UI States

Every data-dependent view MUST handle all four states:

| State     | Condition            | UI                              |
|-----------|----------------------|---------------------------------|
| LOADING   | `loading === true`   | Skeleton or spinner             |
| DATA      | `data.length > 0`    | Render the data                 |
| EMPTY     | `data.length === 0`  | Empty state with message/CTA    |
| ERROR     | `error !== null`     | Error message with retry option |

```typescript
if (loading) return <Skeleton />;
if (error) return <ErrorState message={error} onRetry={refetch} />;
if (productos.length === 0) return <EmptyState message="No products yet" />;
return <ProductoGrid productos={productos} />;
```

### Async Operation Phases

For mutations (save, delete, update), track three phases:

| Phase    | State               | UI                                |
|----------|----------------------|-----------------------------------|
| IDLE     | `saving === false`   | Normal button                     |
| LOADING  | `saving === true`    | Disabled button + spinner         |
| RESULT   | success or error     | Toast notification + reset state  |

```typescript
const [saving, setSaving] = useState(false);

async function handleSave() {
  setSaving(true);
  try {
    await saveProducto(formData);
    showToast.success('Product saved');
    onClose();
  } catch (error: unknown) {
    logError(error, 'handleSave');
    showToast.error('Failed to save product');
  } finally {
    setSaving(false);
  }
}

<Button loading={saving} disabled={saving} onClick={handleSave}>
  Save
</Button>
```

## TypeScript Strictness

### Zero Tolerance

- No `any` type. Use `unknown` and narrow.
- No `@ts-ignore` or `@ts-expect-error`.
- No `as unknown as X` unsafe casts.
- No non-null assertions (`!`) unless truly impossible to be null.

### Type Patterns

```typescript
// Prefer interfaces for component props
export interface ProductoCardProps {
  producto: Producto;
  onEdit: (id: string) => void;
}

// Use type for unions and computed types
type ViewMode = 'grid' | 'list' | 'table';
type ProductoWithCategory = Producto & { categoryName: string };

// Generics for reusable hooks
function useAsync<T>(asyncFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...
}
```

## Import Order (Reminder)

Consistent across all files:

```
React → third-party → @shared → @core → @features → local
```

Separate each group with a blank line. Type-only imports can be grouped with their source or at the end of each group.

## Forbidden Patterns Summary

| Pattern                              | Why                                    |
|--------------------------------------|----------------------------------------|
| `export default`                     | Named exports for better refactoring   |
| `console.log` / `console.error`     | Use `logError()` and toast             |
| `any` type                          | Use `unknown` + type narrowing         |
| `@ts-ignore`                        | Fix the type error properly            |
| Hook after conditional return        | Violates Rules of Hooks               |
| Missing useEffect dependency array   | Causes infinite loops or stale data    |
| Missing useEffect cleanup            | Causes memory leaks                    |
| `<button>` without `type="button"`  | Unintended form submissions            |
| Inline `style={{}}` for layout       | Use Tailwind classes                   |
| `window.alert()` / `window.confirm()` | Use Modal and Toast components       |
| `setTimeout` without cleanup         | Memory leak on unmount                 |
| Direct Firestore calls in components | Use service functions in `services/`   |
