# Product Decisions Contract — P&L Antigravity

> **Domain:** Hospitality operations management for restaurants in Spain.
> **Primary persona:** Director de restaurante (15+ years experience, NOT a programmer).
> **Secondary persona:** Waiter using mobile during service.
> **Language:** UI in Spanish (with proper tildes). Code in English.

---

## 1. Domain Terminology

All UI text, labels, and messages must use these standard Spanish hospitality terms:

| Spanish Term | English Equivalent | Definition |
|-------------|-------------------|------------|
| **Albaran** | Delivery note | Document from supplier confirming goods delivered |
| **Escandallo** | Recipe costing | Detailed breakdown of ingredient costs per dish portion |
| **Merma** | Waste / Shrinkage | Product loss from spoilage, breakage, or theft |
| **Cierre (de caja)** | Cash closing | End-of-day reconciliation of all payment methods |
| **Fichaje** | Time entry / Clock-in | Staff entry/exit time registration |
| **Encargado** | Shift manager | On-site manager responsible for daily operations |
| **Jefe de Cocina** | Head chef | Kitchen leader responsible for recipes and food cost |
| **Camarero** | Waiter / Server | Front-of-house service staff |
| **Cocinero** | Cook | Kitchen staff |
| **Proveedor** | Supplier / Vendor | External company providing goods |
| **Nomina** | Payroll | Monthly salary calculation and payment |
| **Partida** | Station / Section | Kitchen or service area (bar, cocina, camara, almacen) |
| **Datafono** | Card terminal | POS card payment device |
| **Turno** | Shift | Work period (morning, afternoon, split) |
| **Existencias** | Current stock | Inventory on hand |
| **Traspaso** | Transfer | Movement of goods between locations or zones |
| **Gasto fijo** | Fixed expense | Recurring operational cost (rent, utilities, insurance) |

**Rule:** Never use English terms in the UI. Never invent hospitality terms. When unsure, ask Aitor.

---

## 2. Critical Flows

### 2.1 Cierre de Caja (Daily Cash Closing)

**Frequency:** Every day at end of service (or next morning).
**Who:** Encargado or Director.
**Why critical:** Discrepancies between POS reports and actual cash mean theft, errors, or fraud.

**Flow:**
1. Select date (defaults to today).
2. Enter cash counted.
3. Enter card terminal totals (multiple terminals possible).
4. Enter other payment methods (Bizum, vouchers, etc.).
5. Enter delivery platform income (Glovo, Uber Eats, Just Eat, etc.).
6. System calculates total and shows variance against expected.
7. If variance > threshold, warning with explanation field.
8. Submit with optional notes.

**Business rules:**
- Variance under 5 EUR = normal (rounding).
- Variance 5-20 EUR = warning (requires note).
- Variance > 20 EUR = alert (highlighted for director review).

### 2.2 Receive Delivery Note (Albaran)

**Frequency:** Multiple times per day (each supplier delivery).
**Who:** Encargado, Jefe de Cocina, or trained Camarero.

**Flow:**
1. Photo/scan of physical delivery note (future: Claude Vision OCR).
2. System extracts: supplier, products, quantities, prices.
3. User verifies and corrects extracted data.
4. System updates product prices if changed.
5. Stock automatically updated.
6. Invoice association (optional, for later matching).

### 2.3 Inventory Count

**Frequency:** Weekly (full), daily (critical items).
**Who:** Varies by zone — Camarero (bar), Cocinero (cocina), Jefe de Cocina (camara/almacen).

**Flow:**
1. Select zone (bar, cocina, camara, almacen).
2. System shows products assigned to that zone with expected stock.
3. User enters actual counted quantity.
4. System calculates variance.
5. Flag items with significant variance for investigation.
6. Submit count.

### 2.4 Recipe Costing (Escandallo)

**Frequency:** When creating/updating menu items.
**Who:** Jefe de Cocina, Director.

**Flow:**
1. Name the dish and category.
2. Add ingredients with quantities and units.
3. System pulls latest prices from product catalog.
4. Calculate: total recipe cost, yield, cost per portion.
5. Set desired margin or selling price.
6. System calculates the other (price from margin or margin from price).
7. Compare against industry benchmarks.

### 2.5 Staff Scheduling (Future)

**Frequency:** Weekly.
**Who:** Director, Encargado.

**Flow:**
1. View calendar grid (days x staff).
2. Assign shifts (morning, afternoon, split, day off).
3. System validates against labor regulations (max hours, rest periods).
4. Publish schedule (notify staff).
5. Track actual vs. planned (from fichajes).

---

## 3. Roles and Access

| Role | Level | Multi-Restaurant | Sees |
|------|-------|-------------------|------|
| `director_operaciones` | 1 | Yes (all) | Everything: all modules, all restaurants, all data |
| `director_restaurante` | 2 | No (own) | Everything in their restaurant |
| `encargado` | 3 | No | Daily ops: cierres, inventarios, pedidos, personal (view), mermas |
| `jefe_cocina` | 3 | No | Kitchen: escandallos (full), inventarios, mermas, pedidos, almacen, OCR (view) |
| `camarero` | 4 | No | Minimal: dashboard, bar inventory, escandallos (read-only), almacen (view) |
| `cocinero` | 5 | No | Minimal: dashboard, escandallos (read-only), own station inventory, mermas (report) |

**18 permission modules** with granular CRUD: `dashboard`, `ocr`, `cierres`, `proveedores`, `almacen`, `inventarios`, `escandallos`, `pnl`, `usuarios`, `configuracion`, `personal`, `nominas`, `gastos`, `mermas`, `pedidos`, `transferencias`, `invitaciones`, `restaurantes`.

**Inventory zones by role:**
- `jefe_cocina`: cocina, camara, almacen
- `camarero`: bar only
- `cocinero`: cocina only

---

## 4. Multi-Restaurant & Groups

- A `company` contains one or more `restaurants`.
- `director_operaciones` sees all restaurants in the company.
- All other roles are scoped to a single restaurant.
- Data is isolated by `restaurantId` on every document.
- Future: Group-level reports and cross-restaurant transfers.

---

## 5. Future Modules

### 5.1 Onboarding + Training
- **Dossiers:** Restaurant-specific training manuals (PDF, video, interactive).
- **Technical sheets:** Product/ingredient specs for kitchen staff.
- **Exams:** Multiple-choice tests after training modules.
- **Certifications:** Track who completed what training and when.
- **Renewal alerts:** Food safety certification expiry warnings.

### 5.2 Operational Checklists
- **Opening checklist:** Equipment checks, temp logs, prep verification.
- **Closing checklist:** Cleaning, security, stock review.
- **Cleaning schedules:** Daily, weekly, monthly tasks with photo evidence.
- **Supervisor review:** Encargado/Director approves completed checklists.
- **Audit trail:** Who did what, when, with photo proof.

### 5.3 Daily Reports (Auto-Generated)
- **Morning summary for Director:** What happened overnight/yesterday.
- **Contents:** Cash closing summary, inventory alerts, staff attendance, anomalies.
- **Delivery:** Push notification or email at configured time.
- **Trend comparison:** Today vs. same day last week/month/year.

---

## 6. Financial Rules

### 6.1 Amount Handling
- **Internal storage:** All amounts in **cents** (integers). Never floating point.
- **Display:** Use `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.
- **Input:** Accept comma as decimal separator (Spanish convention).
- **Calculations:** Perform on cent values, convert to display only at presentation layer.

### 6.2 Restaurant Industry KPIs

| KPI | Healthy Range | Warning | Critical |
|-----|--------------|---------|----------|
| Food cost % | 28-35% | 35-40% | >40% |
| Beverage cost % | 18-25% | 25-30% | >30% |
| Labor cost % | 25-35% | 35-40% | >40% |
| Prime cost (food + labor) % | 55-65% | 65-70% | >70% |
| Waste/shrinkage % | <2% | 2-5% | >5% |

These thresholds are used to color KPI displays (success/warning/danger semantic colors).

### 6.3 Tax Handling
- **IVA rates:** 21% (general), 10% (food service), 4% (basic food items).
- Display tax breakdown on invoices and albaranes.
- P&L calculations: always work with net amounts (before tax) unless specified.

---

## 7. Spanish UI Guidelines

### 7.1 Text Conventions
- **Tildes are mandatory.** "Informacion" is wrong. "Informacion" with tilde is correct.
- **Natural language.** "Guardar cierre" not "Submit closing record".
- **Clear verb buttons.** Action buttons use infinitive verbs: "Guardar", "Eliminar", "Crear", "Exportar".
- **No technical jargon in UI.** "Error al guardar" not "Firestore write failed".

### 7.2 Error Messages
- Tell the user what happened and what to do about it.
- "No se pudo guardar el cierre. Comprueba tu conexion e intenta de nuevo."
- Never show error codes, stack traces, or technical details.

### 7.3 Confirmation Messages
- Be specific: "Cierre del 15/03/2026 guardado correctamente."
- Not generic: "Operacion completada."

---

## 8. Director as Primary User

The director is the person who needs this app most. Design decisions should optimize for their workflow:

### 8.1 Morning Routine
- Open app on phone.
- Dashboard shows: yesterday's cash closing summary, any anomalies flagged, today's staff schedule, inventory alerts.
- One-tap access to detailed view of any flagged item.
- No login friction (persistent session).

### 8.2 Remote Monitoring
- Director is NOT always physically in the restaurant.
- Needs to know: Is the closing done? Are deliveries received? Any problems?
- Future: Push notifications for anomalies exceeding thresholds.

### 8.3 Decision Support
- P&L trends with period comparison.
- Food cost % trending up? Show which products cost more.
- Staff costs trending up? Show which shifts are overstaffed.

---

## 9. Waiter/Cook Mobile Usage

### 9.1 Context
- Used during service (busy, one hand occupied).
- Phone might be shared between staff on same shift.
- Screen often smudged, environment noisy, lighting variable.

### 9.2 Design Implications
- **44px touch targets** (non-negotiable).
- **High contrast** text on backgrounds.
- **Minimal steps** to complete a task (count inventory, report waste).
- **No unnecessary confirmations** for low-risk actions.
- **Offline tolerance** (show last cached data if connection drops, sync when back).

---

## 10. Verification Checklist

Before any PR changing user-facing behavior:

- [ ] All UI text in Spanish with proper tildes
- [ ] Domain terminology matches the glossary (Section 1)
- [ ] Monetary values stored as cents, displayed with `Intl.NumberFormat`
- [ ] KPI thresholds match industry standards (Section 6.2)
- [ ] Role-based visibility respected (check `systemRoles.ts`)
- [ ] Error messages are user-friendly Spanish (no tech jargon)
- [ ] Button labels use clear Spanish infinitive verbs
- [ ] Director morning workflow not disrupted by changes
- [ ] Mobile waiters can complete task with one hand
