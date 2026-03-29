# P&L Antigravity

Gestor de operaciones diarias de hosteleria para restaurantes en Espana. Cierres de caja, albaranes, inventarios, escandallos, gestion de personal, horarios e informes. Pensado para directores de restaurante que quieren saber que pasa en su negocio sin estar fisicamente, y para encargados y camareros que necesitan herramientas moviles rapidas en sala.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 |
| Build | Vite 7.2 |
| Styling | Tailwind CSS 4 |
| Database | Firebase Firestore (project: pylhospitality) |
| Auth | Firebase Authentication |
| Routing | React Router DOM 7 |
| State | Context API + custom hooks |
| Testing | Vitest + React Testing Library |

## Getting Started

```bash
git clone <repo-url>
cd p-l-manager
npm install
cp .env.example .env   # add Firebase credentials
npm run dev             # http://localhost:3004
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3004) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests (Vitest) |
| `npm run test:ui` | Tests with UI |
| `npm run test:coverage` | Coverage report |

## Project Structure

```
src/
├── core/              # Infrastructure (services, contexts, core hooks)
│   ├── context/       # AppContext, DatabaseContext, RestaurantContext
│   ├── hooks/         # useDatabase, useRestaurant
│   ├── services/      # AuthService, DatabaseService, FirestoreService, CompanyService
│   └── utils/         # migration.ts
├── shared/            # Design system + reusable components
│   ├── components/    # 40+ components (Button, Card, Input, Modal, Badge, Select...)
│   │   ├── layout/    # AppShellV2, TopbarV2, SidebarNavV2, MobileBottomNav
│   │   └── ConfigLayout/
│   ├── config/        # systemRoles.ts (6 roles, 18 modules, 33 permissions)
│   ├── hooks/         # Shared generic hooks
│   ├── styles/        # tokens.css (visual source of truth)
│   ├── types/         # Shared UI types
│   └── utils/         # Generic utilities
├── features/          # Business modules (feature-based architecture)
│   ├── cierres/       # Cash register closing (4-step wizard)
│   ├── dashboard/     # Main dashboard with KPIs
│   ├── escandallos/   # Recipes and cost calculation
│   ├── inventarios/   # Stock control
│   ├── invoices/      # Invoices and delivery notes
│   ├── ocr/           # Document recognition (Claude API Vision, planned)
│   ├── orders/        # Supplier orders
│   ├── personal/      # HR, payroll, schedules
│   ├── config/        # Restaurant configuration
│   ├── providers/     # Supplier management
│   └── users/         # Users and permissions
├── pages/             # Top-level page composition
├── types/             # Domain TypeScript types
├── config/            # Firebase config
└── App.tsx            # Routing + providers
```

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | Control panel with KPIs |
| Almacen | `/almacen` | 6 tabs: Existencias, Inventarios, Mermas, Pedidos, Proveedores, Traspasos |
| Cierres | `/cierres` | Cash register closing (wizard with payment methods) |
| Documentos | `/docs` | Document recognition (Claude API Vision, planned) |
| P&L | `/pnl` | 2 tabs: Resultados, Gastos Fijos |
| Escandallos | `/escandallos` | Recipes, cost calculation, margins |
| Personal | `/equipo` | Staff, payroll, schedules |
| Configuracion | `/configuracion` | Restaurant settings (requires configuracion.edit permission) |

## Design System

- **Font:** Public Sans (headings and body)
- **Source of truth:** `src/shared/styles/tokens.css` -- all colors, shadows, z-index, and spacing are defined as CSS custom properties
- **Mobile-first:** 44px minimum touch targets (designed for waiters using phones in dining rooms)
- **Components:** 40+ shared components with named exports, one per file

## Firebase

- **Project:** pylhospitality
- **Services:** Firestore (15 collections) + Authentication (onAuthStateChanged)
- **Region:** europe-west1
- **Cloud Functions:** planned, not yet implemented
- **Security rules:** deny-by-default with canAccessDocument() + hasRestaurantAccess() checks

## Testing

- **383 tests total** (359 passing, 24 skipped integration tests)
- **Framework:** Vitest + React Testing Library
- **Strategy:** behavior over implementation; 3 states minimum per component (ideal, empty, error)
- **Mocks:** Firebase services mocked, business logic tested directly

## License

Private.
