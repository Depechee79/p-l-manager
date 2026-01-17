# REGLA: Cobertura de Tests

---

## Cuando aplica
- Al medir calidad del testing
- Al priorizar que testear
- En code reviews

---

## Objetivo
Tener cobertura significativa, no solo numeros altos.
Previene: falsa sensacion de seguridad, tests sin valor.

---

## TIPOS DE COBERTURA

| Tipo | Que mide | Importancia |
|------|----------|-------------|
| Line coverage | % lineas ejecutadas | Media |
| Branch coverage | % ramas if/else | Alta |
| Function coverage | % funciones llamadas | Media |
| Statement coverage | % statements ejecutados | Media |

**Branch coverage es la mas importante** - asegura que se prueban todos los caminos.

---

## OBJETIVOS POR MODULO

| Modulo | Coverage minimo | Prioridad |
|--------|-----------------|-----------|
| Servicios de negocio | 80% | CRITICA |
| Funciones de calculo | 90% | CRITICA |
| Validaciones | 85% | CRITICA |
| Hooks con logica | 70% | ALTA |
| Servicios API | 70% | ALTA |
| Utils/Helpers | 80% | ALTA |
| Componentes con logica | 60% | MEDIA |
| Componentes UI puros | 40% | BAJA |
| Pages | 40% | BAJA |

**Coverage global objetivo:** 60-70%

---

## QUE CUBRIR (PRIORIDAD)

### 1. CRITICO - Siempre cubrir

```typescript
// Logica de negocio
function calculateOrderTotal(order: Order): number { ... }
function applyDiscount(price: number, code: string): number { ... }
function validateReservation(data: ReservationInput): ValidationResult { ... }

// Transformaciones de datos
function formatOrderForApi(order: Order): ApiOrderPayload { ... }
function parseApiResponse(response: unknown): User { ... }

// Reglas de negocio
function canUserAccessResource(user: User, resource: Resource): boolean { ... }
function determineOrderStatus(order: Order): OrderStatus { ... }
```

### 2. ALTO - Cubrir siempre que sea posible

```typescript
// Hooks con efectos secundarios
function useOrder() { ... }
function useAuth() { ... }

// Servicios que llaman APIs
const orderService = {
  create: async (data) => { ... },
  update: async (id, data) => { ... },
};

// Estado complejo
function useCartReducer() { ... }
```

### 3. MEDIO - Cubrir happy path

```typescript
// Componentes con logica
function OrderForm({ onSubmit }) { ... }
function FilterableList({ items, filters }) { ... }

// Utils genericos
function debounce(fn, delay) { ... }
function formatDate(date, format) { ... }
```

### 4. BAJO - Opcional

```typescript
// Componentes presentacionales puros
function Button({ label, onClick }) { ... }
function Card({ title, children }) { ... }

// Paginas (mejor cubrir con E2E)
function HomePage() { ... }
function MenuPage() { ... }
```

---

## CASOS A CUBRIR POR FUNCION

Para cada funcion importante, cubrir:

### Happy Path
```typescript
test('returns correct total for valid order', () => {
  const order = { items: [{ price: 10 }, { price: 20 }] };
  expect(calculateTotal(order)).toBe(30);
});
```

### Edge Cases
```typescript
test('returns 0 for empty order', () => {
  expect(calculateTotal({ items: [] })).toBe(0);
});

test('handles single item', () => {
  expect(calculateTotal({ items: [{ price: 10 }] })).toBe(10);
});

test('handles large numbers', () => {
  expect(calculateTotal({ items: [{ price: 999999 }] })).toBe(999999);
});
```

### Error Cases
```typescript
test('throws for null order', () => {
  expect(() => calculateTotal(null)).toThrow();
});

test('throws for negative prices', () => {
  expect(() => calculateTotal({ items: [{ price: -10 }] })).toThrow();
});
```

### Boundary Cases
```typescript
test('handles price of 0', () => {
  expect(calculateTotal({ items: [{ price: 0 }] })).toBe(0);
});

test('handles maximum items', () => {
  const items = Array(1000).fill({ price: 1 });
  expect(calculateTotal({ items })).toBe(1000);
});
```

---

## ANTI-PATRONES DE COVERAGE

### Coverage alto sin valor

```typescript
// MAL: Test que solo "toca" codigo
test('runs without error', () => {
  const result = complexFunction(data);
  // No verifica nada util!
});

// BIEN: Test que verifica comportamiento
test('complexFunction returns expected output', () => {
  const result = complexFunction(data);
  expect(result.status).toBe('success');
  expect(result.data).toEqual(expectedData);
});
```

### Testear implementacion

```typescript
// MAL: Testea como funciona internamente
test('calls internal helper', () => {
  const spy = jest.spyOn(module, 'internalHelper');
  doSomething();
  expect(spy).toHaveBeenCalled();
});

// BIEN: Testea resultado
test('doSomething returns correct result', () => {
  const result = doSomething();
  expect(result).toBe(expectedResult);
});
```

### Ignorar branches

```typescript
// Funcion con 3 branches
function getStatus(value) {
  if (value > 100) return 'high';
  if (value > 50) return 'medium';
  return 'low';
}

// MAL: Solo testea 1 branch
test('returns high for large value', () => {
  expect(getStatus(150)).toBe('high');
});

// BIEN: Testea todas las branches
test('returns high for value > 100', () => {
  expect(getStatus(150)).toBe('high');
});

test('returns medium for value > 50 and <= 100', () => {
  expect(getStatus(75)).toBe('medium');
});

test('returns low for value <= 50', () => {
  expect(getStatus(30)).toBe('low');
});
```

---

## COMANDOS UTILES

```bash
# Ejecutar tests con coverage
npm test -- --coverage

# Ver reporte HTML
npm test -- --coverage --coverageReporters="html"

# Coverage de archivos especificos
npm test -- --coverage --collectCoverageFrom="src/services/**/*.ts"

# Fallar si coverage < umbral
npm test -- --coverage --coverageThreshold='{"global":{"lines":60}}'
```

---

## CONFIGURACION RECOMENDADA

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
```

---

## Verificacion

- [ ] Coverage global >= 60%?
- [ ] Servicios criticos >= 80%?
- [ ] Todas las branches testeadas en funciones criticas?
- [ ] Tests verifican comportamiento, no implementacion?
- [ ] No hay tests "vacios" que solo tocan codigo?

---

*Coverage es una metrica, no un objetivo.*
