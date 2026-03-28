# REGLA: Tipos de Tests

---

## Cuando aplica
- Al decidir que tipo de test escribir
- Al disenar estrategia de testing
- Al revisar coverage

---

## Objetivo
Elegir el tipo de test correcto para cada situacion.
Previene: tests innecesarios, falsos positivos, tests lentos.

---

## 1. UNIT TESTS

### Que son
Tests de funciones/metodos aislados, sin dependencias externas.

### Cuando usar
- Funciones puras (input -> output)
- Logica de negocio
- Validaciones
- Calculos
- Transformaciones de datos

### Como escribirlos

```typescript
// Funcion a testear
function calculateDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid discount percentage');
  }
  return price * (1 - discountPercent / 100);
}

// Tests
describe('calculateDiscount', () => {
  // Happy path
  test('applies 10% discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  test('applies 50% discount correctly', () => {
    expect(calculateDiscount(100, 50)).toBe(50);
  });

  // Edge cases
  test('returns original price for 0% discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  test('returns 0 for 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  // Error cases
  test('throws for negative discount', () => {
    expect(() => calculateDiscount(100, -10)).toThrow('Invalid discount');
  });

  test('throws for discount over 100%', () => {
    expect(() => calculateDiscount(100, 150)).toThrow('Invalid discount');
  });
});
```

### Herramientas
- Jest, Vitest
- Testing Library (para hooks)

---

## 2. INTEGRATION TESTS

### Que son
Tests de multiples modulos trabajando juntos.

### Cuando usar
- Servicios que llaman a APIs
- Hooks que usan context
- Componentes con estado complejo
- Flujos que involucran varios modulos

### Como escribirlos

```typescript
// Test de integracion: Hook + Service + Context
describe('useOrder integration', () => {
  test('creates order and updates cart', async () => {
    // Arrange: Setup completo
    const wrapper = ({ children }) => (
      <CartProvider>
        <OrderProvider>{children}</OrderProvider>
      </CartProvider>
    );

    // Act: Usar el hook real
    const { result } = renderHook(() => useOrder(), { wrapper });

    await act(async () => {
      await result.current.createOrder({
        items: [{ id: '1', quantity: 2 }],
      });
    });

    // Assert: Verificar efecto en multiples lugares
    expect(result.current.lastOrder).toBeDefined();
    expect(result.current.cart.items).toHaveLength(0); // Cart limpio
  });
});
```

```typescript
// Test de integracion: Componente + API (con mock de servidor)
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([{ id: '1', name: 'Test User' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('UserList fetches and displays users', async () => {
  render(<UserList />);

  // Esperar a que cargue
  await waitFor(() => {
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

### Herramientas
- Jest + Testing Library
- MSW (Mock Service Worker) para APIs
- Firebase Emulators para Firebase

---

## 3. E2E TESTS (End-to-End)

### Que son
Tests del flujo completo como usuario real.

### Cuando usar
- Flujos criticos de negocio
- Checkout/pagos
- Autenticacion
- Flujos multi-paso

### Como escribirlos

```typescript
// Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Order flow', () => {
  test('user can complete checkout', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Add to cart
    await page.goto('/menu');
    await page.click('[data-testid="add-item-1"]');
    await page.click('[data-testid="add-item-2"]');

    // 3. Go to cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2');

    // 4. Checkout
    await page.click('[data-testid="checkout-button"]');
    await page.fill('[name="address"]', 'Test Address 123');
    await page.click('[data-testid="confirm-order"]');

    // 5. Verify success
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });
});
```

### Herramientas
- Playwright (recomendado)
- Cypress

---

## 4. SMOKE TESTS

### Que son
Tests minimos que verifican que la app "arranca y no explota".

### Cuando usar
- Despues de deploy
- En CI antes de otros tests
- Verificacion rapida de salud

### Como escribirlos

```typescript
// Smoke test basico
describe('Smoke tests', () => {
  test('app loads without errors', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  test('can navigate to main pages', async () => {
    render(<App />);

    // Home loads
    expect(screen.getByTestId('home-page')).toBeInTheDocument();

    // Menu loads
    await userEvent.click(screen.getByRole('link', { name: /menu/i }));
    await waitFor(() => {
      expect(screen.getByTestId('menu-page')).toBeInTheDocument();
    });
  });
});
```

---

## 5. REGRESSION TESTS

### Que son
Tests que verifican que bugs arreglados no vuelven.

### Cuando escribirlos
- SIEMPRE despues de arreglar un bug
- El test debe FALLAR antes del fix y PASAR despues

### Como escribirlos

```typescript
// Bug: calculateTotal no manejaba arrays vacios
// Fix aplicado: return 0 for empty array

describe('calculateTotal - regression tests', () => {
  // REG-001: Bug reportado 2024-01-15
  test('returns 0 for empty array (REG-001)', () => {
    // Este test fallaba antes del fix
    expect(calculateTotal([])).toBe(0);
  });

  // REG-002: Bug con items null
  test('handles null items gracefully (REG-002)', () => {
    expect(calculateTotal([null, { price: 10 }])).toBe(10);
  });
});
```

---

## MATRIZ DE DECISION

| Situacion | Tipo de test |
|-----------|--------------|
| Funcion pura | Unit |
| Validacion | Unit |
| Calculo | Unit |
| Hook simple | Unit |
| Hook con context | Integration |
| Componente + API | Integration |
| Flujo de usuario | E2E |
| Flujo critico (pagos) | E2E |
| Verificar que arranca | Smoke |
| Bug arreglado | Regression |

---

## Verificacion

- [ ] Funciones puras tienen unit tests?
- [ ] Integraciones con APIs tienen integration tests?
- [ ] Flujos criticos tienen E2E?
- [ ] Bugs arreglados tienen regression test?
- [ ] Smoke tests cubren paginas principales?

---

*Cada tipo de test tiene su proposito.*
