-- =============================================================================
-- Plantory — Migration 0004: catalogue
-- plant_categories, plants (+ unguessable public_slug for QR), plant_sizes
-- (structured height_ft + bag_size), plant_images.
-- Public QR page reads ONLY via get_public_plant() (no price, no stock).
-- =============================================================================

-- Plant attribute vocabularies.
create type public.sunlight_requirement as enum ('full_sun', 'partial_shade', 'full_shade');
create type public.water_requirement as enum ('low', 'medium', 'high');
create type public.placement as enum ('indoor', 'outdoor', 'both');

-- -----------------------------------------------------------------------------
-- plant_categories
-- -----------------------------------------------------------------------------
create table public.plant_categories (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  name_en          text not null,
  name_hi          text,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  unique (organization_id, name_en)
);
create index plant_categories_org_idx on public.plant_categories (organization_id);
create trigger plant_categories_set_updated_at
  before update on public.plant_categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- plants — bilingual master. public_slug is unguessable (QR page uses it).
-- -----------------------------------------------------------------------------
create table public.plants (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete restrict,
  sku               text,
  common_name_en    text not null,
  common_name_hi    text,
  scientific_name   text,
  local_name        text,
  category_id       uuid references public.plant_categories (id) on delete set null,
  variety           text,
  description_en    text,
  description_hi    text,
  care_en           text,
  care_hi           text,
  sunlight          public.sunlight_requirement,
  water             public.water_requirement,
  placement         public.placement,
  unit              text not null default 'piece',
  public_slug       text not null unique default encode(gen_random_bytes(9), 'hex'),
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references public.profiles (id)
);
create index plants_org_idx on public.plants (organization_id);
create index plants_category_idx on public.plants (category_id);
create unique index plants_org_sku_uidx
  on public.plants (organization_id, sku) where sku is not null;
create trigger plants_set_updated_at
  before update on public.plants
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- plant_sizes — a sellable variant = height (feet) + bag size.
-- Either/both of height_ft and bag_size may be set; `label` is always shown.
-- size_id flows through purchases, inventory batches, and sales.
-- -----------------------------------------------------------------------------
create table public.plant_sizes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  plant_id         uuid not null references public.plants (id) on delete cascade,
  height_ft        numeric(6,2),          -- plant height in feet, e.g. 6.00
  bag_size         text,                  -- e.g. "12 inch", "10x10", "No. 8"
  label            text not null,         -- display, e.g. "6 ft • 12in bag"
  sort_order       integer not null default 0,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (plant_id, label),
  check (height_ft is null or height_ft > 0)
);
create index plant_sizes_plant_idx on public.plant_sizes (plant_id);
create trigger plant_sizes_set_updated_at
  before update on public.plant_sizes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- plant_images — files live in Supabase Storage; we store the path.
-- -----------------------------------------------------------------------------
create table public.plant_images (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  plant_id         uuid not null references public.plants (id) on delete cascade,
  storage_path     text not null,
  alt_text         text,
  sort_order       integer not null default 0,
  is_primary       boolean not null default false,
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id)
);
create index plant_images_plant_idx on public.plant_images (plant_id);

-- =============================================================================
-- RLS: catalogue is readable by everyone in the org; writes are Owner/Admin.
-- =============================================================================
alter table public.plant_categories enable row level security;
alter table public.plants enable row level security;
alter table public.plant_sizes enable row level security;
alter table public.plant_images enable row level security;

-- select (all org members)
create policy plant_categories_select on public.plant_categories
  for select to authenticated using (organization_id = public.auth_org_id());
create policy plants_select on public.plants
  for select to authenticated using (organization_id = public.auth_org_id());
create policy plant_sizes_select on public.plant_sizes
  for select to authenticated using (organization_id = public.auth_org_id());
create policy plant_images_select on public.plant_images
  for select to authenticated using (organization_id = public.auth_org_id());

-- write (Owner/Admin) — one policy each for insert/update/delete via FOR ALL
create policy plant_categories_write on public.plant_categories
  for all to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());
create policy plants_write on public.plants
  for all to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());
create policy plant_sizes_write on public.plant_sizes
  for all to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());
create policy plant_images_write on public.plant_images
  for all to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

-- =============================================================================
-- Public QR page data source. SECURITY DEFINER: returns ONLY safe fields
-- (info + care + sizes incl. height/bag + images). NO price, NO stock.
-- =============================================================================
create or replace function public.get_public_plant(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'nursery_name', o.name,
    'common_name_en', p.common_name_en,
    'common_name_hi', p.common_name_hi,
    'scientific_name', p.scientific_name,
    'local_name', p.local_name,
    'variety', p.variety,
    'description_en', p.description_en,
    'description_hi', p.description_hi,
    'care_en', p.care_en,
    'care_hi', p.care_hi,
    'sunlight', p.sunlight,
    'water', p.water,
    'placement', p.placement,
    'unit', p.unit,
    'sizes', coalesce((
      select jsonb_agg(
        jsonb_build_object('height_ft', s.height_ft, 'bag_size', s.bag_size, 'label', s.label)
        order by s.sort_order, s.label
      )
      from public.plant_sizes s
      where s.plant_id = p.id and s.active
    ), '[]'::jsonb),
    'images', coalesce((
      select jsonb_agg(
        jsonb_build_object('storage_path', i.storage_path, 'alt', i.alt_text)
        order by i.is_primary desc, i.sort_order
      )
      from public.plant_images i
      where i.plant_id = p.id
    ), '[]'::jsonb)
  )
  from public.plants p
  join public.organizations o on o.id = p.organization_id
  where p.public_slug = p_slug and p.active and o.active
$$;

grant execute on function public.get_public_plant(text) to anon, authenticated;
