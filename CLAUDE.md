# CLAUDE.md — Coding Instructions for Plantory

These are the **binding rules** for any AI/coding agent working on Plantory. Read this file **and** `Plantory_Nursery_Management_Product_Blueprint.md` before writing code. When this file and general habits conflict, **this file wins**. When something is ambiguous, **ask — do not assume** (see §0 of the blueprint for locked decisions).

---

## 0. Golden Rules (never break these)

1. **Migrations only.** Every schema change is a versioned SQL file in `supabase/migrations/`, applied via the Supabase CLI. **Never** create or alter tables/policies/functions through the Supabase dashboard, and never tell the user to. If you need a schema change, write a migration.
2. **Server-side logic only for anything trusted.** Prices, costs, profit, stock deduction, role checks, and writes run in **Server Components / Server Actions / Route Handlers**. The browser is never trusted.
3. **RLS is the real security boundary.** Every table has Row Level Security enabled with explicit policies. UI role checks are for UX convenience only. No table ships without RLS.
4. **Never expose the `service_role` key or any secret to the client.** Secrets live only in server env vars.
5. **Never allow silent negative stock.** A sale/transfer that would exceed available stock must fail loudly with a clear error.
6. **Never allow a silent below-minimum sale.** Below-minimum requires permission + explicit override + an audit log entry.
7. **Money & stock math is deterministic and unit-tested.** Landed cost, FIFO batch consumption, pricing, and profit have tests before they are trusted.
8. **Multi-tenant-ready.** Every business row carries `organization_id`; outlet-scoped rows carry `outlet_id`. RLS filters by them. Even though there is one org today, never write logic that assumes a single org.
9. **Nursery name is dynamic.** Read the org/outlet name from the DB. Never hardcode "Shangrila Greens" in UI, invoices, or messages.
10. **One responsive codebase.** No separate desktop/mobile apps. Build mobile-first; enhance up.
11. **Ask before scope creep.** Before adding a module not in V1 scope (blueprint §41), explain why and confirm it belongs in V1.

---

## 1. Architecture Overview

- **Framework:** Next.js App Router + TypeScript (strict).
- **Data access:** Supabase Postgres. Use two client types:
  - **Server Supabase client** (per-request, uses the user's session/JWT) for all normal reads/writes — RLS applies.
  - **Service-role client** only in trusted server code for narrow, audited operations that genuinely must bypass RLS (e.g. system jobs). Prefer **Postgres functions (RPC) with `security definer`** for privileged multi-step operations (stock deduction, transfers) so logic + permission checks live atomically in the database.
- **Mutations:** Server Actions (or Route Handlers for webhooks/public endpoints). No direct DB writes from client components.
- **Validation:** Zod schemas shared where possible; validate on the **server** for every mutation even if the client also validated.
- **Public endpoints** (invoice-by-token, public plant page): Route Handlers / server components that read only the minimum data and never require auth, guarded by an unguessable token, never by a sequential id.

---

## 2. Database & Migrations

- All schema lives in `supabase/migrations/NNNN_description.sql`, in git, applied with `supabase db push` / `supabase migration`. Local dev uses `supabase start`.
- Each migration is **forward-only and reviewable**; do not edit an already-applied migration — add a new one.
- Every table: `id` (uuid), `organization_id`, `created_at`, `created_by`; outlet-scoped tables add `outlet_id`. Financial tables add soft-delete/void columns (`voided_at`, `voided_by`) — **no hard deletes** of financial data by normal users.
- **Enable RLS on every table** in the same migration that creates it, with explicit `select/insert/update/delete` policies. A table without policies must be unreachable, not open.
- Use Postgres **enums or check constraints** for fixed vocabularies (roles, movement types, payment methods, message types).
- Money: store as integer **paise** or `numeric(12,2)` — pick one convention, document it, never use floats for money.
- Provide a **seed migration/script** that inserts the Shangrila Greens org, a Main Nursery outlet, and the Owner user, plus default price rules — idempotent.
- Generate and commit **TypeScript types** from the DB schema (`supabase gen types typescript`) and use them everywhere.

---

## 3. Security & Authorization

- RLS policies derive the user's `organization_id`, role, and outlet assignments from their JWT/`profiles`/`user_outlets`. Do not trust anything the client sends about role or outlet.
- Role capability matrix (enforce in RLS **and** server actions):
  - **Owner:** everything in their org.
  - **Admin:** operational everything; financial-sensitive actions may require Owner.
  - **Outlet Manager:** their assigned outlet(s) only.
  - **Staff:** create sales/customers, view catalogue & their outlet stock; **cannot** touch cost, landed cost, minimum price, or business-wide profit.
- **Users are provisioned by Owner/Admin only.** No public signup route.
- Privileged multi-step writes (sale → stock deduction → movements → profit) go through a single **transactional RPC** so they cannot partially apply.
- Log to `audit_logs` for: min-price change/override, plant edit, purchase create/edit, sale create/void, loss, transfer, permission change, day-close finalize, return.
- Public invoice/plant pages: token-based, view-only, minimal fields, no auth, no PII beyond what that invoice needs.

---

## 4. Business Logic Rules

- **Landed cost:** `landed = purchase cost + allocated purchase expenses`. V1 allocation = **proportional to purchase value** (make the method a config value). Compute on purchase finalize; store per-batch landed cost.
- **Inventory:** batch-based. **FIFO** consumption for sales/transfers. A sale item records the exact batch(es) and cost consumed. Never collapse batches into a single quantity.
- **Every stock change writes a `stock_movements` row** (purchase, sale, transfer out/in, mortality, damage, adjustment, return in).
- **Pricing:** min/recommended derived from landed cost + margin rules (configurable), editable only by permitted roles. Selling below minimum → warning; below landed cost → loss warning; override → permission + audit.
- **Profit:** `selling price − actual batch cost consumed`. Business net = sales − COGS − operating expenses − losses.
- **Transfers:** decrement source, increment destination, both with movements, preserving batch cost; cannot exceed source stock.
- **Day-close:** compute expected cash from recorded sales by method; store counted cash + variance; finalize is a record.
- **Returns:** reference original sale item; refund or replacement; create appropriate movement; reflect in customer history + profit.
- Keep all of the above in **pure, testable functions** (`lib/domain/*`) separate from IO, plus the DB-side RPCs for atomicity.

---

## 5. Frontend / UI Rules

- **Mobile-first.** Bottom navigation + bottom sheets on phones; collapsible sidebar on tablet; full sidebar + dense tables on desktop. Same components, responsive — never a second app.
- Use **shadcn/ui + Tailwind + Lucide**. Build small, reusable, composable components. No copy-pasted desktop/mobile variants of the same screen.
- Forms: **React Hook Form + Zod**, with server-side revalidation. Large touch targets, clear validation, optimistic UI only where safe.
- **i18n via next-intl.** All user-facing strings come from message files (`en`, `hi`) — never hardcode display text, never store UI strings in the DB. Respect the user's `preferred_language`.
- Show the **nursery name dynamically** in headers, invoices, public pages, and WhatsApp messages.
- Currency formatted as INR (₹). Numbers/dates locale-aware.
- Role-based UI: hide actions a role can't perform — but remember the DB is the real gate.
- Rich but restrained: fast, uncluttered, accessible (labels, focus states, contrast). It should feel like a polished app, not a form dump.

### 5.1 Design skills — use the `designer-skills` plugin (REQUIRED for UI work)

The `designer-skills` plugin is installed. **Before designing screens, components, or the visual system, use these skills** instead of improvising styling ad hoc. Invoke them with the Skill tool (e.g. `/frontend-design`), or run the whole sequence via `/design-flow`.

Available skills and when to use each:

| Skill | Use it when |
|-------|-------------|
| `/design-flow` | Starting a new UI area and you want the full guided sequence (grill → brief → IA → tokens → tasks → build → review). Preferred entry point for any non-trivial screen. |
| `/grill-me` | Resolving open UI/UX decisions before building — layout, states, edge cases. |
| `/design-brief` | Turning decisions into a structured brief that respects the existing Plantory codebase. |
| `/information-architecture` | Defining navigation, page structure, URL patterns, and user flows (e.g. the sale flow, purchase flow, dashboard hierarchy). |
| `/design-tokens` | **Do this once, early.** Generate the Plantory token system (colors, spacing, typography, motion) with **light + dark** palettes. All components must consume these tokens. |
| `/brief-to-tasks` | Breaking a brief into ordered, independently buildable vertical slices (aligns with the build order in the blueprint). |
| `/frontend-design` | Actually building a screen/component — mobile-first, dark-mode-aware, against a chosen aesthetic philosophy and the design tokens. |
| `/design-review` | Critiquing a built screen against the brief (code + screenshot) before it's considered done. |

Rules for using them on Plantory:
- **Establish design tokens first** (`/design-tokens`) and reuse them everywhere — this is what keeps the phone/tablet/desktop experiences visually consistent from one codebase.
- Keep every design decision **compatible with the hard rules in §5**: mobile-first, single responsive codebase, shadcn/ui + Tailwind + Lucide, next-intl for all copy, dynamic nursery name, INR formatting, role-based visibility.
- Run **`/design-review`** on each significant screen (sales, purchase, dashboard, public plant page) before marking it complete.
- These skills inform **how** the UI looks and is structured; they do **not** override the security, RLS, server-logic, or business-math rules in this file.

---

## 6. WhatsApp (V1)

- Deep-link only: build a `wa.me/<number>?text=<encoded>` link; staff taps Send. No API keys, no cost.
- Invoice links use a **secure random token** route `/invoice/<token>`; never a sequential id.
- Enquiry button on public plant page builds a pre-filled `wa.me` message referencing the plant.
- Optionally insert a `whatsapp_messages` row (status `deep_link_opened`) so history exists for the future Cloud API. Do **not** integrate the Cloud API in V1.

---

## 7. Project Structure (guideline)

```
/app
  /(app)            authenticated app (dashboard, sales, purchases, inventory, ...)
  /(public)         public routes: /invoice/[token], /p/[plantSlug] (QR page)
  /api              route handlers (webhooks, public endpoints)
/components          shared UI (shadcn-based)
/lib
  /supabase         server & browser client factories
  /domain           pure business logic (landed cost, fifo, pricing, profit) + tests
  /validation       zod schemas
  /i18n             next-intl config
/messages           en.json, hi.json
/supabase
  /migrations       versioned SQL (the ONLY way schema changes)
  seed.sql
/types              generated DB types
```

---

## 8. Environment Variables

Server-only unless prefixed `NEXT_PUBLIC_`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never shipped to client)
- `NEXT_PUBLIC_APP_URL` (for building invoice links)
- `NURSERY_WHATSAPP_NUMBER` (or store per-org in DB)
- (Future, not V1) translation provider key, WhatsApp Cloud API tokens — do not add paid providers without explicit approval.

Provide a `.env.example`; never commit real secrets.

---

## 9. Testing

- Unit-test the domain functions: **landed cost allocation, FIFO consumption, min-price/override logic, profit, day-close variance, returns**. These must be deterministic.
- Test RLS: a staff user cannot read another outlet's stock or write cost fields; a below-minimum sale fails without override.
- Test the transactional sale RPC: stock never goes negative; partial failures roll back.
- Prefer fast tests (Vitest) for domain; integration tests against a local Supabase for RLS/RPC.

---

## 10. Workflow Expectations

1. Before coding a module, restate the relevant schema and confirm it, then write the **migration** first.
2. Implement domain logic + tests, then the server actions/RPC, then the UI.
3. Keep PRs/changes small and aligned to the build order (blueprint §43).
4. Never introduce a paid external service, a new heavy dependency, or an out-of-V1 module without explaining why and getting approval.
5. When you hit an ambiguity or a decision not covered by the blueprint's locked decisions, **stop and ask** with specific options.

---

## 11. First Task for the Agent (do this before app code)

Produce and get approval on:
1. High-level architecture confirmation.
2. Full PostgreSQL schema proposal **as migration files** (with RLS policies).
3. ERD / relationship summary.
4. RLS strategy + role→permission matrix.
5. Inventory/FIFO costing strategy, landed-cost algorithm, min-price algorithm, profit algorithm (as spec + pure-function signatures).
6. Sales/invoice, purchase, transfer, return, and day-close lifecycles.
7. EN/HI i18n strategy and WhatsApp V1 strategy.
8. Folder structure, env vars, testing strategy.
9. V1 milestone plan (small, in build-order).

**Stop after this plan and wait for approval before implementing.**
