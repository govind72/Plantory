-- =============================================================================
-- Plantory — Migration 0002: identity tables
-- organizations → outlets → users(profiles) + user_outlets + org_settings,
-- plus the append-only audit_logs table. RLS is added in migration 0003.
-- Multi-tenant from day one: every row is scoped by organization_id.
-- =============================================================================

-- Shared trigger: keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- organizations — the tenant. The nursery display name lives here (dynamic).
-- -----------------------------------------------------------------------------
create table public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,                 -- e.g. "Shangrila Greens" (shown everywhere, dynamically)
  legal_name        text,
  gst_enabled       boolean not null default false,
  gstin             text,
  default_language  public.app_language not null default 'en',
  currency          text not null default 'INR',
  whatsapp_number   text,                          -- business WhatsApp (digits only, intl format)
  logo_url          text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- outlets — a physical nursery/branch. Stock is outlet-scoped.
-- -----------------------------------------------------------------------------
create table public.outlets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  name             text not null,
  address          text,
  phone            text,
  whatsapp_number  text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index outlets_organization_id_idx on public.outlets (organization_id);

create trigger outlets_set_updated_at
  before update on public.outlets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- profiles — one per auth user. id == auth.users.id.
-- Users are provisioned by Owner/Admin (no public signup).
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  organization_id    uuid not null references public.organizations (id) on delete restrict,
  full_name          text not null,
  mobile             text,
  role               public.user_role not null default 'staff',
  preferred_language public.app_language not null default 'en',
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references public.profiles (id)
);

create index profiles_organization_id_idx on public.profiles (organization_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_outlets — which outlet(s) a user is assigned to.
-- Owner/Admin implicitly span all outlets in their org (enforced in RLS helpers);
-- outlet_manager/staff are limited to their assigned rows here.
-- -----------------------------------------------------------------------------
create table public.user_outlets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  outlet_id        uuid not null references public.outlets (id) on delete cascade,
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  unique (user_id, outlet_id)
);

create index user_outlets_user_id_idx on public.user_outlets (user_id);
create index user_outlets_outlet_id_idx on public.user_outlets (outlet_id);

-- -----------------------------------------------------------------------------
-- org_settings — one row per org: global pricing/costing defaults.
-- Per-category/per-plant price overrides come later (pricing migration).
-- -----------------------------------------------------------------------------
create table public.org_settings (
  organization_id          uuid primary key references public.organizations (id) on delete cascade,
  cost_allocation_method   public.cost_allocation_method not null default 'purchase_value',
  inventory_costing        text not null default 'fifo',
  min_margin_pct           numeric(5,2) not null default 15,
  target_margin_pct        numeric(5,2) not null default 25,
  price_rounding_step      numeric(12,2) not null default 10,
  below_min_override_role  public.user_role not null default 'owner', -- min role allowed to override below-minimum sales
  updated_at               timestamptz not null default now()
);

create trigger org_settings_set_updated_at
  before update on public.org_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- audit_logs — append-only trail of important changes (CLAUDE.md §3, §37).
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid references public.outlets (id) on delete set null,
  actor_id         uuid references public.profiles (id) on delete set null,
  action           text not null,          -- e.g. 'min_price_override', 'sale_void', 'transfer'
  entity           text not null,          -- table/entity name, e.g. 'sales'
  entity_id        uuid,
  old_value        jsonb,
  new_value        jsonb,
  note             text,
  created_at       timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
