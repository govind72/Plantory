-- =============================================================================
-- Plantory — Migration 0006: purchasing
-- purchases + purchase_items + purchase_expenses. These carry COST, so they are
-- visible to Owner/Admin/Outlet-Manager only — never Staff (CLAUDE.md §3).
-- Landed-cost computation + batch creation happen in a transactional RPC (M5).
-- outlet_id is denormalized onto child rows so RLS is uniform and fast.
-- =============================================================================

-- Reusable predicate note: "manager+ scoped to outlet" =
--   organization_id = auth_org_id()
--   AND auth_role() in ('owner','admin','outlet_manager')
--   AND is_member_of_outlet(outlet_id)   -- admins pass for any outlet in org

create table public.purchases (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete restrict,
  outlet_id            uuid not null references public.outlets (id) on delete restrict,
  supplier_id          uuid references public.suppliers (id) on delete set null,
  supplier_invoice_no  text,
  purchase_date        date not null default current_date,
  truck_number         text,
  source_location      text,
  notes                text,
  status               public.purchase_status not null default 'draft',
  items_subtotal       numeric(12,2) not null default 0,
  expenses_total       numeric(12,2) not null default 0,
  landed_total         numeric(12,2) not null default 0,
  voided_at            timestamptz,
  voided_by            uuid references public.profiles (id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid references public.profiles (id)
);
create index purchases_org_outlet_idx on public.purchases (organization_id, outlet_id);
create index purchases_supplier_idx on public.purchases (supplier_id);
create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

create table public.purchase_items (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete restrict,
  outlet_id          uuid not null references public.outlets (id) on delete restrict,
  purchase_id        uuid not null references public.purchases (id) on delete cascade,
  plant_id           uuid not null references public.plants (id) on delete restrict,
  size_id            uuid not null references public.plant_sizes (id) on delete restrict,
  quantity           integer not null check (quantity > 0),
  unit_cost          numeric(12,2) not null check (unit_cost >= 0),
  line_amount        numeric(12,2) not null check (line_amount >= 0),
  allocated_expense  numeric(12,2) not null default 0,
  landed_unit_cost   numeric(12,2),
  landed_line_total  numeric(12,2),
  created_at         timestamptz not null default now()
);
create index purchase_items_purchase_idx on public.purchase_items (purchase_id);
create index purchase_items_plant_idx on public.purchase_items (plant_id);

create table public.purchase_expenses (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid not null references public.outlets (id) on delete restrict,
  purchase_id      uuid not null references public.purchases (id) on delete cascade,
  label            text not null,          -- e.g. "Truck fare", "Loading"
  amount           numeric(12,2) not null check (amount >= 0),
  created_at       timestamptz not null default now()
);
create index purchase_expenses_purchase_idx on public.purchase_expenses (purchase_id);

-- =============================================================================
-- RLS — manager+ scoped to outlet (Staff excluded).
-- =============================================================================
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.purchase_expenses enable row level security;

create policy purchases_access on public.purchases
  for all to authenticated
  using (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and public.is_member_of_outlet(outlet_id)
  )
  with check (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and public.is_member_of_outlet(outlet_id)
  );

create policy purchase_items_access on public.purchase_items
  for all to authenticated
  using (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and public.is_member_of_outlet(outlet_id)
  )
  with check (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and public.is_member_of_outlet(outlet_id)
  );

create policy purchase_expenses_access on public.purchase_expenses
  for all to authenticated
  using (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and public.is_member_of_outlet(outlet_id)
  )
  with check (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and public.is_member_of_outlet(outlet_id)
  );
