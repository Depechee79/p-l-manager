---
description: "Architecture rules for P&L Manager. Feature-based structure, path aliases, shared-first principle."
paths:
  - "src/**/*"
---

# Architecture Rules -- P&L Manager

## Project Structure

```
src/
  core/           # Infrastructure: services, config, auth, error handling
  shared/         # Design system: components, hooks, styles, utils, types
  features/       # Business modules (one folder per domain)
  pages/          # Page-level composition (thin wrappers over features)
  config/         # Firebase config, env, app constants
  context/        # React contexts (AppContext, DatabaseContext, etc.)
  hooks/          # Global custom hooks
  types/          # Global TypeScript types and interfaces
  utils/          # Global utility functions
  App.tsx         # Root component with providers and router
  main.tsx        # Entry point
```

## Path Aliases

All aliases are defined in `tsconfig.json` and `vite.config.ts`. Always use aliases instead of relative paths when crossing module boundaries.

| Alias         | Maps to            | Usage                              |
|---------------|--------------------|------------------------------------|
| `@shared`     | `src/shared`       | Design system, shared components   |
| `@core`       | `src/core`         | Infrastructure, services           |
| `@services`   | `src/core/services` | Firebase services, API layer      |
| `@context`    | `src/context`      | React contexts                     |
| `@hooks`      | `src/hooks`        | Global custom hooks                |
| `@types`      | `src/types`        | Global type definitions            |
| `@features`   | `src/features`     | Business feature modules           |
| `@pages`      | `src/pages`        | Page compositions                  |
| `@utils`      | `src/utils`        | Global utilities                   |
| `@components` | `src/shared/components` | Shortcut for shared components |

**Rule:** Use relative imports ONLY within the same feature module. Cross-module imports MUST use aliases.

## Feature Module Structure

Each feature in `src/features/` follows this internal layout:

```
features/
  productos/
    components/     # Feature-specific React components
    hooks/          # Feature-specific custom hooks
    services/       # Feature-specific Firebase/API services
    types/          # Feature-specific TypeScript types
    constants.ts    # Feature-specific constants
    index.ts        # Barrel export (public API of the feature)
```

**Rules:**
- Every feature MUST have an `index.ts` barrel file that exports its public API.
- Other features import ONLY from the barrel (`@features/productos`), never from internal paths.
- Feature-internal imports use relative paths.
- A feature MUST NOT import from another feature's internals.

## Shared-First Principle

If a component, hook, utility, or type is used by more than one feature, it MUST live in `src/shared/`.

**Decision flow:**
1. Is it used by only one feature? --> `src/features/<feature>/`
2. Is it used by 2+ features? --> `src/shared/`
3. Is it a design system primitive (Button, Card, Modal, Input, etc.)? --> `src/shared/components/`
4. Is it an infrastructure concern (auth, Firestore, error logging)? --> `src/core/`

**NEVER** duplicate a component across features. Move it to shared.

## Import Order

Enforce this order in every file, separated by blank lines:

```typescript
// 1. React and React-related
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { collection, query, getDocs } from 'firebase/firestore';

// 3. Shared / Design system
import { Button } from '@shared/components/Button';
import { useToast } from '@shared/hooks/useToast';

// 4. Core / Infrastructure
import { getFirestoreInstance } from '@core/services/firestore';

// 5. Features (only from barrel exports)
import { ProductoCard } from '@features/productos';

// 6. Local / relative imports
import { ProductoListItem } from './ProductoListItem';
import type { ProductoFilters } from './types';
```

## Export Rules

- **Named exports only.** No `export default`.
- **One component per file.** File name matches component name in PascalCase.
- **Barrel files** (`index.ts`) re-export the public API of each module.

```typescript
// CORRECT
export function ProductoCard({ producto }: ProductoCardProps) { ... }

// WRONG
export default function ProductoCard({ producto }: ProductoCardProps) { ... }
```

## Firebase Singleton Pattern

Firebase instances MUST be obtained inside function bodies, never at module level. This prevents initialization order issues and supports testing.

```typescript
// CORRECT
export async function getProductos(restaurantId: string) {
  const db = getFirestoreInstance();
  const ref = collection(db, 'productos');
  // ...
}

// WRONG -- module-level initialization
const db = getFirestoreInstance();
export async function getProductos(restaurantId: string) {
  const ref = collection(db, 'productos');
  // ...
}
```

## Pages as Composition Layer

Pages in `src/pages/` are thin composition wrappers. They:
- Import feature components and compose them into a layout.
- Handle route params and pass them down.
- Do NOT contain business logic, Firebase queries, or complex state.

```typescript
// src/pages/ProductosPage.tsx
export function ProductosPage() {
  return (
    <AppShellV2>
      <ProductoList />
    </AppShellV2>
  );
}
```

## Monorepo Preparation

The project is preparing for a monorepo structure (app + admin). To ensure smooth migration:

- Shared code MUST have zero feature-specific dependencies.
- Firebase config and services are in `src/core/` (will become a shared package).
- Feature modules are self-contained and can be split across apps.
- Types shared between apps live in `src/types/` (will become `packages/types`).

## Naming Conventions

| Entity              | Convention     | Example                          |
|---------------------|----------------|----------------------------------|
| Components          | PascalCase     | `ProductoCard.tsx`               |
| Hooks               | camelCase, `use` prefix | `useProductos.ts`       |
| Services            | camelCase      | `productosService.ts`            |
| Types/Interfaces    | PascalCase     | `Producto`, `ProductoFormData`   |
| Constants           | SCREAMING_SNAKE | `MAX_PRODUCTOS_PER_PAGE`        |
| Files (non-component) | camelCase    | `formatters.ts`, `validators.ts` |
| CSS files           | camelCase      | `tokens.css`, `globals.css`      |
| Feature folders     | camelCase      | `productos/`, `gastosFijos/`     |

## Forbidden Patterns

- No circular imports between features.
- No `../../..` deep relative imports crossing module boundaries.
- No business logic in `src/pages/`.
- No Firebase calls outside `src/core/services/` or feature `services/`.
- No `any` type. No `@ts-ignore`. No `as unknown as X`.
- No `console.log` in committed code.
- No hardcoded strings that should be constants.
