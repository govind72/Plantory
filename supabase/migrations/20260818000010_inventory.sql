-- =============================================================================
-- Plantory — Migration 0007: inventory
-- inventory_batches (FIFO, carries landed cost), stock_movements, transfers,
-- plant_losses. Cost-bearing rows are manager+ only. Staff read availability
-- (qty only, NO cost) through get_outlet_stock().
-- =============================================================================

-- -----------------------------------------------------------------------------
-- inventory_batches — one row per received lot per outlet; preserves batch cost.
-- FIFO consumption draws down qty_remaining oldest-first (received_at).
-- -----------------------------------------------------------------------------
create table public.inventory_batches (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete restrict,
  outlet_id         uuid not null references public.outlets (id) on delete restrict,
  plant_id          uuid not null references public.plants (id) on delete restrict,
  size_id           uuid not null references public.plant_sizes (id) on delete restrict,
  purchase_item_id  uuid references public.purchase_items (id) on delete set null,
  source_batch_id   uuid references public.inventory_batches (id) on delete set null, -- set on transfer-in
  landed_unit_cost  numeric(12,2) not null check (landed_unit_cost >= 0),
  qty_received      integer not null check (qty_received >= 0),
  qty_remaining     integer not null check (qty_remaining >= 0),
  received_at       timestamptz not null default now(),
  note              text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  created_by        uuid references public.profiles (id),
  check (qty_remaining <= qty_received)
);
create index inventory_batches_lookup_idx
  on public.inventory_batches (outlet_id, plant_id, size_id, received_at);

-- -----------------------------------------------------------------------------
-- stock_movements — audit trail of every inventory change (carries unit_cost).
-- quantity is a positive magnitude; direction is implied by movement_type.
-- -----------------------------------------------------------------------------
create table public.stock_movements (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid not null references public.outlets (id) on delete restrict,
  plant_id         uuid not null references public.plants (id) on delete restrict,
  size_id          uuid not null references public.plant_sizes (id) on delete restrict,
  batch_id         uuid references public.inventory_batches (id) on delete set null,
  movement_type    public.stock_movement_type not null,
  quantity         integer not null check (quantity > 0),
  unit_cost        numeric(12,2),
  reference_type   text,        -- e.g. 'sale', 'purchase', 'transfer', 'loss', 'return'
  reference_id     uuid,
  note             text,
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id)
);
create index stock_movements_lookup_idx
  on public.stock_movements (outlet_id, plant_id, size_id, created_at);
create index stock_movements_reference_idx
  on public.stock_movements (reference_type, reference_id);

-- -----------------------------------------------------------------------------
-- stock_transfers + items
-- -----------------------------------------------------------------------------
create table public.stock_transfers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  from_outlet_id   uuid not null references public.outlets (id) on delete restrict,
  to_outlet_id     uuid not null references public.outlets (id) on delete restrict,
  status           text not null default 'completed',
  note             text,
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  check (from_outlet_id <> to_outlet_id)
);
create index stock_transfers_org_idx on public.stock_transfers (organization_id);

create table public.stock_transfer_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  transfer_id      uuid not null references public.stock_transfers (id) on delete cascade,
  plant_id         uuid not null references public.plants (id) on delete restrict,
  size_id          uuid not null references public.plant_sizes (id) on delete restrict,
  quantity         integer not null check (quantity > 0),
  created_at       timestamptz not null default now()
);
create index stock_transfer_items_transfer_idx on public.stock_transfer_items (transfer_id);

-- -----------------------------------------------------------------------------
-- plant_losses — mortality/damage etc. (affects stock and profitability).
-- -----------------------------------------------------------------------------
create table public.plant_losses (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid not null references public.outlets (id) on delete restrict,
  plant_id         uuid not null references public.plants (id) on delete restrict,
  size_id          uuid not null references public.plant_sizes (id) on delete restrict,
  batch_id         uuid references public.inventory_batches (id) on delete set null,
  quantity         integer not null check (quantity > 0),
  reason           public.loss_reason not null,
  note             text,
  loss_date        date not null default current_date,
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id)
);
create index plant_losses_org_outlet_idx on public.plant_losses (organization_id, outlet_id);

-- =============================================================================
-- RLS — manager+ scoped to outlet (Staff excluded from cost-bearing rows).
-- =============================================================================
alter table public.inventory_batches enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_transfers enable row level security;
alter table public.stock_transfer_items enable row level security;
alter table public.plant_losses enable row level security;

create policy inventory_batches_access on public.inventory_batches
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

create policy stock_movements_access on public.stock_movements
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

create policy stock_transfers_access on public.stock_transfers
  for all to authenticated
  using (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and (public.is_member_of_outlet(from_outlet_id) or public.is_member_of_outlet(to_outlet_id))
  )
  with check (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and (public.is_member_of_outlet(from_outlet_id) or public.is_member_of_outlet(to_outlet_id))
  );

create policy stock_transfer_items_access on public.stock_transfer_items
  for all to authenticated
  using (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and exists (
      select 1 from public.stock_transfers t
      where t.id = transfer_id
        and (public.is_member_of_outlet(t.from_outlet_id) or public.is_member_of_outlet(t.to_outlet_id))
    )
  )
  with check (
    organization_id = public.auth_org_id()
    and public.auth_role() in ('owner', 'admin', 'outlet_manager')
    and exists (
      select 1 from public.stock_transfers t
      where t.id = transfer_id
        and (public.is_member_of_outlet(t.from_outlet_id) or public.is_member_of_outlet(t.to_outlet_id))
    )
  );

create policy plant_losses_access on public.plant_losses
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

-- =============================================================================
-- Staff-safe availability: qty only, NO cost. Caller must belong to the outlet.
-- =============================================================================
create or replace function public.get_outlet_stock(p_outlet uuid)
returns table (plant_id uuid, size_id uuid, size_label text, qty_available bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select b.plant_id, b.size_id, s.label, sum(b.qty_remaining)::bigint
  from public.inventory_batches b
  join public.plant_sizes s on s.id = b.size_id
  where b.outlet_id = p_outlet
    and b.organization_id = public.auth_org_id()
    and public.is_member_of_outlet(p_outlet)
    and b.active
  group by b.plant_id, b.size_id, s.label
  having sum(b.qty_remaining) > 0
$$;

grant execute on function public.get_outlet_stock(uuid) to authenticated;
