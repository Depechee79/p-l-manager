# REGLA: TypeScript

---

## Cuando aplica
- Todo codigo TypeScript
- Configuracion de proyectos
- Tipos y interfaces

---

## CONFIGURACION TSCONFIG

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## TIPOS OBLIGATORIOS

```typescript
// SIEMPRE tipar parametros y retornos
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// NUNCA usar any
// MAL
function process(data: any): any { }

// BIEN
function process<T>(data: T): ProcessedResult<T> { }
```

---

## INTERFACES VS TYPES

```typescript
// Interfaces: para objetos y contratos
interface User {
  id: string;
  name: string;
  email: string;
}

// Types: para unions, intersections, utilities
type Status = 'pending' | 'active' | 'inactive';
type UserWithRole = User & { role: Role };
```

---

## GENERICS

```typescript
// Usar generics para reutilizacion
interface ApiResponse<T> {
  data: T;
  error: string | null;
  loading: boolean;
}

// Constraints cuando sea necesario
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

---

## ENUMS VS CONST

```typescript
// Preferir const assertions sobre enums
// MAL
enum Status {
  Pending = 'pending',
  Active = 'active',
}

// BIEN
const STATUS = {
  Pending: 'pending',
  Active: 'active',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];
```

---

## NULL HANDLING

```typescript
// Usar optional chaining y nullish coalescing
const userName = user?.profile?.name ?? 'Anonymous';

// Type guards para narrowing
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

---

## Verificacion

- [ ] strict: true en tsconfig?
- [ ] Sin any en el codigo?
- [ ] Funciones tipadas?
- [ ] Interfaces para objetos?
- [ ] Type guards donde necesario?

