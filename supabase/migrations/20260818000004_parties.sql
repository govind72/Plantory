-- =============================================================================
-- Plantory — Migration 0005: parties
-- suppliers (Owner/Admin/Manager only) and customers (any staff can create).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- suppliers
-- -----------------------------------------------------------------------------
create table public.suppliers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  name             text not null,
  contact_person   text,
  phone            text,
  gstin            text,
  address          text,
  notes            text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id)
);
create index suppliers_org_idx on public.suppliers (organization_id);
create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
create table public.customers (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete restrict,
  name               text not null,
  phone              text,
  whatsapp_number    text,
  email              text,
  address            text,
  preferred_language public.app_language not null default 'en',
  whatsapp_opt_in    boolean not null default true,
  notes              text,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references public.profiles (id)
);
create index customers_org_idx on public.customers (organization_id);
create index customers_phone_idx on public.customers (organization_id, phone);
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.suppliers enable row level security;
alter table public.customers enable row level security;

-- suppliers: Owner/Admin/Manager can view & manage; Staff have no access.
create policy suppliers_select on public.suppliers
  for select to authenticated
  using (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
  );
create policy suppliers_write on public.suppliers
  for all to authenticated
  using (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
  )
  with check (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
  );

-- customers: any org member can view & create/update (Staff create customers).
create policy customers_select on public.customers
  for select to authenticated
  using (organization_id = public.auth_org_id());
create policy customers_insert on public.customers
  for insert to authenticated
  with check (organization_id = public.auth_org_id());
create policy customers_update on public.customers
  for update to authenticated
  using (organization_id = public.auth_org_id())
  with check (organization_id = public.auth_org_id());
create policy customers_delete on public.customers
  for delete to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin());
