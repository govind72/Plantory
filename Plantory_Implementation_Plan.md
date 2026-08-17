# Plantory — V1 Implementation Plan

**Companion to:** `Plantory_Nursery_Management_Product_Blueprint.md` (what to build) and `CLAUDE.md` (how to build).
**This document:** the ordered, efficient path to ship V1 — as vertical slices, each independently shippable and reviewable.
**Status:** Plan v1 — follow top to bottom; do not skip the migration/test/RLS steps in each milestone.

---

## A. Execution Principles

1. **Vertical slices, not horizontal layers.** Each milestone delivers one usable capability end-to-end (migration → domain + tests → server action/RPC → UI → review), not "all tables" then "all screens."
2. **Migration-first.** No schema touches the DB except through a versioned file in `supabase/migrations/`. RLS is written in the *same* migration as the table.
3. **Domain logic is test-first.** Money/stock math (`lib/domain/*`) gets unit tests before it's wired to IO.
4. **Prove the golden path early.** Reach a working *purchase → batch → sale → invoice* as soon as the data model allows, then broaden. See the **Critical Path** below.
5. **Each milestone ends with:** passing tests, an RLS check, a `/design-review` on any significant screen, and a **commit checkpoint** (I'll remind; you commit).
6. **Ask on ambiguity.** Anything not covered by the blueprint's locked decisions (§0) → stop and ask.

---

## B. Milestone Overview

| # | Milestone | Outcome | Depends on | Size |
|---|-----------|---------|-----------|------|
| **M0** | Foundation & tooling | Next.js + TS strict + Tailwind + shadcn/ui + Supabase local + CI + test runner running | — | M |
| **M1** | Schema & RLS baseline | All core tables + enums + RLS + seed (Shangrila Greens org, Main Nursery, Owner) as migrations; generated TS types | M0 | L |
| **M2** | Auth & tenancy | Login, admin-provisioned users, profiles, roles, outlet assignment, session, org settings (name, GST toggle) | M1 | M |
| **M3** | App shell, i18n & design system | Responsive shell (bottom nav / sidebar), EN/HI wiring, **design tokens (light+dark)**, dynamic nursery name | M2 | M |
| **M4** | Plant master + public QR | Bilingual plant CRUD, categories, sizes, images; info-only public `/p/[slug]` page + WhatsApp enquiry + QR label print | M3 | L |
| **M5** | Suppliers & purchases + landed cost | Supplier CRUD; purchase with items + expenses; landed-cost allocation on finalize; batches created | M4 | L |
| **M6** | Inventory: batches, FIFO, movements, transfers, mortality | Every stock change writes a movement; FIFO ready; transfers; loss recording | M5 | L |
| **M7** | Pricing engine | Landed→min/recommended via configurable rules; below-min/below-cost guardrails | M6 | M |
| **M8** | Sales, invoice, payments, returns | Transactional sale RPC (stock deduct + profit), invoice record, manual payment, staff attribution, returns/replacement | M6, M7 | L |
| **M9** | Day-close / cash reconciliation | Expected vs counted cash, variance, finalize record | M8 | M |
| **M10** | WhatsApp V1 | Secure `/invoice/[token]` page, deep-link share, `whatsapp_messages` logging | M8 | S |
| **M11** | Dashboard & reports | Role-scoped dashboard + V1 report set (sales, purchase, inventory, plant/outlet/staff profit, day-close, returns, P&L) | M8, M9 | L |
| **M12** | PWA polish & hardening | Installable PWA, accessibility/perf pass, full RLS test sweep, seed/demo data | M11 | M |

**Critical path to first real sale (thin slice):** M0 → M1 → M2 → M4 (minimal) → M5 → M6 → M8. Everything else broadens value around that spine.

---

## C. Detailed Milestones

### M0 — Foundation & Tooling
- **Set up:** Next.js App Router (TS strict), Tailwind, shadcn/ui, Lucide, ESLint/Prettier, Vitest, folder structure per `CLAUDE.md §7`.
- **Supabase:** `supabase init`, `supabase start` (local), CLI migration workflow, `.env.example`.
- **CI:** typecheck + lint + `vitest` on push.
- **DoD:** `pnpm dev` runs a blank shell; `supabase start` up; empty migration applies; test runner green in CI.

### M1 — Schema & RLS Baseline *(this is the blueprint/CLAUDE "First Task" made concrete)*
Deliver as reviewable migrations, grouped logically (one migration per domain area is fine):
- **Org/identity:** `organizations`, `outlets`, `profiles`, `user_outlets`, `org_settings` (nursery name, GST toggle, price rules defaults).
- **Catalogue:** `plant_categories`, `plants`, `plant_sizes`, `plant_images`.
- **Parties:** `suppliers`, `customers`.
- **Purchasing:** `purchases`, `purchase_items`, `purchase_expenses`.
- **Inventory:** `inventory_batches`, `stock_movements`, `stock_transfers`, `stock_transfer_items`, `plant_losses`.
- **Pricing:** `price_rules`, `plant_prices`.
- **Sales:** `sales`, `sale_items`, `payments`, `returns`, `return_items`.
- **Ops:** `expenses`, `day_closes`, `whatsapp_messages`, `audit_logs`.
- **Conventions:** every table `id uuid`, `organization_id`, `created_at`, `created_by`; outlet-scoped adds `outlet_id`; financial tables add `voided_at/voided_by`. Enums/checks for roles, movement types, payment methods, message types. **Money = `numeric(12,2)`** (documented convention).
- **RLS:** enable + explicit `select/insert/update/delete` policies per table in the same migration, deriving org/role/outlet from JWT + `profiles`/`user_outlets`.
- **Seed migration (idempotent):** Shangrila Greens org, Main Nursery outlet, Owner user, default price rule.
- **Types:** `supabase gen types typescript` committed to `/types`.
- **DoD:** migrations apply clean from zero; every table has RLS; seed is idempotent; a written **role→permission matrix** accompanies it. **→ Approval gate before app code beyond auth.**

### M2 — Auth & Tenancy
- Supabase Auth email/password; login, logout, forgot/reset; session in middleware.
- **Owner/Admin-only provisioning** of users (invite or admin-create) → creates `profiles` + `user_outlets`; active/inactive.
- Server Supabase client factory (per-request) + guarded service-role client.
- Org settings screen: edit nursery name, toggle GST, default price rules.
- **DoD:** a provisioned staff user logs in and is correctly scoped; no public signup exists; RLS blocks cross-org/cross-outlet reads (first RLS tests here).

### M3 — App Shell, i18n & Design System
- **Design foundation first:** run `/design-tokens` → Plantory tokens (color, spacing, type, motion) with **light + dark**; wire into Tailwind. (Optionally `/design-brief` + `/information-architecture` for nav & flows.)
- Responsive shell: bottom nav (mobile), collapsible sidebar (tablet), full sidebar (desktop) — one component set.
- next-intl wired (`en`, `hi`), language switch, `preferred_language` respected; INR + locale dates.
- Dynamic nursery name in header/layout.
- **DoD:** shell responsive across the 3 breakpoints; language toggle works; all visible strings come from message files; `/design-review` passes on the shell.

### M4 — Plant Master + Public QR
- Bilingual plant CRUD (name/description/care EN+HI), categories, sizes, multiple images (Supabase Storage).
- Optional admin-reviewed auto-translation stub (no paid provider without approval — leave as manual + pluggable).
- **Public `/p/[slug]`** (route group `(public)`): info-only (photos, care, sizes) — **no price/stock**; dynamic nursery branding; **"Enquire on WhatsApp"** deep link; **printable QR label** generation.
- **DoD:** staff manage plants bilingually; public page renders without auth via non-sequential slug; enquiry deep link pre-fills plant reference; `/design-review` on catalogue + public page.

### M5 — Suppliers & Purchases + Landed Cost
- Supplier CRUD + basic supplier view (purchases, outstanding).
- Purchase entry: header (supplier, invoice no., date, truck no., source, notes) + items + purchase expenses.
- **Domain (test-first):** `allocateLandedCost()` — proportional-to-value, configurable method; unit-tested with rounding cases.
- On **finalize**: compute per-item landed cost, create `inventory_batches`, write purchase movements — via a transactional RPC.
- **DoD:** finalizing a truck purchase produces correct batches with landed cost; landed-cost tests pass; audit log entry on create/edit.

### M6 — Inventory: Batches, FIFO, Movements, Transfers, Mortality
- **Domain (test-first):** `consumeFifo()` returns exact batch splits + cost; never allows negative.
- Stock views per outlet; movement history; **transfers** (out+in movements, batch cost preserved, cannot exceed source); **mortality/loss** recording (reasons enum) → movement + report impact.
- All via transactional RPCs so movements + batch balances stay consistent.
- **DoD:** FIFO tests pass; transfer can't exceed source; every stock change has a movement; loss reduces stock and shows in reports; RLS test: staff can't read another outlet's stock.

### M7 — Pricing Engine
- **Domain (test-first):** `suggestPrices(landed, rules)` → min/recommended with margin %, rounding.
- `price_rules` + per-plant `plant_prices`; editable only by permitted roles (staff cannot).
- **DoD:** suggested prices deterministic and tested; staff UI cannot edit cost/min price; changes audit-logged.

### M8 — Sales, Invoice, Payments, Returns
- Sale flow (blueprint §22): customer → outlet → plants/size/qty/price → **min-price validation** (warning / loss-warning / Owner override + audit) → totals → **transactional sale RPC** (FIFO deduct + movements + profit + invoice) → invoice record with **name snapshot** and optional GST.
- Manual **payment** recording (method, paid, outstanding); **staff attribution** (`sold_by`).
- **Returns/replacement** referencing original sale item → refund or replacement + `return in` movement.
- **Domain (test-first):** min-price/override logic, profit from actual batch cost.
- **DoD:** sale never drives stock negative; partial failure rolls back (RPC test); below-min blocked without override + logged; profit uses batch cost; returns reflect in stock/customer/profit; `/design-review` on the sale screen.

### M9 — Day-Close / Cash Reconciliation
- **Domain (test-first):** `computeDayCloseVariance()` (expected-by-method vs counted).
- Per outlet/shift: show expected cash from recorded sales by method; enter counted cash; show variance; finalize record; history for Owner/Manager.
- **DoD:** variance math tested; finalize is auditable; appears on dashboard.

### M10 — WhatsApp V1
- Secure **`/invoice/[token]`** public view-only page (random token, minimal fields, dynamic nursery name, invoice language).
- Deep-link share on sale completion (`wa.me/<number>?text=...`); optional `whatsapp_messages` row (`deep_link_opened`).
- **DoD:** invoice viewable by token without auth; no sequential IDs exposed; share opens pre-filled message.

### M11 — Dashboard & Reports
- Role-scoped dashboard (Today / Inventory / Business + cash variance).
- V1 reports: sales, purchase, plant-wise sales & profit, outlet-wise sales & profit, **staff-wise sales**, inventory valuation, stock movement, mortality, expenses, customer & supplier history, **day-close**, **returns**, monthly P&L.
- **DoD:** staff see only permitted scope; owner sees full financials; numbers reconcile with underlying records; `/design-review` on dashboard.

### M12 — PWA Polish & Hardening
- PWA manifest, icons, installable/standalone; fast transitions.
- Accessibility + performance pass; full **RLS test sweep** across roles/outlets; audit-log coverage check.
- Idempotent **demo/seed data** for onboarding.
- **DoD:** installable on phone; a11y/contrast/focus pass; RLS suite green; V1 exit criteria met.

---

## D. Cross-Cutting Workstreams (run continuously)

- **Testing:** Vitest for domain (landed cost, FIFO, min-price/override, profit, day-close, returns); integration tests vs local Supabase for RLS + transactional RPCs (no negative stock, rollback on partial failure).
- **Security/RLS:** every new table ships with policies + at least one negative test (wrong org / wrong outlet / staff-writing-cost all denied).
- **Audit:** every listed action (min-price override, plant edit, purchase, sale/void, loss, transfer, permission change, day-close, return) writes `audit_logs`.
- **i18n:** no hardcoded UI strings; add `en` + `hi` keys as screens land.
- **Design:** tokens established in M3 and reused; `/design-review` gate on each significant screen.

---

## E. V1 Exit Criteria (Definition of Success)

The blueprint §45 walkthrough passes end-to-end on a phone: login → select outlet → find plant → view info → create purchase → truck expenses → see landed cost → see min/recommended → receive stock → transfer → add customer → create sale → auto-deduct stock → auto profit → invoice → WhatsApp share → day-close; a customer scans a QR and sees info (no price) with enquiry; the Owner sees sales/stock/profit/staff/cash in reports. Plus: all money/stock math tested, RLS enforced, migrations-only schema, no secrets client-side.

---

## F. Commit Checkpoints

Commit at the end of each milestone (and each vertical slice within a large one). I'll remind you; you commit. Suggested granularity: one commit per migration group, one per domain module + its tests, one per completed screen.

---

## G. Immediate Next Step

Start **M0 (foundation)** or, if you want the schema locked before any app code, jump to **M1** and I'll draft the migrations + RLS + role→permission matrix for your approval (the blueprint's "First Task" gate). Tell me which and I'll begin.
