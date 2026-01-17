# REGLA: Estrategia de Testing

---

## Cuando aplica
- Todo codigo nuevo
- Bugs arreglados (regression test)
- Refactorizaciones

---

## Objetivo
Garantizar que el codigo funciona y sigue funcionando.
Previene: bugs en produccion, regresiones, miedo a refactorizar.

---

## PIRAMIDE DE TESTING

```
        /\
       /  \
      / E2E \        <- Pocos, lentos, costosos
     /--------\
    /Integration\    <- Algunos, balance
   /--------------\
  /   Unit Tests   \ <- Muchos, rapidos, baratos
 /------------------\
```

| Tipo | Cantidad | Velocidad | Coste | Que prueba |
|------|----------|-----------|-------|------------|
| Unit | 70% | Rapido | Bajo | Funciones aisladas |
| Integration | 20% | Medio | Medio | Modulos juntos |
| E2E | 10% | Lento | Alto | Flujos completos |

---

## CUANDO ESCRIBIR TESTS

### SIEMPRE escribir tests para:
- Logica de negocio critica
- Funciones de calculo (precios, totales, descuentos)
- Validaciones
- Transformaciones de datos
- Servicios que llaman a APIs
- Bugs arreglados (regression test)

### OPCIONAL escribir tests para:
- Componentes UI puramente presentacionales
- Codigo trivial (getters simples)
- Codigo generado automaticamente

### NUNCA testear:
- Implementaciones internas de librerias externas
- Codigo que va a ser eliminado

---

## PRINCIPIOS DE TESTING

### 1. Arrange-Act-Assert (AAA)

```typescript
test('calculateTotal returns sum of item prices', () => {
  // Arrange - Preparar datos
  const items = [
    { name: 'Item 1', price: 10 },
    { name: 'Item 2', price: 20 },
  ];

  // Act - Ejecutar accion
  const result = calculateTotal(items);

  // Assert - Verificar resultado
  expect(result).toBe(30);
});
```

### 2. Un test = Una cosa

```typescript
// MAL: Testea multiples cosas
test('user operations', () => {
  const user = createUser({ name: 'Test' });
  expect(user.name).toBe('Test');
  expect(user.id).toBeDefined();

  user.name = 'Updated';
  expect(user.name).toBe('Updated');

  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();
});

// BIEN: Un test por comportamiento
test('createUser sets name correctly', () => {
  const user = createUser({ name: 'Test' });
  expect(user.name).toBe('Test');
});

test('createUser generates id', () => {
  const user = createUser({ name: 'Test' });
  expect(user.id).toBeDefined();
});

test('updateUser changes name', () => {
  const user = createUser({ name: 'Test' });
  user.name = 'Updated';
  expect(user.name).toBe('Updated');
});
```

### 3. Tests independientes

- Cada test debe poder correr solo
- No depender del orden de ejecucion
- Limpiar estado entre tests

```typescript
// BIEN: Independiente
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(); // Fresh instance
  });

  test('creates user', () => { ... });
  test('deletes user', () => { ... });
});
```

### 4. Tests legibles

El nombre del test debe describir el comportamiento:

```typescript
// MAL: Nombres genericos
test('test1', () => { ... });
test('user test', () => { ... });

// BIEN: Describe comportamiento
test('calculateTotal returns 0 for empty cart', () => { ... });
test('calculateTotal sums all item prices', () => { ... });
test('calculateTotal applies discount when code is valid', () => { ... });
```

---

## COVERAGE OBJETIVO

| Modulo | Coverage minimo |
|--------|-----------------|
| Logica de negocio | 80% |
| Servicios/APIs | 70% |
| Hooks | 70% |
| Utils | 80% |
| Componentes UI | 50% |
| Pages | 40% |

**Coverage global objetivo:** 60-70%

**IMPORTANTE:** Coverage alto != tests buenos. Priorizar tests significativos sobre coverage.

---

## HACER (obligatorio)

- Escribir test ANTES de arreglar bug (TDD lite)
- Cubrir happy path + edge cases principales
- Nombrar tests descriptivamente
- Mantener tests rapidos (< 5 segundos para unit)
- Ejecutar tests antes de commit

---

## EVITAR (prohibido)

- Tests que dependen del orden
- Tests que acceden a produccion
- Tests flaky (fallan intermitentemente)
- Tests que testean implementacion interna
- Ignorar tests fallidos

---

## Verificacion

- [ ] Logica de negocio tiene tests?
- [ ] Bugs arreglados tienen regression test?
- [ ] Tests siguen AAA?
- [ ] Nombres de tests son descriptivos?
- [ ] Tests corren en < 30 segundos?
- [ ] No hay tests flaky?

---

*Tests son documentacion ejecutable.*
