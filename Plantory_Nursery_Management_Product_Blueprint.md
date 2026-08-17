# Plantory — Nursery Management & Business Platform

**Product name:** Plantory
**Tagline:** *Smart management for modern nurseries.*
**First business (seed organization):** Shangrila Greens
**Document purpose:** Product requirements & build blueprint for the coding agent and future product discussions
**Status:** V1.0 — Requirements locked for MVP
**Primary languages:** English + Hindi
**Initial platform:** Responsive web app / PWA (Android app later)

> **Naming rule:** The *product* is always **Plantory**. The *nursery name* (e.g. "Shangrila Greens") is stored in the database and must be rendered dynamically wherever a nursery identity is shown — headers, invoices, public plant pages, WhatsApp messages, page titles. Never hardcode "Shangrila Greens" in the UI or in invoices.

---

## 0. Confirmed V1 Scope Decisions

These decisions are final for V1. The agent must build to these and not re-litigate them.

| Area | Decision |
|------|----------|
| **Tenancy** | Single organization now, but **`organization_id` on every business table** and RLS written so additional nurseries can be onboarded later with no rewrite. SaaS signup/billing is **out of V1**. |
| **QR code** | One QR per **plant type** (species/variety). Public page shows **photos, description, care, sunlight, water, sizes only** — **no price, no live stock**. Includes an **"Enquire on WhatsApp"** button and **printable QR label** generation. |
| **WhatsApp** | V1 uses free **`wa.me` deep links** (staff taps Send). DB + code structured so Meta **Cloud API** automation can be enabled later without rework. |
| **GST / tax** | **Configurable toggle**, off by default. When enabled: GSTIN, HSN codes, CGST/SGST on invoices. Model tax as first-class but optional. |
| **Extra V1 features** | Day-close cash reconciliation; returns/replacement; staff-sold attribution; WhatsApp enquiry lead capture; QR label printing. |
| **Backlog (not V1)** | Delivery/logistics tracking; quotations/estimates; customer accounts; online store; payment gateway. |
| **Customers** | Walk-in only. **No customer login.** Staff create all customers, sales, invoices. Invoice view link is public but view-only via secure token. |
| **Payments** | **Manual recording** only (cash / UPI reference / card ref), with outstanding balance tracked. No live payment processing. |
| **Database changes** | **Migrations only** — versioned SQL files in `supabase/migrations/`, applied via Supabase CLI. **No table creation or edits through the Supabase dashboard.** |
| **Server logic** | All business logic runs **server-side** (Next.js Server Components / Server Actions / Route Handlers). The browser never holds privileged keys or trusted business math. |

---

## 1. Product Vision

Build a mobile-first nursery management platform for Shangrila Greens that manages the full lifecycle:

- Plant master information and catalogue (bilingual)
- Purchase invoices and incoming truck loads
- Landed cost of plants (purchase cost + allocated expenses)
- Batch-wise inventory and stock movements
- Minimum and recommended selling prices with override guardrails
- Sales, customer invoices, and profit calculation
- Multiple outlets, staff, and role-based permissions
- Expenses (purchase-related vs operating)
- Customer history and outstanding balances
- Public plant info pages via QR (info-only)
- WhatsApp invoice sharing (free deep-link in V1)
- Day-close cash reconciliation
- Business dashboards and reports
- English/Hindi throughout

It should **feel like a native app on a phone/iPad** and **remain efficient on a laptop**, from a **single responsive codebase**.

The first version must be **inexpensive to operate** (Supabase free/low tier, no paid messaging) and **easy to extend** toward a multi-nursery SaaS.

---

## 2. Product Principles

1. **Mobile first**, single responsive codebase — never two apps.
2. **Simple enough for nursery staff** with limited tech comfort.
3. **Owner gets full financial visibility**; staff see only what they need.
4. **Inventory must be auditable** — every change has a stock movement.
5. **Every plant sale has a reliable cost and profit** derived from actual batch cost.
6. **Do not overbuild V1.**
7. **Database is the source of truth**; PDFs/links are generated views.
8. **Hindi and English from day one.**
9. **Role-based access enforced in the database (RLS), not only the UI.**
10. **Architecture supports more outlets, staff, and nurseries later.**
11. **Every schema change is a reviewed migration file in git.**
12. **All trusted logic runs server-side.**

---

## 3. Technology Stack

### Frontend
- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui
- Lucide icons
- React Hook Form + Zod (client + server validation)
- next-intl (English + Hindi)

### Backend / Data
- Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- Next.js Server Components, Server Actions, Route Handlers
- Supabase CLI migrations (versioned SQL in repo)

### Hosting
- Vercel (web app)
- Supabase (database, auth, storage)

### Mobile experience
- Responsive web + PWA (installable, add-to-home-screen, standalone)
- Full offline **not** assumed in V1

### Future integrations (not V1)
- WhatsApp Business / Meta Cloud API
- Payment gateway / UPI links
- GST/accounting integrations

---

## 4. Target Devices (one responsive app)

**Mobile (staff, primary):** bottom navigation, large touch targets, cards over wide tables, bottom sheets/drawers for quick actions. Used for sales, stock lookup, customer entry, invoice sharing.

**iPad / Tablet (managers, sales counter):** collapsible sidebar, two-column layouts where useful, touch-friendly controls.

**Laptop / Desktop (owner, admin):** full sidebar, dense tables, filters, multi-column dashboards, purchase management, reports, master data.

The **same components** adapt across breakpoints — never a separate desktop build.

---

## 5. PWA / App-Like Experience

- Installable from browser; app icon; standalone/full-screen where supported.
- Responsive navigation, mobile-friendly forms, touch targets, fast transitions.
- Offline support is **out of V1** (may be revisited).

---

## 6. User Roles & Provisioning

The **Owner** (main admin of the nursery) has maximum permissions and **provisions all other users and their roles/outlets**. Users cannot self-register.

### Owner (Main Admin)
Full access: all outlets, inventory, purchases, sales, pricing rules, minimum-price overrides, user & outlet management, financial reports, plant master, audit logs, org settings (name, GST toggle, pricing rules), day-close review.

### Admin
Almost full operational access: manage plants, inventory, purchases, sales, customers, suppliers, expenses, reports. Financial/security-sensitive actions (e.g. below-cost overrides, deleting financial records) may require Owner permission.

### Outlet Manager
Scoped to their outlet(s): view outlet inventory, create sales, manage customers, create/receive transfers, view outlet reports, manage outlet staff, run day-close. Cannot change global pricing/cost rules unless explicitly permitted.

### Staff
View catalogue, create sales & customers, view available stock, generate/share invoices, record their own day-close.
**Cannot:** change purchase/landed cost, change minimum price, delete financial transactions, or view business-wide profit.

> Roles are enforced in RLS + server actions. The UI hides disallowed actions purely for UX; the database is the real gate.

---

## 7. Organization & Outlet Model

Hierarchy: **Organization → Outlets → Users**, with **stock scoped per outlet**.

```
Shangrila Greens (organization)
├── Main Nursery (outlet)
├── Outlet A
├── Outlet B
└── Future Outlet C
```

- A user belongs to one organization and is assigned to one or more outlets (Owner/Admin may span all).
- Every business table carries `organization_id`; outlet-scoped tables also carry `outlet_id`.

---

## 8. Authentication

Use **Supabase Auth** (do not build custom auth).

**V1:** email/password login, logout, forgot/reset password, session management, user profile, active/inactive status. **Accounts are created by Owner/Admin only** (invite or admin-create flow) — no public signup.

**Profile fields:** `user_id`, `name`, `mobile`, `role`, `organization_id`, assigned outlets, `preferred_language`, `active`.

**Future (not V1):** phone OTP, WhatsApp OTP, employee PIN, Google login.

---

## 9. Authorization & Security

- **Supabase RLS on every table.** Frontend role checks are UX only.
- Staff access only permitted outlet data; Outlet Managers their outlet(s); Owner/Admin the whole org.
- Staff cannot update minimum price or landed cost.
- Financial records are **soft-deleted / voided**, never hard-deleted by normal users.
- **Audit logging** for all important changes (see §35).
- Secrets (`service_role` key, WhatsApp tokens) live only in server env vars, never shipped to the client.

---

## 10. Internationalization

- Languages: **English + Hindi**, via **next-intl** for UI strings.
- UI strings live in translation message files, **not the database**.
- User's `preferred_language` stored on profile; invoices/messages can also be per-customer language.

Sample: Dashboard/डैशबोर्ड, Purchase/खरीद, Sale/बिक्री, Quantity/मात्रा, Rate/दर, Amount/राशि, Total/कुल.

---

## 11. Business Data Translation (separate from UI strings)

Plant *content* is bilingual data stored on the record:
`name_en`, `name_hi`, `description_en`, `description_hi`, `care_en`, `care_hi`. Scientific name stays as-is.

**Auto-translation workflow (optional, admin-reviewed):**
English content → translate to Hindi (server-side, on create/edit only) → show suggested Hindi → admin reviews/edits → save.
- Do **not** translate on every page load. Store the translated content.
- Translation provider is pluggable; do not hardcode a paid service without approval.

---

## 12. Plant Master

Each plant: SKU/ID, common name EN, common name HI, scientific name, local name, category, variety, description EN/HI, care EN/HI, sunlight, water, indoor/outdoor, available sizes, unit, multiple images, active/inactive.

Example — Foxtail Palm / फॉक्सटेल पाम / *Wodyetia bifurcata* / Palm / sizes 4ft, 6ft, 8ft, 10ft.

---

## 13. Customer-Facing Plant Page (QR, info-only)

Each plant type has a **public, view-only info page** reachable by QR scan (no login).

**Shows:** photo(s), common name, Hindi name, scientific name, description, care, sunlight, water, available sizes, and the **nursery name/branding**.
**Does NOT show:** price or live stock (per decision).

**Includes:**
- **"Enquire on WhatsApp"** button → opens a `wa.me` deep link to the nursery's WhatsApp with a pre-filled message referencing the plant (turns a scan into a lead).
- QR pages are per plant type; the same printed QR/label is reusable.

**QR label printing:** admins can generate/print QR labels (with plant name + QR) from the catalogue for pots/tables.

---

## 14. Purchase / Truck Arrival

Supports a real incoming truck with many plant types.

**Purchase:** ID, supplier, supplier invoice no., purchase date, truck number, source/location, notes, items, purchase-related expenses.
**Purchase item:** plant ID, size, quantity, unit purchase rate, amount.

Example: Foxtail Palm ×100 @ ₹350 = ₹35,000; Bottle Palm ×50 @ ₹450 = ₹22,500.

---

## 15. Purchase-Related Expenses

Kept separate from operating expenses; they roll into landed cost: truck fare, loading, unloading, commission, transport, packing, other.

---

## 16. Landed Cost

`Landed cost = plant purchase cost + allocated purchase-related expenses`

**V1 allocation method:** **proportional to purchase value** (configurable).
Example: purchase value ₹100,000 + expenses ₹10,000 → total ₹110,000. A plant that is 20% of purchase value absorbs 20% × ₹10,000 = ₹2,000.

Future methods (configurable): quantity, weight, volume, manual.

---

## 17. Batch-Based Inventory

Do **not** keep a single stock quantity per plant. The same plant bought at different costs forms different **batches**, each preserving its landed cost.

**V1 costing method:** **FIFO** (weighted-average is a future option). Inventory must preserve batch info so profit uses the correct cost.

---

## 18. Stock Movement

Every inventory change creates a **stock movement**: Purchase, Sale, Transfer out, Transfer in, Mortality/loss, Damage, Adjustment, **Return in**.

Example: Foxtail Palm 6ft: +100 purchase, −20 transfer, −5 sale, −2 mortality = 73. Movement history must be viewable.

---

## 19. Plant Mortality / Loss

Record: plant, size, quantity, outlet, date, reason (died, damage, pest/disease, transport damage, unknown, other), notes. Loss reduces inventory and shows in profitability reports.

---

## 20. Pricing Engine

Each plant carries: landed cost, minimum selling price, recommended selling price, optional retail price.

Example: landed ₹390 → minimum ₹450, recommended ₹500, retail ₹550.

**Configurable rules:** minimum margin %, target margin %, price rounding, "below-minimum sale allowed = Owner only". Prices may be auto-suggested from landed cost + margin rules, editable by permitted roles.

---

## 21. Minimum Price Override

Staff see landed/minimum/recommended context on the sale screen.
- Enter below minimum → **warning**.
- Enter below landed cost → **loss warning** with estimated per-plant loss.
- Only Owner/Admin (or explicitly permitted) may override below minimum.
- Every override is written to the **audit log**, using the **current applicable landed cost**.

---

## 22. Sales

Workflow: select/add customer → select outlet → add plants → select size → quantity → selling price → validate minimum price → compute total → compute cost (FIFO batch) → compute profit → save sale → deduct stock (with movements) → generate invoice → offer WhatsApp share.

**Sale item stores:** plant ID, size, batch/cost reference, quantity, selling price, cost, profit, discount, **sold_by (staff)**.

---

## 23. Profit Calculation

- **Plant-level:** `profit = selling price − applicable batch cost`.
- **Business-level:** `Sales − COGS − operating expenses − applicable losses = net profit`.

Reports distinguish: gross sales, COGS, gross profit, operating expenses, net profit.

---

## 24. Customer Management

Fields: ID, name, phone, WhatsApp number, email (opt), address (opt), preferred language, WhatsApp opt-in, notes, created date.
History: sales, invoices, payments, outstanding balance, plants purchased, lifetime purchase value.

---

## 25. Invoice

Invoices are **structured database records** (the source of truth); PDFs/links are generated on demand.

Sale/invoice contains: invoice number, customer, outlet, date/time, items, quantities, rates, discounts, **tax (if GST enabled)**, total, payment status, language, created_by, sold_by.

Finalized invoices **snapshot display names** so historical invoices don't change if a plant's name is later edited.

---

## 26. Invoice Languages

Generate in English, Hindi, or bilingual. Customer receives their preferred language.
Example headers — English: Plant | Quantity | Rate | Amount · Hindi: पौधा | मात्रा | दर | राशि.

---

## 27. WhatsApp Integration

### V1 — free deep-link
Sale saved → generate secure invoice URL → open WhatsApp with pre-filled message → staff taps **Send**. No paid API.

Sample message:
> Hello Rahul, thank you for purchasing from **Shangrila Greens** 🌱
> Invoice: INV-1024 · Amount: ₹4,300
> View your invoice: [secure link]

*(Nursery name is injected dynamically.)*

### Invoice URL security
- **No predictable invoice IDs.** Use a secure random token: `/invoice/<secure-token>`.
- Viewable without an account; token grants view-only access to that one invoice.

### V2 — Cloud API (not V1)
Meta WhatsApp Business Cloud API for auto invoice delivery, receipts, reminders, order/enquiry confirmations. The DB is prepared for it now (§28); it is **not** a V1 dependency.

---

## 28. WhatsApp Message Tracking (schema ready now)

`whatsapp_messages`: `id`, `organization_id`, `customer_id`, `sale_id`, `message_type`, `recipient`, `status`, `provider_message_id`, `sent_at`, `error_message`.
Message types: `INVOICE`, `PAYMENT_RECEIPT`, `PAYMENT_REMINDER`, `ORDER_CONFIRMATION`, `ENQUIRY`, `MARKETING`.

In V1, a deep-link share may log an `INVOICE`/`ENQUIRY` row with status `deep_link_opened` so history exists before the API is enabled.

---

## 29. Outlets & Transfers

Outlet: ID, name, address, phone, active/inactive, users, inventory. **Stock is outlet-specific.**
Transfer: e.g. Main Nursery → 10 Foxtail Palm → Outlet A. Records a **Transfer out** on the source and **Transfer in** on the destination, preserving batch cost.

---

## 30. Supplier Management

Supplier: name, contact, phone, GST (if applicable), address, notes, purchase history, outstanding.
Dashboard: total purchases, last purchase, outstanding, plants purchased, history.

---

## 31. Expenses

**Purchase-related** (into landed cost): truck, loading, unloading, commission, transport, packing.
**Operating** (into business profit): labour, rent, electricity, water, fertilizer, pesticides, fuel, maintenance, marketing, miscellaneous. Operating expenses support optional **receipt photo** upload to Storage.

---

## 32. Payments (manual recording, V1)

**Customer payments:** invoice, amount, date, method (cash/UPI ref/card ref), paid amount, outstanding.
**Supplier payments:** supplier, purchase, amount, date, method, outstanding.
Future: UPI/payment-gateway links.

---

## 33. Day-Close / Cash Reconciliation (V1)

At end of shift/day, per outlet (and optionally per staff):
- System shows expected totals: sales by payment method, total cash expected.
- Staff enter **counted cash**; system shows **variance**.
- Record notes; Owner/Manager can review day-close history.
- A finalized day-close is a record; discrepancies are visible in reports.

---

## 34. Returns / Replacement (V1)

- A return/replacement references the **original invoice and sale item**.
- Records reason, quantity, and whether it is a **refund** (adjust outstanding/record repayment) or **replacement** (issue same/other plant).
- Creates a **Return in** stock movement where the plant re-enters stock, or a mortality/loss if unsellable.
- Reflected in customer history and profit reporting.

---

## 35. Dashboard

**Today:** sales, gross profit, expenses, net profit, plants sold, **cash variance from day-close**.
**Inventory:** total plants, inventory value, low stock, new arrivals, slow-moving, mortality.
**Business:** outstanding customer payments, supplier outstanding, outlet sales, outlet profit, monthly profit.

Dashboards are role-scoped (staff see far less than owner).

---

## 36. Reports (V1)

Sales; purchase; plant-wise sales; plant-wise profit; outlet-wise sales; outlet-wise profit; inventory valuation; stock movement; mortality/loss; expenses; customer purchase history; supplier purchase history; **staff-wise sales**; **day-close/cash reconciliation**; **returns**; monthly P&L.

---

## 37. Audit Log

Log important changes: minimum-price change/override, plant info change, purchase create/edit, sale create/void, loss recorded, stock transfer, user/permission change, day-close finalize, return processed.
Fields: user, action, entity, entity ID, old value, new value, timestamp, organization_id, outlet_id.

---

## 38. Suggested Database Entities

**Core / org:** `organizations`, `outlets`, `profiles`, `user_outlets` (assignment), `roles/permissions` (if needed), `org_settings`.
**Catalogue:** `plants`, `plant_categories`, `plant_sizes`, `plant_images`.
**Parties:** `suppliers`, `customers`.
**Purchasing:** `purchases`, `purchase_items`, `purchase_expenses`.
**Inventory:** `inventory_batches`, `stock_movements`, `stock_transfers`, `stock_transfer_items`, `plant_losses`.
**Pricing:** `price_rules`, `plant_prices`.
**Sales:** `sales`, `sale_items`, `payments`, `returns`, `return_items`.
**Ops:** `expenses`, `day_closes`, `whatsapp_messages`, `audit_logs`.

Every business table includes `organization_id`; outlet-scoped tables include `outlet_id`. Include `created_at`, `created_by`, and soft-delete/void columns on financial records.

---

## 39. Important Relationships

- Organization → outlets → users
- Plant → images → sizes → inventory batches → purchase items → sale items
- Purchase → purchase items → purchase expenses → inventory batches
- Customer → sales → payments; sales → returns
- Sale → sale items → invoice; sale item → batch (cost/profit)
- Outlet → inventory → sales → day-close → users

---

## 40. Data Integrity Rules

- A sale cannot reduce stock below available (never silently negative).
- A transfer cannot exceed source stock.
- Normal users cannot change historical cost without permission.
- Finalized financial transactions are voided/soft-deleted, not hard-deleted.
- Every inventory change has a stock movement.
- Every sale references a valid outlet; every sale item references a valid plant + batch.
- Profit is computed from **actual batch cost**, not just selling price.
- Minimum-price warnings use the **current applicable landed cost**.
- Historical invoices remain reproducible (name snapshots).
- Below-minimum sales require permission and are audit-logged.

---

## 41. V1 Scope (build list)

**Foundation:** project setup, PWA shell, auth (admin-provisioned), roles, outlet assignment, EN/HI, org settings (name, GST toggle, pricing rules).
**Plant:** master, categories, sizes, images, EN/HI content, catalogue, **public info-only QR page + enquiry button + label printing**.
**Purchase:** suppliers, purchase invoice, items, purchase expenses, landed cost, batch inventory.
**Inventory:** stock, movements, transfers, mortality/loss.
**Pricing:** landed cost, minimum/recommended price, override guardrails.
**Sales:** customers, sale, minimum-price validation, profit, invoice, manual payments, staff attribution, **returns/replacement**.
**Cash:** **day-close reconciliation**.
**WhatsApp:** secure invoice URL, deep-link share, message-tracking schema.
**Reports:** dashboard, sales, purchase, inventory, plant profit, outlet profit, staff sales, day-close, returns, expenses.

---

## 42. Explicitly Out of Scope for V1

Native Android/iOS app; full accounting/ERP; GST filing; WhatsApp Cloud API automation; payment gateway / UPI links; barcode hardware; AI chatbot; loyalty program; marketing automation; supplier marketplace; advanced offline mode; complex procurement approvals; **delivery/logistics tracking**; **quotations/estimates**; **customer accounts / online store**.

These are evaluated after real usage.

---

## 43. Recommended Build Order

1. **Foundation** — Next.js, TS, Tailwind, shadcn/ui, Supabase, PWA shell, migration tooling.
2. **Auth & tenancy** — login, admin-provisioned users, profiles, roles, outlets, RLS, org settings.
3. **i18n** — EN/HI, language preference.
4. **Plant master + public QR page** — plants, categories, sizes, images, bilingual data, info-only public page, labels.
5. **Purchasing** — suppliers, purchases, items, purchase expenses, landed cost.
6. **Inventory** — batches, FIFO, stock movements, transfers, mortality.
7. **Pricing** — landed cost, min/recommended, override guardrails.
8. **Sales** — customers, sale, min-price validation, profit, invoice, manual payments, staff attribution, returns.
9. **Cash** — day-close reconciliation.
10. **WhatsApp** — secure invoice URL, deep-link share, tracking schema.
11. **Reports** — dashboards, outlet/plant/staff reports, P&L.

---

## 44. Future Features (discuss before V2)

Barcode/QR inventory; per-physical-plant traceability tags; public online catalogue with prices; online store & customer accounts; customer plant-care reminders; WhatsApp Cloud API auto-invoices/reminders; GST filing; UPI payment links; loyalty; slow-moving alerts; reorder suggestions; supplier price comparison; mortality analytics; labour/employee management; nursery area/zone management; purchase forecasting; seasonal demand; sales targets & commission; delivery management; landscaping project integration; reservation/booking; quotations; customer-specific / corporate pricing; bulk orders; credit limits.

---

## 45. Definition of Success for V1

A nursery employee can, entirely from a phone/iPad:
1. Log in → 2. select outlet → 3. find a plant → 4. view info → 5. create a purchase → 6. add truck expenses → 7. see landed cost → 8. see min/recommended price → 9. receive stock → 10. transfer stock → 11. add a customer → 12. create a sale → 13. auto-deduct stock → 14. auto-calculate profit → 15. generate/view invoice → 16. share via WhatsApp → 17. run day-close.
18. A customer scans a QR and sees plant info (no price) with an enquiry button.
19. The Owner later sees sales, stock, profit, staff performance, and cash variance in reports.

---

## 46. Core Business Flow

```
TRUCK ARRIVES
  → Purchase → add plants → add purchase prices → add truck/other expenses
  → calculate landed cost → create inventory batches (FIFO)
  → set/confirm minimum & recommended price
  → stock available → transfer to outlet if needed
CUSTOMER BUYS
  → add/select customer → add plants → validate minimum price
  → create sale → deduct stock (movements) → calculate profit (batch cost)
  → store invoice in DB → generate secure invoice link → share via WhatsApp
END OF DAY
  → day-close: count cash, record variance
OWNER
  → sees sales / profit / stock / staff / cash reports
```

This is the core of the product.

---

## 47. Agent Working Agreement (summary)

The detailed coding rules live in **`CLAUDE.md`** and must be followed. In short: confirm architecture before coding; propose the schema first; keep business logic server-side; enforce RLS; use versioned migrations only (no dashboard SQL); TypeScript strict; mobile-first single codebase; deterministic, tested inventory/costing math; never allow silent negative stock or silent below-minimum sales; audit important changes; no paid external services without approval; keep V1 small.
