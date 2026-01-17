# 🌳 Backend Code Tree - P&L Manager

**Fecha**: 2026-01-02  
**Estado**: Completo

---

## 📁 Estructura de Archivos Backend

```
P&L Antigravity/
├── firebase.json                    # Firebase project config (emulators)
├── firestore.rules                  # [RISK] Security rules for 18 collections
├── firestore.indexes.json           # Composite indexes (cierres, facturas, nominas)
├── .env                             # Firebase credentials (VITE_FIREBASE_*)
│
├── src/
│   ├── config/
│   │   └── firebase.config.ts       # [RISK] Firebase initialization, env validation
│   │
│   ├── core/
│   │   ├── services/
│   │   │   ├── DatabaseService.ts   # [RISK] 815 líneas - Central data hub
│   │   │   │                        #   - 23 collections
│   │   │   │                        #   - Hybrid local-first + cloud sync
│   │   │   │                        #   - ensureLoaded() on-demand pattern
│   │   │   │                        #   - Foreign key validation
│   │   │   │                        #   - Retry logic (3 attempts, exponential backoff)
│   │   │   │
│   │   │   ├── DatabaseService.test.ts    # Unit tests for DatabaseService
│   │   │   ├── FirestoreService.ts        # [RISK] Firestore CRUD wrapper
│   │   │   │                              #   - add/update/delete/get/getAll
│   │   │   │                              #   - Document validation
│   │   │   │                              #   - testConnection()
│   │   │   │
│   │   │   ├── DataIntegrityService.ts    # FK validation, canDelete checks
│   │   │   ├── ItemsService.ts            # Generic CRUD for any collection
│   │   │   ├── LoggerService.ts           # Console logging with prefixes
│   │   │   ├── CompanyService.ts          # Multi-tenant company operations
│   │   │   └── RestaurantService.ts       # Restaurant CRUD operations
│   │   │
│   │   ├── context/
│   │   │   ├── AppContext.tsx             # [RISK] Global app state provider
│   │   │   ├── AppContext.test.tsx        # Context tests
│   │   │   ├── DatabaseContext.tsx        # DB instance provider
│   │   │   └── RestaurantContext.tsx      # [RISK] Current restaurant selection
│   │   │
│   │   └── hooks/
│   │       └── (shared hooks)
│   │
│   ├── services/
│   │   ├── FinanceService.ts              # P&L calculations, period aggregations
│   │   ├── FinanceService.test.ts         # Finance calculation tests
│   │   ├── TransferService.ts             # Inter-restaurant transfers
│   │   ├── delivery-service.ts            # Delivery platform aggregation
│   │   ├── escandallo-service.ts          # Recipe costing calculations
│   │   ├── ocr-service.ts                 # [RISK] 27KB - Invoice OCR processing
│   │   ├── pnl-service.ts                 # P&L report generation
│   │   ├── FirebaseArchitecture.integration.test.ts  # Full Firebase E2E tests
│   │   └── FirestoreService.connection.test.ts       # Connection tests
│   │
│   ├── features/
│   │   ├── cierres/                       # Cash closings module
│   │   ├── dashboard/                     # KPI dashboard
│   │   ├── escandallos/                   # Recipe management
│   │   ├── inventarios/                   # Inventory counts
│   │   ├── invoices/                      # Invoice management
│   │   ├── ocr/                           # OCR processing UI
│   │   ├── orders/                        # Supplier orders
│   │   ├── personal/                      # HR: workers, absences, vacations
│   │   ├── providers/                     # Supplier management
│   │   └── users/                         # User management
│   │
│   ├── pages/
│   │   ├── CierresPage.tsx                # Closings list + wizard
│   │   ├── DashboardPage.tsx              # Main dashboard
│   │   ├── DeliveryPage.tsx               # Delivery records
│   │   ├── EscandallosPage.tsx            # Recipes list
│   │   ├── GastosFijosPage.tsx            # [RISK] Fixed costs config
│   │   ├── InventariosPage.tsx            # Inventory counts
│   │   ├── InvoicesPage.tsx               # Invoices list
│   │   ├── MenuEngineeringPage.tsx        # Menu analysis
│   │   ├── MermasPage.tsx                 # Waste tracking
│   │   ├── NominasPage.tsx                # [RISK] Payroll management
│   │   ├── OCRPage.tsx                    # Invoice scanning
│   │   ├── OrdersPage.tsx                 # Supplier orders
│   │   ├── PnLPage.tsx                    # [RISK] P&L report (33KB)
│   │   ├── ProvidersPage.tsx              # Suppliers list
│   │   ├── RestaurantConfigPage.tsx       # [RISK] Settings (27KB)
│   │   ├── RolesAdminPage.tsx             # RBAC management
│   │   └── TransfersPage.tsx              # Inter-restaurant transfers
│   │
│   └── types/
│       ├── index.ts                       # Type exports
│       └── (domain types)                 # Entity interfaces
│
└── .agent/
    └── FIREBASE_RULES.md                  # Rules documentation
```

---

## 📊 Colecciones Firestore (23 total)

| Colección | Tipo | Crítico | Multi-tenant |
|-----------|------|---------|--------------|
| `cierres` | Transaccional | ✅ | Por restaurante |
| `facturas` | Transaccional | ✅ | Por restaurante |
| `albaranes` | Transaccional | ❌ | Por restaurante |
| `proveedores` | Maestro | ✅ | Por empresa |
| `productos` | Maestro | ✅ | Por restaurante |
| `escandallos` | Maestro | ✅ | Por restaurante |
| `inventarios` | Transaccional | ✅ | Por restaurante |
| `delivery` | Transaccional | ❌ | Por restaurante |
| `usuarios` | Sistema | ✅ | Por empresa |
| `roles` | Sistema | ✅ | Global |
| `companies` | Sistema | ✅ | Global |
| `restaurants` | Sistema | ✅ | Por empresa |
| `transfers` | Transaccional | ❌ | Por empresa |
| `workers` | HR | ✅ | Por empresa |
| `absences` | HR | ❌ | Por empresa |
| `vacation_requests` | HR | ❌ | Por empresa |
| `mermas` | Transaccional | ❌ | Por restaurante |
| `orders` | Transaccional | ❌ | Por restaurante |
| `pnl_adjustments` | Financiero | ✅ | Por restaurante |
| `gastosFijos` | Financiero | ✅ | Por restaurante |
| `nominas` | HR/Financiero | ✅ | Por restaurante |
| `fichajes` | HR | ❌ | Por empresa |
| `test_connection` | Sistema | ❌ | Global |

---

## 🔗 Relaciones entre Entidades

```
Product.proveedorId    → Provider.id    (REQUIRED)
Invoice.proveedorId    → Provider.id    (REQUIRED)
InvoiceProduct.productoId → Product.id  (OPTIONAL)
InventoryCount.productoId → Product.id  (REQUIRED)
Escandallo.ingredientes[].productoId → Product.id (REQUIRED)
AppUser.rolId          → Role.id        (REQUIRED)
Restaurant.companyId   → Company.id     (REQUIRED)
Worker.companyId       → Company.id     (REQUIRED)
GastoFijo.restaurantId → Restaurant.id  (REQUIRED)
```

---

## ⚠️ Puntos de Riesgo Identificados

| Archivo | Riesgo | Descripción |
|---------|--------|-------------|
| `firestore.rules` | ALTO | Sin validación multi-tenant real |
| `DatabaseService.ts` | MEDIO | 815 líneas, complejidad alta |
| `firebase.config.ts` | ALTO | Credenciales en env vars |
| `ocr-service.ts` | MEDIO | 27KB, procesamiento externo |
| `PnLPage.tsx` | MEDIO | 33KB, cálculos financieros |
| `GastosFijosPage.tsx` | ALTO | Afecta P&L directamente |
| `RestaurantContext.tsx` | ALTO | Cambio de contexto multi-tenant |
