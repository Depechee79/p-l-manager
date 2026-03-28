# REGLA: Naming Conventions

---

## Cuando aplica
- Todo codigo: variables, funciones, clases, archivos, carpetas
- Sin excepciones

---

## Objetivo
Nombres claros, consistentes y autodocumentados.
Previene: confusion, errores, tiempo perdido buscando que hace cada cosa.

---

## CONVENCIONES POR TIPO

### Variables y Constantes

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Variables | camelCase | `userName`, `orderTotal` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Booleanos | is/has/can/should prefix | `isLoading`, `hasError`, `canEdit` |
| Arrays | plural | `users`, `menuItems`, `orders` |
| Objetos/Maps | singular o descriptivo | `userById`, `configMap` |

```typescript
// BIEN
const isAuthenticated = true;
const hasPermissions = user.roles.length > 0;
const canEditMenu = isAdmin || isOwner;
const menuItems = [...];
const userById = new Map();

// MAL
const auth = true;       // No claro
const perms = true;      // Abreviado
const edit = true;       // Verbo sin prefijo
const item = [...];      // Singular para array
```

### Funciones y Metodos

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Funciones | camelCase, verbo + sustantivo | `getUserById`, `calculateTotal` |
| Event handlers | handle + Evento | `handleClick`, `handleSubmit` |
| Async | verbo que implique async | `fetchUser`, `loadData` |
| Getters | get + Sustantivo | `getFullName`, `getPrice` |
| Setters | set + Sustantivo | `setUserName`, `setStatus` |
| Validadores | validate/is/check | `validateEmail`, `isValidDate` |
| Transformadores | to/from/parse/format | `toUpperCase`, `parseDate` |

```typescript
// BIEN
function getUserById(id: string) { ... }
function calculateOrderTotal(items: Item[]) { ... }
function handleMenuClick(item: MenuItem) { ... }
async function fetchUserData() { ... }
function validateEmailFormat(email: string) { ... }
function formatCurrency(amount: number) { ... }

// MAL
function user(id: string) { ... }        // Sin verbo
function calc(items: Item[]) { ... }     // Abreviado
function click(item: MenuItem) { ... }   // Sin handle
function data() { ... }                  // Muy generico
```

### Componentes React

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase | `UserProfile`, `MenuList` |
| HOCs | with + Nombre | `withAuth`, `withLoading` |
| Hooks | use + Nombre | `useUser`, `useLocalStorage` |
| Context | NombreContext | `AuthContext`, `ThemeContext` |
| Providers | NombreProvider | `AuthProvider`, `ThemeProvider` |

```typescript
// BIEN
function UserProfile() { ... }
function MenuItemCard({ item }) { ... }
function useAuth() { ... }
function withPermissions(Component) { ... }
const AuthContext = createContext();

// MAL
function userprofile() { ... }    // No PascalCase
function menu_item() { ... }      // Snake case
function authHook() { ... }       // Sin use prefix
```

### Archivos y Carpetas

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase.tsx | `UserProfile.tsx`, `MenuList.tsx` |
| Hooks | camelCase.ts | `useAuth.ts`, `useLocalStorage.ts` |
| Utils/Services | camelCase.ts | `authService.ts`, `dateUtils.ts` |
| Types | camelCase.ts | `user.types.ts`, `menu.types.ts` |
| Constantes | camelCase.ts | `constants.ts`, `config.ts` |
| Carpetas | kebab-case | `user-profile/`, `menu-items/` |

```
// BIEN
src/
├── components/
│   ├── UserProfile.tsx
│   └── MenuItemCard.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useMenu.ts
├── services/
│   ├── authService.ts
│   └── menuService.ts
└── types/
    └── user.types.ts

// MAL
src/
├── components/
│   ├── userProfile.tsx     // No PascalCase
│   └── menu_item_card.tsx  // Snake case
├── Hooks/                  // Carpeta PascalCase
│   └── UseAuth.ts          // Archivo PascalCase
```

### Types e Interfaces

| Tipo | Convencion | Ejemplo |
|------|------------|---------|
| Interfaces | PascalCase, sin I prefix | `User`, `MenuItem` |
| Types | PascalCase | `OrderStatus`, `ApiResponse` |
| Enums | PascalCase, valores UPPER_SNAKE | `enum Status { PENDING, ACTIVE }` |
| Props | NombreProps | `UserProfileProps`, `ButtonProps` |

```typescript
// BIEN
interface User {
  id: string;
  name: string;
}

type OrderStatus = 'pending' | 'completed' | 'cancelled';

enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer'
}

interface ButtonProps {
  label: string;
  onClick: () => void;
}

// MAL
interface IUser { ... }       // Prefijo I innecesario
type order_status = ...;      // Snake case
enum paymentMethod { ... }    // camelCase
```

---

## REGLAS GENERALES

### Longitud de nombres
- **Variables:** 2-20 caracteres
- **Funciones:** 3-30 caracteres
- **Clases/Componentes:** 3-25 caracteres

### Evitar
- Abreviaciones no obvias (`usr`, `mgr`, `btn` OK, `usrPrflMgr` MAL)
- Nombres de una letra (excepto `i`, `j` en loops, `e` en eventos)
- Numeros al final (`user1`, `data2`)
- Nombres genericos (`data`, `info`, `temp`, `stuff`)

### Consistencia
- Usa el mismo nombre para el mismo concepto en todo el proyecto
- Si es `user` en un lugar, no uses `cliente` en otro

```typescript
// BIEN: Consistente
const user = await fetchUser();
const userProfile = getProfile(user);
const userId = user.id;

// MAL: Inconsistente
const user = await fetchUser();
const clientProfile = getProfile(user);  // "client" vs "user"
const id = user.id;                       // Muy generico
```

---

## Verificacion

- [ ] Variables con nombres descriptivos?
- [ ] Booleanos con prefijo is/has/can?
- [ ] Funciones con verbo + sustantivo?
- [ ] Componentes en PascalCase?
- [ ] Archivos con convencion correcta?
- [ ] Sin abreviaciones confusas?
- [ ] Nombres consistentes en todo el proyecto?

---

*Buen nombre = codigo autodocumentado.*
