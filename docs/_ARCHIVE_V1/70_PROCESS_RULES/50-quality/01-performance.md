# REGLA: Performance

---

## Cuando aplica
- Desarrollo de UI
- Llamadas a APIs
- Listas y tablas con muchos datos
- Carga inicial de la aplicacion

---

## Objetivo
Mantener la aplicacion rapida y responsiva.
Previene: usuarios frustrados, abandono, mala experiencia.

---

## CORE WEB VITALS

| Metrica | Objetivo | Que mide |
|---------|----------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Tiempo hasta que se ve el contenido principal |
| **FID/INP** (Interaction to Next Paint) | < 200ms | Respuesta a interacciones |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Cuanto "salta" el layout |

---

## BUDGETS DE PERFORMANCE

### Tamano de bundle

| Tipo | Limite | Accion si excede |
|------|--------|------------------|
| Bundle inicial (JS) | < 200KB gzipped | Code splitting obligatorio |
| CSS inicial | < 50KB | Purgar CSS no usado |
| Imagenes hero | < 100KB | Optimizar, usar WebP |
| Total primera carga | < 500KB | Auditar dependencias |

### Tiempos de carga

| Metrica | Objetivo | Medicion |
|---------|----------|----------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Speed Index | < 3.4s | Lighthouse |

---

## TECNICAS DE OPTIMIZACION

### 1. Lazy Loading

```typescript
// Lazy load de componentes
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Lazy load de rutas (Next.js)
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <Loading />,
  ssr: false, // Si no necesita SSR
});
```

### 2. Code Splitting

```typescript
// Importacion dinamica
const handleClick = async () => {
  // Solo carga la libreria cuando se necesita
  const { format } = await import('date-fns');
  setFormattedDate(format(date, 'yyyy-MM-dd'));
};

// Rutas con code splitting (Next.js App Router)
// Cada carpeta en /app es un chunk separado automaticamente
```

### 3. Memoizacion

```typescript
// useMemo para calculos costosos
const expensiveResult = useMemo(() => {
  return items.reduce((acc, item) => {
    // Calculo costoso
    return acc + heavyCalculation(item);
  }, 0);
}, [items]); // Solo recalcula si items cambia

// useCallback para funciones
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []); // Referencia estable

// React.memo para componentes
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});
```

### 4. Virtualizacion (listas largas)

```typescript
// Con react-virtual o react-window
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Altura estimada de cada item
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Debounce y Throttle

```typescript
// Debounce: esperar a que pare de escribir
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebouncedCallback((value) => {
    fetchSearchResults(value);
  }, 300); // 300ms delay

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}

// Throttle: limitar frecuencia
import { throttle } from 'lodash';

const throttledScroll = throttle((e) => {
  handleScroll(e);
}, 100); // Max 1 vez cada 100ms
```

### 6. Optimizacion de imagenes

```typescript
// Next.js Image (optimizado automaticamente)
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={800}
  height={600}
  priority // Para imagenes above the fold
  placeholder="blur"
  blurDataURL={blurUrl}
/>

// Lazy loading nativo
<img
  src="/image.jpg"
  loading="lazy"
  decoding="async"
/>
```

---

## ANTI-PATRONES DE PERFORMANCE

### Renders innecesarios

```typescript
// MAL: Nuevo objeto en cada render
<Component style={{ margin: 10 }} />

// BIEN: Objeto estable
const styles = { margin: 10 };
<Component style={styles} />

// MAL: Funcion nueva en cada render
<Button onClick={() => handleClick(id)} />

// BIEN: useCallback
const handleClick = useCallback(() => { ... }, [id]);
<Button onClick={handleClick} />
```

### Waterfalls de requests

```typescript
// MAL: Requests secuenciales
async function loadData() {
  const user = await fetchUser();      // 200ms
  const orders = await fetchOrders();  // 200ms
  const products = await fetchProducts(); // 200ms
  // Total: 600ms
}

// BIEN: Requests paralelas
async function loadData() {
  const [user, orders, products] = await Promise.all([
    fetchUser(),     // 200ms
    fetchOrders(),   // 200ms  } Total: 200ms
    fetchProducts(), // 200ms
  ]);
}
```

### N+1 queries

```typescript
// MAL: N+1 queries
const orders = await getOrders();
for (const order of orders) {
  order.user = await getUser(order.userId); // 1 query por orden!
}

// BIEN: Batch query
const orders = await getOrders();
const userIds = [...new Set(orders.map(o => o.userId))];
const users = await getUsersByIds(userIds); // 1 query
const userMap = new Map(users.map(u => [u.id, u]));
orders.forEach(o => o.user = userMap.get(o.userId));
```

---

## HERRAMIENTAS DE MEDICION

```bash
# Lighthouse CLI
npx lighthouse https://example.com --view

# Bundle analyzer (Next.js)
npm install @next/bundle-analyzer
# next.config.js: withBundleAnalyzer(nextConfig)

# React DevTools Profiler
# Chrome extension -> Profiler tab
```

---

## Verificacion

- [ ] Bundle inicial < 200KB gzipped?
- [ ] LCP < 2.5s?
- [ ] Listas largas virtualizadas?
- [ ] Imagenes optimizadas?
- [ ] Memoizacion donde es necesario?
- [ ] Sin waterfalls de requests?

---

*Performance es feature, no optimizacion prematura.*
