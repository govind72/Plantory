-- =============================================================================
-- Plantory — Migration 0008: pricing
-- plant_prices holds the effective min/recommended/retail price per plant+size.
-- Staff CAN read these (they need the floor to sell) but landed COST is never
-- here — it lives in inventory_batches (manager+ only). Global margin/rounding
-- defaults live in org_settings; category-level price_rules can be added in M7.
-- =============================================================================

create table public.plant_prices (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete restrict,
  plant_id           uuid not null references public.plants (id) on delete cascade,
  size_id            uuid not null references public.plant_sizes (id) on delete cascade,
  min_price          numeric(12,2) check (min_price is null or min_price >= 0),
  recommended_price  numeric(12,2) check (recommended_price is null or recommended_price >= 0),
  retail_price       numeric(12,2) check (retail_price is null or retail_price >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  updated_by         uuid references public.profiles (id),
  unique (plant_id, size_id)
);
create index plant_prices_org_idx on public.plant_prices (organization_id);
create trigger plant_prices_set_updated_at
  before update on public.plant_prices
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS: readable by all org members; writable by Owner/Admin only.
-- =============================================================================
alter table public.plant_prices enable row level security;

create policy plant_prices_select on public.plant_prices
  for select to authenticated
  using (organization_id = public.auth_org_id());

create policy plant_prices_write on public.plant_prices
  for all to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());
