# Routing Contract

> Source of truth for all routing patterns, conventions, and navigation rules
> in the P&L Manager project. Every route MUST follow this contract.

---

## Table of Contents

1. [Routing Library](#routing-library)
2. [Route Conventions](#route-conventions)
3. [Current Route Map](#current-route-map)
4. [Auth Routes](#auth-routes)
5. [Tab-Based Routing](#tab-based-routing)
6. [Code Splitting](#code-splitting)
7. [Route Protection](#route-protection)
8. [Navigation Patterns](#navigation-patterns)
9. [Redirects](#redirects)
10. [Future Routes](#future-routes)
11. [Adding New Routes](#adding-new-routes)
12. [Route Testing](#route-testing)

---

## Routing Library

| Setting        | Value               |
| -------------- | ------------------- |
| Library        | React Router v7     |
| Mode           | Browser (HTML5 History API) |
| Base Path      | `/`                 |
| SPA Fallback   | `index.html` (Firebase rewrite) |

```tsx
// Root router setup
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes defined here */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Route Conventions

### URL Patterns

| Pattern                      | Use Case          | Example                    |
| ---------------------------- | ----------------- | -------------------------- |
| `/{resource}`                | List/index page   | `/almacen`, `/cierres`     |
| `/{resource}/:id`            | Detail page       | `/almacen/prod_abc123`     |
| `/{resource}/nuevo`          | Create page       | `/escandallos/nuevo`       |
| `/{resource}/:id/editar`     | Edit page         | `/escandallos/esc_123/editar` |
| `?tab=value`                 | Sub-page/tab      | `/almacen?tab=productos`   |

### Naming Rules

| Rule                                  | Example                        |
| ------------------------------------- | ------------------------------ |
| Lowercase, kebab-case                 | `/crear-negocio`, not `/crearNegocio` |
| Spanish for user-facing routes        | `/almacen`, `/cierres`, `/equipo` |
| Plural for collections                | `/escandallos`, not `/escandallo` |
| Singular for singleton pages          | `/configuracion`, `/pnl`       |
| No trailing slashes                   | `/almacen`, not `/almacen/`    |
| No file extensions                    | `/docs`, not `/docs.html`      |

### URL Parameters

```tsx
// Dynamic segments for entity IDs
<Route path="/almacen/:productId" element={<ProductDetail />} />

// Access in component
import { useParams } from "react-router-dom";

function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  // productId is typed as string | undefined
}
```

---

## Current Route Map

### Application Routes

| Path               | Component              | Description                    | Auth Required | Code Split |
| ------------------ | ---------------------- | ------------------------------ | ------------- | ---------- |
| `/`                | DashboardPage          | Main dashboard with KPIs       | Yes           | No         |
| `/almacen`         | AlmacenPage            | Inventory (6 tabs)             | Yes           | No         |
| `/cierres`         | CierresPage            | Cash closings                  | Yes           | No         |
| `/docs`            | OCRPage                | Document scanning/OCR          | Yes           | No         |
| `/pnl`             | PnLPage                | Profit & Loss (2 tabs)         | Yes (pnl.view) | No       |
| `/escandallos`     | EscandallosPage        | Recipe costing                 | Yes           | No         |
| `/equipo`          | PersonalPage           | Staff/personnel management     | Yes           | No         |
| `/configuracion`   | RestaurantConfigPage   | Settings                       | Yes (configuracion.edit) | No |

### Auth Routes

| Path               | Component              | Description                    | Auth Required | Code Split |
| ------------------ | ---------------------- | ------------------------------ | ------------- | ---------- |
| `/login`           | LoginPage              | Email/password login           | No            | No         |
| `/crear-negocio`   | SignUpPage             | New business onboarding        | No (pre-auth) | No         |
| `/registro`        | InvitationSignUpPage   | Invitation-based registration  | No            | No         |

### Route Hierarchy

```
/                          -> Dashboard
/login                     -> Login (public)
/crear-negocio             -> Create Business (post-signup)
/registro                  -> Register via invitation (public)
/almacen                   -> Inventory
  ?tab=productos           -> Products tab
  ?tab=proveedores         -> Suppliers tab
  ?tab=categorias          -> Categories tab
  ?tab=unidades            -> Units tab
  ?tab=familias            -> Families tab
  ?tab=mermas              -> Waste/shrinkage tab
/cierres                   -> Cash Closings
/docs                      -> Document Recognition (OCR)
/pnl                       -> Profit & Loss
  ?tab=mensual             -> Monthly P&L tab
  ?tab=anual               -> Annual P&L tab
/escandallos               -> Recipe Costing
/equipo                    -> Personnel
/configuracion             -> Settings
```

---

## Auth Routes

### Public Routes (No Auth Required)

```tsx
// These routes are accessible without authentication
<Route path="/login" element={<Login />} />
<Route path="/registro" element={<Register />} />
```

### Protected Routes (Auth Required)

```tsx
// ALL other routes require authentication
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Dashboard />} />
  <Route path="/almacen" element={<Almacen />} />
  {/* ... */}
</Route>
```

### Post-Auth Redirect

```tsx
// After login, redirect to:
// 1. The page user tried to access (saved in location state)
// 2. Dashboard (/) as default

function Login() {
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/";

  async function handleLogin() {
    await signIn(email, password);
    navigate(from, { replace: true });
  }
}
```

---

## Tab-Based Routing

### Convention

Sub-pages within a route use query parameters, not nested routes.

```
/almacen?tab=productos      (not /almacen/productos)
/pnl?tab=mensual            (not /pnl/mensual)
/configuracion?tab=general   (not /configuracion/general)
```

### Implementation

```tsx
import { useSearchParams } from "react-router-dom";

type AlmacenTab = "productos" | "proveedores" | "categorias" | "unidades" | "familias" | "mermas";

function Almacen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as AlmacenTab) || "productos";

  function handleTabChange(tab: AlmacenTab) {
    setSearchParams({ tab });
  }

  return (
    <div>
      <TabBar
        tabs={ALMACEN_TABS}
        active={activeTab}
        onChange={handleTabChange}
      />
      {activeTab === "productos" && <ProductosTab />}
      {activeTab === "proveedores" && <ProveedoresTab />}
      {activeTab === "categorias" && <CategoriasTab />}
      {activeTab === "unidades" && <UnidadesTab />}
      {activeTab === "familias" && <FamiliasTab />}
      {activeTab === "mermas" && <MermasTab />}
    </div>
  );
}
```

### Tab Definition Pattern

```tsx
// Define tabs as a constant with metadata
const ALMACEN_TABS = [
  { id: "productos", label: "Productos", icon: PackageIcon },
  { id: "proveedores", label: "Proveedores", icon: TruckIcon },
  { id: "categorias", label: "Categorias", icon: TagIcon },
  { id: "unidades", label: "Unidades", icon: RulerIcon },
  { id: "familias", label: "Familias", icon: FolderIcon },
  { id: "mermas", label: "Mermas", icon: AlertIcon },
] as const;
```

### Rules

| Rule                                    | Rationale                                |
| --------------------------------------- | ---------------------------------------- |
| Default tab when no `?tab` param        | First tab in the list                    |
| Tab change preserves other query params | Use `setSearchParams` correctly          |
| Tab state is URL-driven (not useState)  | Shareable URLs, browser back works       |
| Invalid tab value falls back to default | Defensive: `|| "productos"`              |

---

## Code Splitting

### Code Splitting Status

> **NOTA:** Code splitting con `React.lazy()` es prioridad baja y no esta implementado actualmente. Todas las rutas se importan sincronamente en `App.tsx`. Los ejemplos a continuacion muestran el patron objetivo para cuando se implemente.

```tsx
// Patron objetivo (NO implementado actualmente):
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
// etc.

<Suspense fallback={<PageSkeleton />}>
  <Routes>
    {/* ... lazy routes */}
  </Routes>
</Suspense>
```

---

## Route Protection

### ProtectedRoute Component

> **NOTA:** El patron actual en `App.tsx` NO usa `<Outlet>`. La autenticacion se resuelve a nivel de `AppContent`: si el usuario no esta autenticado, se muestra un router separado con solo `/login`, `/crear-negocio`, `/registro` y catch-all a `/login`. Las rutas autenticadas se renderizan directamente dentro de `<AppShellV2>`. `ProtectedRoute` se usa solo para rutas que requieren permisos especificos, con la prop `element` (no Outlet).

```tsx
// Patron ACTUAL en App.tsx:
// Rutas con permisos especificos usan ProtectedRoute con element prop:
<Route
  path="/pnl"
  element={
    <ProtectedRoute
      element={<PnLPage />}
      requiredPermissions={['pnl.view']}
    />
  }
/>

// Rutas sin permisos especificos se renderizan directamente:
<Route path="/" element={<DashboardPage />} />
```

### Protection Rules

| Route              | Protection Level                        |
| ------------------ | --------------------------------------- |
| `/login`           | Public (redirect to `/` if logged in)   |
| `/registro`        | Public (invitation token required)      |
| `/crear-negocio`   | Auth required (no restaurant yet)       |
| All others         | Auth + restaurant membership required   |
| `/configuracion`   | Auth + admin/owner role (future)        |

---

## Navigation Patterns

### Programmatic Navigation

```tsx
import { useNavigate } from "react-router-dom";

function ProductList() {
  const navigate = useNavigate();

  function handleProductClick(productId: string) {
    navigate(`/almacen/${productId}`);
  }

  function handleBack() {
    navigate(-1); // Go back in history
  }
}
```

### Navigation Rules

| Rule                                          | Implementation                    |
| --------------------------------------------- | --------------------------------- |
| No breadcrumbs                                | Use programmatic back navigation  |
| Back button in detail pages                   | `navigate(-1)` or explicit route  |
| After create/edit success                     | Navigate to list/detail page      |
| After delete success                          | Navigate to list page             |
| Links use `<Link>` component                  | Never `<a href>` for internal     |

### Link Component

```tsx
import { Link } from "react-router-dom";

// CORRECT: internal navigation
<Link to="/almacen?tab=productos">View Products</Link>

// FORBIDDEN: plain anchor for internal routes
<a href="/almacen">Products</a> // Causes full page reload
```

---

## Redirects

### Old Route Redirects

Redirects actuales en `App.tsx`:

```tsx
<Route path="/ocr" element={<Navigate to="/docs" replace />} />
<Route path="/proveedores" element={<Navigate to="/almacen?tab=proveedores" replace />} />
<Route path="/transferencias" element={<Navigate to="/almacen?tab=traspasos" replace />} />
<Route path="/gastos-fijos" element={<Navigate to="/pnl?tab=gastos-fijos" replace />} />
<Route path="/inventario" element={<Navigate to="/almacen" replace />} />
<Route path="/inventarios" element={<Navigate to="/almacen" replace />} />
<Route path="/mermas" element={<Navigate to="/almacen?tab=mermas" replace />} />
<Route path="/pedidos" element={<Navigate to="/almacen?tab=pedidos" replace />} />
<Route path="/nominas" element={<Navigate to="/equipo" replace />} />
<Route path="/roles" element={<Navigate to="/configuracion?tab=roles" replace />} />
<Route path="/ingenieria-menu" element={<Navigate to="/escandallos?tab=analisis" replace />} />
<Route path="/personal" element={<Navigate to="/equipo" replace />} />
<Route path="/usuarios" element={<Navigate to="/equipo" replace />} />
<Route path="*" element={<Navigate to="/" replace />} />
```

### 404 Handling

```tsx
// Catch-all route at the end
<Route path="*" element={<NotFound />} />

// NotFound component offers navigation back
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-gray-600 mt-2">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-4 text-blue-600 hover:underline">
        Go to Dashboard
      </Link>
    </div>
  );
}
```

---

## Future Routes

### Admin App (Separate Router)

| Path                  | Component         | Description                    |
| --------------------- | ----------------- | ------------------------------ |
| `/`                   | AdminDashboard    | Admin overview                 |
| `/negocios`           | BusinessList      | All businesses                 |
| `/negocios/:id`       | BusinessDetail    | Business detail                |
| `/usuarios`           | UserList          | All users                      |
| `/facturacion`        | Billing           | Billing management             |
| `/logs`               | AuditLogs         | System audit logs              |

### Planned App Routes

| Path                  | Component         | Description                    |
| --------------------- | ----------------- | ------------------------------ |
| `/almacen/:id`        | ProductDetail     | Product detail page            |
| `/almacen/:id/editar` | ProductEdit       | Product edit page              |
| `/escandallos/:id`    | EscandallDetail   | Recipe detail page             |
| `/cierres/:id`        | CierreDetail      | Closing detail page            |
| `/docs/:id`           | DocumentDetail    | Document review page           |

---

## Adding New Routes

### Checklist for New Routes

- [ ] Route path follows naming conventions (lowercase, kebab-case, Spanish)
- [ ] Component is lazy-loaded (`React.lazy`)
- [ ] Route is inside `ProtectedRoute` (if auth required)
- [ ] Permission check added (if role-restricted)
- [ ] Added to route map in this contract
- [ ] Old path redirects added (if replacing existing route)
- [ ] Navigation links updated (sidebar, bottom nav)
- [ ] Page has a meaningful `<title>` (via `useEffect` or helmet)

### Template

```tsx
// 1. Create the page component
// src/pages/NewPage.tsx
export default function NewPage() {
  return <div>New Page Content</div>;
}

// 2. Add lazy import in App.tsx
const NewPage = lazy(() => import("./pages/NewPage"));

// 3. Add route inside ProtectedRoute
<Route path="/new-page" element={<NewPage />} />

// 4. Add navigation link in sidebar/bottom nav
```

---

## Route Testing

### Manual Verification

- [ ] Direct URL access works (paste URL in browser)
- [ ] Browser back/forward works correctly
- [ ] Tab changes update URL
- [ ] Login redirect preserves intended destination
- [ ] 404 page shows for invalid routes
- [ ] Protected routes redirect to login when not authenticated

### Automated Testing (Future)

```tsx
// Route existence tests
describe("Routes", () => {
  it("renders Dashboard at /", () => {
    render(<App />, { route: "/" });
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    render(<App />, { route: "/almacen" });
    expect(window.location.pathname).toBe("/login");
  });

  it("redirects old /inventario to /almacen", () => {
    render(<App />, { route: "/inventario" });
    expect(window.location.pathname).toBe("/almacen");
  });
});
```

---

## Version History

| Date       | Change                          | Author |
| ---------- | ------------------------------- | ------ |
| 2026-03-27 | Initial contract                | Aitor  |
