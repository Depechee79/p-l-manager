# Testing Strategy Contract — P&L Antigravity

> **Framework:** Vitest 4.0 + Testing Library React 16 + jsdom
> **Config:** `vitest.config.ts`
> **Setup:** `src/test/setup.ts`
> **Current state:** 51 tests, coverage incomplete. Expansion required.
> **Enforced by:** Supreme Rule Section "TESTING"

---

## 1. Test Pyramid

```
        /  E2E  \          ~5%   (future: Playwright)
       / Integration \      ~25%  (component + service interactions)
      /    Unit Tests   \   ~70%  (pure functions, services, hooks)
```

- **Unit tests** are the foundation: fast, isolated, no external dependencies.
- **Integration tests** verify component + hook + service interactions.
- **E2E tests** (future) will cover critical user flows end-to-end.

---

## 2. Coverage Targets

| Category | Target | Rationale |
|----------|--------|-----------|
| Services (`src/core/services/`, `src/services/`) | **80%** | Business logic is the highest-risk code |
| Utility functions (`src/utils/`) | **80%** | Pure functions, easy to test, high ROI |
| Hooks (`src/hooks/`, `src/core/hooks/`) | **70%** | State management logic needs confidence |
| Components (`src/shared/components/`) | **60%** | Behavior tests, not snapshot tests |
| Pages (`src/pages/`) | **40%** | Integration-level, slower to test |
| Feature modules (`src/features/`) | **60%** | Mix of components and services |

Run coverage: `npm run test:coverage`

---

## 3. File Convention

- Test files live **next to the source file** they test.
- Naming: `{filename}.test.ts` or `{filename}.test.tsx`.

```
src/
  services/
    FinanceService.ts
    FinanceService.test.ts       # <-- here
  hooks/
    useFinance.ts
    useFinance.test.ts           # <-- here
  shared/
    components/
      Button.tsx
      Button.test.tsx            # <-- here
```

---

## 4. Test Structure

### 4.1 AAA Pattern (Arrange / Act / Assert)

```typescript
describe('FinanceService', () => {
  describe('calculateFoodCostPercentage', () => {
    it('returns correct percentage for valid inputs', () => {
      // Arrange
      const foodCost = 2800; // cents
      const revenue = 10000; // cents

      // Act
      const result = calculateFoodCostPercentage(foodCost, revenue);

      // Assert
      expect(result).toBe(28);
    });

    it('returns 0 when revenue is zero', () => {
      const result = calculateFoodCostPercentage(500, 0);
      expect(result).toBe(0);
    });
  });
});
```

### 4.2 Naming Convention

```typescript
describe('ComponentOrService', () => {
  describe('methodOrBehavior', () => {
    it('does X when Y', () => { ... });
    it('throws when Z is invalid', () => { ... });
    it('returns empty array when no data', () => { ... });
  });
});
```

- `describe` blocks: name the unit under test.
- `it` blocks: describe the behavior, not the implementation.
- Use natural language: "returns correct percentage" not "test calculateFoodCostPercentage".

---

## 5. Testing Principles

### 5.1 Behavior Over Implementation

```typescript
// CORRECT: Test what it does
it('displays error message when fetch fails', async () => {
  mockFetchCierres.mockRejectedValue(new Error('Network error'));
  render(<CierresPage />);
  expect(await screen.findByText(/error al cargar/i)).toBeInTheDocument();
});

// WRONG: Test how it does it
it('calls setState with error flag', () => { ... }); // Implementation detail
```

### 5.2 Three States Minimum Per Component

Every component with data must test at least:

1. **Ideal state:** Normal data renders correctly.
2. **Empty state:** No data shows empty state with CTA.
3. **Error state:** Failed fetch shows error with retry.

```typescript
describe('CierresList', () => {
  it('renders list of cierres', () => { ... });
  it('shows empty state when no cierres', () => { ... });
  it('shows error state with retry button on failure', () => { ... });
});
```

### 5.3 No Flaky Tests

- Use `vi.useFakeTimers()` when testing time-dependent behavior.
- Use `waitFor` and `findBy*` for async assertions.
- Never use `setTimeout` or `sleep` in tests.
- If a test is flaky, fix it or delete it. Flaky tests are worse than no tests.

---

## 6. Mock Strategy

### 6.1 Mock Firebase, Not Business Logic

```typescript
// CORRECT: Mock the Firebase layer
vi.mock('@services/FinanceService', () => ({
  fetchCierres: vi.fn(),
  saveCierre: vi.fn(),
}));

// WRONG: Mock internal business calculations
vi.mock('./calculateVariance'); // Don't mock the logic you're testing
```

### 6.2 Mock Setup Pattern

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock setup
vi.mock('@core/services/DatabaseService', () => ({
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // MANDATORY in every test suite
  });

  it('saves inventory count to Firestore', async () => {
    // ...
  });
});
```

### 6.3 What to Mock

| Mock | Do Not Mock |
|------|-------------|
| Firebase Firestore calls | Business logic functions |
| Network requests (fetch) | Utility functions (formatters, validators) |
| `import.meta.env` values | React hooks (use renderHook) |
| `Date.now()` (use fake timers) | Component rendering logic |
| External API calls (Claude Vision) | State management |

---

## 7. Component Testing

### 7.1 Render Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button', () => {
  it('renders with label text', () => {
    render(<Button label="Guardar" onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button label="Guardar" onClick={handleClick} />);
    await fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when loading', () => {
    render(<Button label="Guardar" loading={true} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 7.2 Query Priority (Testing Library)

Use queries in this priority order:
1. `getByRole` (accessible, recommended)
2. `getByLabelText` (forms)
3. `getByText` (visible text)
4. `getByTestId` (last resort)

Never use `container.querySelector`. It bypasses accessibility.

---

## 8. Hook Testing

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';

describe('useFinance', () => {
  it('fetches finance data on mount', async () => {
    const mockData = [{ id: '1', total: 1500 }];
    vi.mocked(fetchCierres).mockResolvedValue(mockData);

    const { result } = renderHook(() => useFinance('restaurant-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
  });
});
```

---

## 9. Service Testing

```typescript
describe('FinanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCierre', () => {
    it('writes cierre document with correct fields', async () => {
      const mockSetDoc = vi.mocked(setDoc);

      await saveCierre({
        fecha: '2026-03-15',
        efectivo: 50000,
        restaurantId: 'rest-1',
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fecha: '2026-03-15',
          efectivo: 50000,
          restaurantId: 'rest-1',
        })
      );
    });

    it('throws on Firestore write failure', async () => {
      vi.mocked(setDoc).mockRejectedValue(new Error('permission-denied'));

      await expect(saveCierre({ ... })).rejects.toThrow('permission-denied');
    });
  });
});
```

---

## 10. What NOT to Test

- **Tailwind class names.** They are a visual concern, not a behavioral one.
- **Third-party library internals.** Trust that React Router, Firebase SDK work.
- **Implementation details.** Internal state names, private methods, render counts.
- **Trivial code.** Type definitions, re-export files, constant declarations.

---

## 11. Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run specific test file
npx vitest run src/services/FinanceService.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose -t "calculateFoodCost"
```

---

## 12. Verification Checklist

Before any PR adding or modifying tests:

- [ ] `vi.clearAllMocks()` in every `beforeEach`
- [ ] Tests follow AAA pattern (Arrange/Act/Assert)
- [ ] Component tests cover 3 states: ideal, empty, error
- [ ] No flaky tests (fake timers if time-dependent)
- [ ] Mocks target Firebase/network layer, not business logic
- [ ] Test names describe behavior, not implementation
- [ ] All tests pass: `npm test`
- [ ] No `console.log` in test files (clean output)
- [ ] New services have corresponding `.test.ts` file
- [ ] Coverage does not decrease from baseline
