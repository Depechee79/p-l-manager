# Performance Contract

> Source of truth for all performance targets and optimization patterns in the P&L Manager project.
> Every feature MUST meet these targets before shipping.

---

## Table of Contents

1. [Core Web Vitals](#core-web-vitals)
2. [Code Splitting](#code-splitting)
3. [Image Optimization](#image-optimization)
4. [Font Loading](#font-loading)
5. [React Rendering](#react-rendering)
6. [Memory Management](#memory-management)
7. [Bundle Size](#bundle-size)
8. [Firestore Optimization](#firestore-optimization)
9. [Real-Time Data](#real-time-data)
10. [Lazy Loading](#lazy-loading)
11. [Caching Strategy](#caching-strategy)
12. [Offline Capability](#offline-capability)
13. [Monitoring](#monitoring)
14. [Performance Budget](#performance-budget)

---

## Core Web Vitals

### Targets (MANDATORY)

| Metric | Target   | What It Measures                              |
| ------ | -------- | --------------------------------------------- |
| LCP    | <= 2.5s  | Largest Contentful Paint (loading speed)       |
| CLS    | <= 0.1   | Cumulative Layout Shift (visual stability)     |
| INP    | <= 200ms | Interaction to Next Paint (responsiveness)     |

### How to Measure

```bash
# Lighthouse in Chrome DevTools
# Performance tab > Core Web Vitals overlay
# web.dev/measure for production URL

# Programmatic measurement
import { onLCP, onCLS, onINP } from "web-vitals";

onLCP(console.log);
onCLS(console.log);
onINP(console.log);
```

### CLS Prevention Checklist

- [ ] Images have explicit width/height or aspect-ratio
- [ ] Fonts use `font-display: swap` (no invisible text flash)
- [ ] Dynamic content has reserved space (skeleton loaders)
- [ ] No content injected above existing content after load
- [ ] Modals/toasts don't shift page layout

---

## Code Splitting

### Route-Level Splitting (MANDATORY)

Every route MUST be lazy-loaded except the login page (immediate access required).

```tsx
import { lazy, Suspense } from "react";

// CORRECT: lazy-loaded routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Almacen = lazy(() => import("./pages/Almacen"));
const Cierres = lazy(() => import("./pages/Cierres"));
const DocumentOCR = lazy(() => import("./pages/DocumentOCR"));
const PnL = lazy(() => import("./pages/PnL"));
const Escandallos = lazy(() => import("./pages/Escandallos"));
const Equipo = lazy(() => import("./pages/Equipo"));
const Configuracion = lazy(() => import("./pages/Configuracion"));

// NOT lazy: login (must load instantly)
import Login from "./pages/Login";

// Route rendering with Suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Dashboard />} />
    <Route path="/almacen" element={<Almacen />} />
    {/* ... */}
  </Routes>
</Suspense>
```

### Suspense Fallback

```tsx
// CORRECT: meaningful loading state
<Suspense fallback={<PageSkeleton />}>
  <Dashboard />
</Suspense>

// FORBIDDEN: empty or minimal fallback
<Suspense fallback={null}>           {/* No feedback */}
<Suspense fallback={<p>Loading</p>}> {/* Poor UX */}
```

### Feature-Level Splitting

Heavy feature modules should be split independently:

```tsx
// Heavy component loaded on demand
const DocumentScanner = lazy(() => import("./features/DocumentScanner"));
const ReportExporter = lazy(() => import("./features/ReportExporter"));
const ChartDashboard = lazy(() => import("./features/ChartDashboard"));
```

---

## Image Optimization

### Rules

| Rule                                | Target                          |
| ----------------------------------- | ------------------------------- |
| Maximum file size                   | < 500KB per image               |
| Preferred format                    | WebP (fallback: JPEG)           |
| Below-the-fold images               | `loading="lazy"`               |
| Above-the-fold images               | `loading="eager"` (default)    |
| Thumbnails                          | Serve resized versions          |
| Document photos (OCR input)         | Compress before upload          |

### Implementation

```tsx
// Below-the-fold: lazy load
<img
  src="/images/report-preview.webp"
  alt="Monthly P&L report preview"
  loading="lazy"
  width={600}
  height={400}
/>

// Above-the-fold: eager load (default)
<img
  src="/images/logo.webp"
  alt="P&L Manager logo"
  width={120}
  height={40}
/>

// Responsive images
<picture>
  <source srcSet="/images/hero.webp" type="image/webp" />
  <source srcSet="/images/hero.jpg" type="image/jpeg" />
  <img src="/images/hero.jpg" alt="Dashboard overview" width={1200} height={600} />
</picture>
```

### Document Photos

```typescript
// Compress photos before uploading to Cloud Functions
async function compressImage(file: File, maxSizeKB: number = 500): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = await createImageBitmap(file);

  // Scale down if needed
  const maxDimension = 2048;
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Compress as JPEG
  let quality = 0.85;
  let blob = await new Promise<Blob>((r) =>
    canvas.toBlob((b) => r(b!), "image/jpeg", quality)
  );

  while (blob.size > maxSizeKB * 1024 && quality > 0.3) {
    quality -= 0.1;
    blob = await new Promise<Blob>((r) =>
      canvas.toBlob((b) => r(b!), "image/jpeg", quality)
    );
  }

  return blob;
}
```

---

## Font Loading

### Strategy

```html
<!-- Preload primary font -->
<link
  rel="preload"
  href="/fonts/PublicSans-Variable.woff2"
  as="font"
  type="font/woff2"
  crossorigin="anonymous"
/>
```

```css
/* Font-face with swap to prevent invisible text */
@font-face {
  font-family: "Public Sans";
  src: url("/fonts/PublicSans-Variable.woff2") format("woff2");
  font-display: swap;
  font-weight: 100 900;
}
```

### Rules

| Rule                          | Rationale                                    |
| ----------------------------- | -------------------------------------------- |
| Use `font-display: swap`     | Text visible immediately with fallback font   |
| Preload primary font          | Reduces FOUT duration                        |
| Use variable fonts            | Single file for all weights                  |
| Subset if possible            | Reduce font file size                        |
| Max 2 font families           | Limit HTTP requests and file size            |

---

## React Rendering

### Optimization Patterns

```tsx
// useMemo: expensive computations
const sortedItems = useMemo(() => {
  return items
    .filter((item) => item.category === selectedCategory)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [items, selectedCategory]);

// useCallback: callbacks passed to children
const handleDelete = useCallback((id: string) => {
  deleteItem(id);
}, [deleteItem]);

// React.memo: pure display components
const ProductRow = memo(function ProductRow({ product }: ProductRowProps) {
  return (
    <tr>
      <td>{product.name}</td>
      <td>{product.price}</td>
    </tr>
  );
});
```

### When to Optimize

| Scenario                               | Tool              |
| -------------------------------------- | ----------------- |
| Filtering/sorting large arrays         | `useMemo`         |
| Callback prop to memoized child        | `useCallback`     |
| Pure display component (list item)     | `React.memo`      |
| Expensive derived state                | `useMemo`         |
| Context value object                   | `useMemo`         |

### When NOT to Optimize

- Simple calculations (adding two numbers)
- Components that always re-render anyway
- Callbacks not passed as props to children
- State that changes every render regardless

```tsx
// UNNECESSARY: premature optimization
const doubled = useMemo(() => count * 2, [count]); // Just do: const doubled = count * 2;
```

### Avoid Unnecessary Re-renders

```tsx
// FORBIDDEN: creating objects/arrays in JSX (new reference every render)
<Component style={{ color: "red" }} />           // New object each render
<Component items={items.filter(i => i.active)} /> // New array each render

// CORRECT: stable references
const style = useMemo(() => ({ color: "red" }), []);
const activeItems = useMemo(() => items.filter(i => i.active), [items]);
```

---

## Memory Management

### Subscription Cleanup

```tsx
// CORRECT: cleanup onSnapshot listener
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "productos"),
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
    }
  );

  return () => unsubscribe(); // MANDATORY cleanup
}, []);
```

### AbortController for Fetch

```tsx
// CORRECT: abort pending requests on unmount
useEffect(() => {
  const controller = new AbortController();

  async function fetchData() {
    try {
      const response = await fetch("/api/data", { signal: controller.signal });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return; // Expected: component unmounted
      }
      throw error;
    }
  }

  fetchData();
  return () => controller.abort();
}, []);
```

### Event Listener Cleanup

```tsx
// CORRECT: remove event listeners
useEffect(() => {
  function handleResize() {
    setWidth(window.innerWidth);
  }

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

### Memory Leak Checklist

- [ ] Every `onSnapshot` has a cleanup `unsubscribe()`
- [ ] Every `addEventListener` has a matching `removeEventListener`
- [ ] Every `setInterval` has a matching `clearInterval`
- [ ] Every `setTimeout` in effects has a matching `clearTimeout`
- [ ] Fetch requests use `AbortController`
- [ ] No state updates after component unmount

---

## Bundle Size

### Awareness Rules

| Rule                                    | Target                         |
| --------------------------------------- | ------------------------------ |
| Total JS bundle (gzipped)              | < 300KB initial load           |
| Individual route chunk                  | < 100KB gzipped                |
| Monitor after every dependency addition | `npm run build` output         |
| Tree-shake unused imports               | Named imports only             |

### Import Patterns

```typescript
// CORRECT: named imports (tree-shakeable)
import { collection, query, where, limit } from "firebase/firestore";
import { format } from "date-fns";

// FORBIDDEN: namespace imports of large libraries
import * as firebase from "firebase/firestore"; // Imports everything
import _ from "lodash"; // Imports entire lodash

// CORRECT: cherry-pick from lodash (if needed)
import debounce from "lodash/debounce";
```

### Monitoring Build Size

```bash
# After every build, check output
npm run build

# Vite outputs chunk sizes:
# dist/index.html                  0.5 KB
# dist/assets/index-[hash].css    45.2 KB | gzip: 8.1 KB
# dist/assets/index-[hash].js    180.3 KB | gzip: 52.4 KB
# dist/assets/Dashboard-[hash].js 35.1 KB | gzip: 10.2 KB

# If total gzipped JS exceeds 300KB, investigate
```

### Bundle Analysis

```bash
# Use rollup-plugin-visualizer for detailed breakdown
# (configured in vite.config.ts when needed)
npx vite-bundle-visualizer
```

---

## Firestore Optimization

### Query Rules

| Rule                                    | Rationale                      |
| --------------------------------------- | ------------------------------ |
| ALWAYS use `limit()` on collection queries | Prevent full collection scans |
| Use composite indexes for multi-field queries | Required by Firestore      |
| Paginate large result sets              | Memory and bandwidth           |
| Cache frequently-read, rarely-changed data | Reduce read costs           |

### Implementation

```typescript
// CORRECT: limited query
const q = query(
  collection(db, "productos"),
  where("restaurantId", "==", restaurantId),
  where("active", "==", true),
  orderBy("name"),
  limit(100)
);

// FORBIDDEN: unlimited collection read
const q = query(collection(db, "productos")); // Full scan

// CORRECT: paginated query
const q = query(
  collection(db, "productos"),
  where("restaurantId", "==", restaurantId),
  orderBy("name"),
  startAfter(lastVisible),
  limit(25)
);
```

### Denormalization

```typescript
// Store frequently-needed data alongside references
// Instead of: { supplierId: "abc123" } (requires extra read)
// Use: { supplierId: "abc123", supplierName: "Mercadona" } (zero extra reads)
```

---

## Real-Time Data

### Use onSnapshot (No Polling)

```tsx
// CORRECT: real-time listener
useEffect(() => {
  const q = query(
    collection(db, "cierres"),
    where("restaurantId", "==", restaurantId),
    where("date", "==", today),
    limit(1)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      setCierre({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    }
  });

  return () => unsubscribe();
}, [restaurantId, today]);

// FORBIDDEN: polling with setInterval
setInterval(async () => {
  const data = await getDocs(query(collection(db, "cierres"))); // NEVER
}, 5000);
```

### When to Use Real-Time vs One-Time

| Data Pattern                    | Method        | Example                     |
| ------------------------------- | ------------- | --------------------------- |
| Changes frequently, user visible| `onSnapshot`  | Active orders, cash closing |
| Changes rarely, reference data  | `getDoc`      | Restaurant config, tax rates|
| Historical, never changes       | `getDoc`      | Past P&L reports            |
| User is editing (form)          | `getDoc` once | Load form data              |

---

## Lazy Loading

### Feature Modules

```tsx
// Heavy features loaded on demand
const DocumentScanner = lazy(() => import("./features/DocumentScanner"));
const ReportExporter = lazy(() => import("./features/ReportExporter"));
const ChartModule = lazy(() => import("./features/ChartModule"));

// Conditional loading based on user action
function DocumentPage() {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div>
      <button onClick={() => setShowScanner(true)}>
        Scan Document
      </button>
      {showScanner && (
        <Suspense fallback={<Spinner />}>
          <DocumentScanner />
        </Suspense>
      )}
    </div>
  );
}
```

### Third-Party Libraries

```tsx
// Load heavy libraries only when needed
async function exportToPDF(data: ReportData) {
  const { jsPDF } = await import("jspdf"); // Dynamic import
  const doc = new jsPDF();
  // ...
}

async function generateChart(canvas: HTMLCanvasElement) {
  const { Chart } = await import("chart.js"); // Dynamic import
  // ...
}
```

---

## Caching Strategy

### Browser Caching (via Firebase Hosting headers)

| Resource           | Cache-Control                              |
| ------------------ | ------------------------------------------ |
| JS/CSS (hashed)    | `public, max-age=31536000, immutable`      |
| index.html         | `no-cache`                                 |
| Fonts              | `public, max-age=31536000, immutable`      |
| Images             | `public, max-age=86400`                    |

### Firestore Persistence

```typescript
// Enable offline persistence (built into Firebase JS SDK v9+)
// Enabled by default in Firebase JS SDK for web
// No additional configuration needed for basic offline support
```

---

## Offline Capability

### Current: Basic Firestore Persistence

Firebase SDK provides automatic offline caching for previously-read data.

### Future: Service Worker

| Feature                         | Priority  | When                           |
| ------------------------------- | --------- | ------------------------------ |
| Cache static assets             | High      | Phase 1                        |
| Offline data entry              | High      | Phase 2                        |
| Background sync                 | Medium    | Phase 3                        |
| Push notifications              | Low       | Phase 4                        |

**Why important**: Restaurants often have unreliable WiFi. Service staff need to
capture delivery notes and log inventory even when connectivity drops.

---

## Monitoring

### Development Monitoring

```tsx
// React DevTools Profiler
// Chrome DevTools Performance tab
// Lighthouse audits

// Log slow renders in development
if (import.meta.env.DEV) {
  // React Strict Mode double-renders help catch issues
}
```

### Production Monitoring (Future)

| Tool                    | What It Measures            |
| ----------------------- | --------------------------- |
| Firebase Performance    | Page load, network latency  |
| web-vitals library      | LCP, CLS, INP              |
| Error tracking (Sentry) | Runtime errors, crashes     |

---

## Performance Budget

### Summary Table

| Metric                    | Budget          |
| ------------------------- | --------------- |
| LCP                       | <= 2.5s         |
| CLS                       | <= 0.1          |
| INP                       | <= 200ms        |
| Initial JS (gzipped)     | < 300KB         |
| Route chunk (gzipped)    | < 100KB         |
| Image file size           | < 500KB         |
| Font files (total)        | < 200KB         |
| Firestore query results   | limit() always  |
| Time to Interactive       | < 3.5s          |
| Lighthouse Performance    | >= 85           |

### Enforcement

- Check build output size after every dependency addition
- Run Lighthouse before every deploy
- Profile React rendering for new features with lists/tables
- Review Firestore queries for missing `limit()` in code review

---

## Version History

| Date       | Change                          | Author |
| ---------- | ------------------------------- | ------ |
| 2026-03-27 | Initial contract                | Aitor  |
