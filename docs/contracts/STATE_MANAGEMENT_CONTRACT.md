# State Management Contract

> Source of truth for all state management patterns, decisions, and conventions
> in the P&L Manager project. Every state decision MUST follow this contract.

---

## Table of Contents

1. [Architecture Decision](#architecture-decision)
2. [Existing Contexts](#existing-contexts)
3. [When to Create a New Context](#when-to-create-a-new-context)
4. [Source of Truth](#source-of-truth)
5. [Real-Time Sync](#real-time-sync)
6. [Form State](#form-state)
7. [Loading State](#loading-state)
8. [Error State](#error-state)
9. [Derived State](#derived-state)
10. [Anti-Patterns](#anti-patterns)
11. [State Location Decision Tree](#state-location-decision-tree)
12. [Context Implementation Patterns](#context-implementation-patterns)
13. [Testing State](#testing-state)

---

## Architecture Decision

### Chosen: React Context + useState ONLY

| Library      | Status      | Rationale                                       |
| ------------ | ----------- | ----------------------------------------------- |
| React Context| **USED**    | Built-in, sufficient for our complexity level    |
| useState     | **USED**    | Local state for components and forms             |
| useReducer   | **ALLOWED** | Complex state transitions (use sparingly)        |
| Redux        | **BANNED**  | Overkill for this app's complexity               |
| Zustand      | **BANNED**  | Unnecessary external dependency                  |
| Jotai        | **BANNED**  | Unnecessary external dependency                  |
| MobX         | **BANNED**  | Unnecessary external dependency                  |
| Recoil       | **BANNED**  | Unnecessary external dependency                  |

### Why No External State Library

- The app has 4 contexts covering auth, database, restaurant, and notifications
- Firestore is the real source of truth (not client state)
- Most state is form-local or page-local
- Adding a state library creates complexity without solving a real problem
- If complexity grows beyond React Context, re-evaluate (document in ADR)

---

## Existing Contexts

### AppContext (Auth + User)

```tsx
// Provides: current user, auth state, login/logout
interface AppContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Usage
const { user, loading } = useApp();
```

| Provides          | Type               | Description                        |
| ----------------- | ------------------ | ---------------------------------- |
| `user`            | `User \| null`     | Current authenticated user         |
| `loading`         | `boolean`          | Auth state loading                 |
| `signIn`          | `function`         | Sign in with email/password        |
| `signOut`         | `function`         | Sign out current user              |

### DatabaseContext (Local DB Cache)

```tsx
// Provides: local database operations and cached data
interface DatabaseContextValue {
  products: Product[];
  suppliers: Supplier[];
  categories: Category[];
  refreshProducts: () => Promise<void>;
  refreshSuppliers: () => Promise<void>;
}

// Usage
const { products, refreshProducts } = useDatabase();
```

| Provides           | Type               | Description                       |
| ------------------ | ------------------ | --------------------------------- |
| `products`         | `Product[]`        | Cached product list               |
| `suppliers`        | `Supplier[]`       | Cached supplier list              |
| `categories`       | `Category[]`       | Cached category list              |
| `refresh*`         | `function`         | Force refresh from Firestore      |

### RestaurantContext (Current Restaurant)

```tsx
// Provides: current restaurant data and selection
interface RestaurantContextValue {
  restaurant: Restaurant | null;
  restaurantId: string | null;
  loading: boolean;
  setRestaurant: (restaurant: Restaurant) => void;
}

// Usage
const { restaurant, restaurantId } = useRestaurant();
```

| Provides           | Type                  | Description                    |
| ------------------ | --------------------- | ------------------------------ |
| `restaurant`       | `Restaurant \| null`  | Current restaurant data        |
| `restaurantId`     | `string \| null`      | Current restaurant ID          |
| `loading`          | `boolean`             | Restaurant loading state       |
| `setRestaurant`    | `function`            | Switch active restaurant       |

### ToastProvider (Notifications)

```tsx
// Provides: toast notification system
interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}

// Usage
const { showSuccess, showError } = useToast();
```

| Provides           | Type               | Description                       |
| ------------------ | ------------------ | --------------------------------- |
| `showToast`        | `function`         | Show toast with custom type       |
| `showSuccess`      | `function`         | Show success toast (green)        |
| `showError`        | `function`         | Show error toast (red)            |
| `showWarning`      | `function`         | Show warning toast (amber)        |

### Context Provider Tree

```tsx
// Provider nesting order (outermost to innermost)
<AppProvider>              {/* Auth + User */}
  <RestaurantProvider>     {/* Restaurant selection */}
    <DatabaseProvider>     {/* Local DB cache */}
      <ToastProvider>      {/* Notifications */}
        <Router>
          <App />
        </Router>
      </ToastProvider>
    </DatabaseProvider>
  </RestaurantProvider>
</AppProvider>
```

---

## When to Create a New Context

### Criteria (ALL must be true)

A new Context is justified ONLY when:

1. **5+ components** in **different tree branches** need the same state
2. The state **cannot** be lifted to a common parent without excessive prop drilling
3. The state is **not** derivable from existing contexts
4. The state **changes infrequently** (high-frequency updates cause re-renders)

### Decision Matrix

| Situation                                    | Solution              |
| -------------------------------------------- | --------------------- |
| 2-3 components need shared state             | Lift state to parent  |
| Parent passes to child passes to grandchild  | Props (3 levels OK)   |
| 4+ levels of prop drilling                   | Consider Context      |
| 5+ unrelated components need same data       | Create Context        |
| Global UI state (theme, sidebar open)        | Context               |
| Form state                                   | Local useState        |
| Server data                                  | Firestore + local cache |

### New Context Template

```tsx
// Only create when justified by criteria above
// See "Context Implementation Patterns" section for the template
```

---

## Source of Truth

### Firestore is the Source of Truth

```
                    +-----------+
                    | Firestore |  <-- Single source of truth
                    +-----------+
                         |
                    onSnapshot / getDoc
                         |
                    +-----------+
                    | React     |  <-- Temporary cache (display only)
                    | State     |
                    +-----------+
                         |
                    +-----------+
                    |    UI     |  <-- Renders from state
                    +-----------+
```

### Rules

| Rule                                          | Rationale                              |
| --------------------------------------------- | -------------------------------------- |
| Firestore data is truth                       | Multiple clients, real-time sync       |
| React state is a display cache                | Temporary, derived from Firestore      |
| Never trust local state over Firestore        | Another client may have changed data   |
| Write to Firestore, read from listener        | Unidirectional data flow               |
| Optimistic updates with rollback              | Good UX, but Firestore confirms        |

### Data Flow Pattern

```tsx
// CORRECT: write to Firestore, UI updates via listener
async function handleSave(data: ProductFormData) {
  try {
    setSubmitting(true);
    await updateDoc(doc(db, "productos", productId), data);
    // DO NOT manually update local state
    // The onSnapshot listener will pick up the change automatically
    showSuccess("Product updated");
  } catch (error) {
    showError("Failed to update product");
  } finally {
    setSubmitting(false);
  }
}

// The listener updates state automatically
useEffect(() => {
  const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
    setProducts(snapshot.docs.map(docToProduct));
  });
  return () => unsubscribe();
}, []);
```

---

## Real-Time Sync

### When to Use onSnapshot

| Data Type                          | Method        | Example                        |
| ---------------------------------- | ------------- | ------------------------------ |
| Frequently changing, visible data  | `onSnapshot`  | Products, orders, cash closing |
| Reference data, rarely changes     | `getDoc`      | Categories, units, tax config  |
| Historical data, never changes     | `getDoc`      | Past P&L reports, old closings |
| Form population (one-time load)    | `getDoc`      | Edit form initial values       |

### Real-Time Listener Pattern

```tsx
function useProducts(restaurantId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!restaurantId) return;

    setLoading(true);
    const q = query(
      collection(db, "productos"),
      where("restaurantId", "==", restaurantId),
      where("active", "==", true),
      orderBy("name"),
      limit(500)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  return { products, loading, error };
}
```

---

## Form State

### Local useState for Forms

```tsx
function ProductForm({ product, onSave }: ProductFormProps) {
  // Form state is LOCAL (not Context, not Firestore)
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Clear specific error when field changes
  function handleNameChange(value: string) {
    setName(value);
    if (errors.name) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (price <= 0) newErrors.price = "Price must be positive";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit to Firestore
    try {
      setSubmitting(true);
      await onSave({ name, price });
    } catch (error) {
      showError("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Form State Rules

| Rule                                       | Rationale                             |
| ------------------------------------------ | ------------------------------------- |
| Form state lives in the form component     | Encapsulated, no unnecessary sharing  |
| Clear validation errors on field change    | Immediate feedback                    |
| Disable submit button while submitting     | Prevent double submission             |
| Reset form after successful submit         | Clean state for next entry            |
| Pre-populate from props (not from Context) | Component is reusable                 |

---

## Loading State

### Per-Operation Loading

```tsx
// CORRECT: granular loading per operation
function ProductActions({ productId }: { productId: string }) {
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleDelete() {
    try {
      setDeleting(true);
      await deleteProduct(productId);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <button disabled={deleting} onClick={handleDelete}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
      <button disabled={archiving} onClick={handleArchive}>
        {archiving ? "Archiving..." : "Archive"}
      </button>
    </div>
  );
}
```

### Per-Page Loading

```tsx
// Full page loading for initial data fetch
function ProductList() {
  const { products, loading, error } = useProducts(restaurantId);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorPage error={error} />;
  if (products.length === 0) return <EmptyState message="No products yet" />;

  return <ProductTable products={products} />;
}
```

### Loading State Rules

| Level        | Visual                    | When                              |
| ------------ | ------------------------- | --------------------------------- |
| Page         | Full skeleton/spinner     | Initial data load                 |
| Section      | Section skeleton          | Tab content loading               |
| Button       | Button spinner + disabled | Individual action in progress     |
| Inline       | Subtle spinner            | Background refresh                |

---

## Error State

### Per-Operation Errors (Toast)

```tsx
// Errors from user actions show as toasts
async function handleSave(data: ProductFormData) {
  try {
    await saveProduct(data);
    showSuccess("Product saved");
  } catch (error) {
    if (error instanceof FirebaseError) {
      showError(`Firebase error: ${error.message}`);
    } else {
      showError("An unexpected error occurred");
    }
  }
}
```

### Per-Page Errors (Error Boundary)

```tsx
// Unrecoverable errors show error page
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-gray-600 mt-2">{error.message}</p>
      <button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </button>
    </div>
  );
}

// Wrap pages or sections
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <ProductList />
</ErrorBoundary>
```

### Error State Rules

| Error Type           | Handling                | User Sees                     |
| -------------------- | ----------------------- | ----------------------------- |
| Form validation      | Inline error messages   | Red text under field          |
| CRUD operation fail  | Toast notification      | Red toast with message        |
| Network error        | Toast + retry option    | Red toast + retry button      |
| Auth error           | Redirect to login       | Login page                    |
| Unrecoverable        | Error boundary          | Error page with retry         |

---

## Derived State

### Derive, Don't Duplicate

```tsx
// FORBIDDEN: duplicated state
const [products, setProducts] = useState<Product[]>([]);
const [activeProducts, setActiveProducts] = useState<Product[]>([]); // DUPLICATE
const [productCount, setProductCount] = useState(0); // DUPLICATE

// CORRECT: derive from source
const [products, setProducts] = useState<Product[]>([]);
const activeProducts = products.filter((p) => p.active); // Derived
const productCount = products.length; // Derived

// For expensive derivations, use useMemo
const sortedAndFiltered = useMemo(() => {
  return products
    .filter((p) => p.category === selectedCategory)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [products, selectedCategory]);
```

### Rules

| Rule                                        | Implementation                      |
| ------------------------------------------- | ----------------------------------- |
| If it can be computed, compute it            | Don't store derived values          |
| Expensive computations use `useMemo`         | Filtering, sorting, aggregations    |
| Never sync state with `useEffect`            | Derive inline or with `useMemo`     |

```tsx
// FORBIDDEN: syncing state with useEffect
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);

useEffect(() => {
  setFilteredItems(items.filter((i) => i.active)); // ANTI-PATTERN
}, [items]);

// CORRECT: derive inline
const filteredItems = items.filter((i) => i.active);

// CORRECT: derive with useMemo (if expensive)
const filteredItems = useMemo(() => items.filter((i) => i.active), [items]);
```

---

## Anti-Patterns

### 1. Prop Drilling Beyond 3 Levels

```tsx
// BAD: drilling through 4+ levels
<Page user={user}>
  <Section user={user}>
    <Card user={user}>
      <Avatar user={user} />  // 4 levels deep
    </Card>
  </Section>
</Page>

// GOOD: use Context if 5+ components need it across branches
const { user } = useApp(); // Any component can access
```

### 2. Redundant State

```tsx
// BAD: storing what can be derived
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [fullName, setFullName] = useState(""); // REDUNDANT

// GOOD: derive it
const fullName = `${firstName} ${lastName}`;
```

### 3. State in URL When It Should Be Local

```tsx
// BAD: temporary UI state in URL
// ?modal=open&selectedItem=123

// GOOD: transient UI state stays in useState
const [modalOpen, setModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<string | null>(null);
```

### 4. Over-using Context

```tsx
// BAD: Context for state used by 2 sibling components
// Just lift state to their common parent

// BAD: Context for form state
// Form state is local to the form

// BAD: Context for every page's data
// Use custom hooks with Firestore listeners instead
```

### 5. Mutating State Directly

```tsx
// FORBIDDEN: direct mutation
products.push(newProduct); // Mutates array
setProducts(products); // Same reference, no re-render

// CORRECT: immutable update
setProducts((prev) => [...prev, newProduct]);

// CORRECT: immutable object update
setProduct((prev) => ({ ...prev, name: newName }));
```

---

## State Location Decision Tree

```
Where should this state live?

1. Is it form data being edited?
   YES -> useState in the form component
   NO  -> Continue

2. Is it derived from other state?
   YES -> Compute inline or useMemo (NOT separate state)
   NO  -> Continue

3. Is it transient UI state (modal open, hover, focus)?
   YES -> useState in the component that owns the UI
   NO  -> Continue

4. Does only 1 component need it?
   YES -> useState in that component
   NO  -> Continue

5. Do 2-3 sibling components need it?
   YES -> Lift to common parent, pass as props
   NO  -> Continue

6. Do 5+ components across different branches need it?
   YES -> Create a Context (document why)
   NO  -> Continue

7. Is it server data from Firestore?
   YES -> Custom hook with onSnapshot/getDoc
   NO  -> Continue

8. Is it URL-persistent state (tab, filter, page)?
   YES -> useSearchParams (query params)
   NO  -> Re-evaluate from step 1
```

---

## Context Implementation Patterns

### Standard Context Template

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

// 1. Define the type
interface ExampleContextValue {
  data: string;
  setData: (value: string) => void;
}

// 2. Create context with undefined default
const ExampleContext = createContext<ExampleContextValue | undefined>(undefined);

// 3. Provider component
export function ExampleProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState("");

  const value: ExampleContextValue = {
    data,
    setData,
  };

  return (
    <ExampleContext.Provider value={value}>
      {children}
    </ExampleContext.Provider>
  );
}

// 4. Custom hook with runtime check
export function useExample(): ExampleContextValue {
  const context = useContext(ExampleContext);
  if (context === undefined) {
    throw new Error("useExample must be used within an ExampleProvider");
  }
  return context;
}
```

### Context Performance

```tsx
// PROBLEM: value object recreated every render
<MyContext.Provider value={{ user, theme, settings }}>
  {children}
</MyContext.Provider>

// SOLUTION: memoize the value
const value = useMemo(
  () => ({ user, theme, settings }),
  [user, theme, settings]
);
<MyContext.Provider value={value}>{children}</MyContext.Provider>
```

---

## Testing State

### Testing Custom Hooks

```tsx
import { renderHook, act } from "@testing-library/react";

test("useProducts returns products for restaurant", async () => {
  const { result } = renderHook(() => useProducts("rest_123"), {
    wrapper: TestProviders,
  });

  // Initially loading
  expect(result.current.loading).toBe(true);

  // After data loads
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.products).toHaveLength(5);
  });
});
```

### Testing Context Providers

```tsx
test("AppProvider provides user after login", async () => {
  const { result } = renderHook(() => useApp(), {
    wrapper: AppProvider,
  });

  expect(result.current.user).toBeNull();

  await act(async () => {
    await result.current.signIn("test@example.com", "password");
  });

  expect(result.current.user).not.toBeNull();
});
```

---

## Version History

| Date       | Change                          | Author |
| ---------- | ------------------------------- | ------ |
| 2026-03-27 | Initial contract                | Aitor  |
