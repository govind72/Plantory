-- =============================================================================
-- Plantory — Migration 0009: sales
-- sales (header, no cost) + sale_items (carry cost/profit → manager+ only) +
-- payments + returns/return_items. Public invoice via get_public_invoice(token).
-- The actual sale write (FIFO deduct + profit + movements) is a transactional
-- RPC built in M8; here we lay down the schema + RLS.
-- =============================================================================

create table public.sales (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete restrict,
  outlet_id         uuid not null references public.outlets (id) on delete restrict,
  customer_id       uuid references public.customers (id) on delete set null,
  invoice_no        text,
  invoice_token     text not null unique default encode(gen_random_bytes(12), 'hex'),
  sale_date         timestamptz not null default now(),
  status            public.sale_status not null default 'completed',
  items_subtotal    numeric(12,2) not null default 0,
  discount_total    numeric(12,2) not null default 0,
  tax_total         numeric(12,2) not null default 0,
  total             numeric(12,2) not null default 0,
  amount_paid       numeric(12,2) not null default 0,
  outstanding       numeric(12,2) not null default 0,
  invoice_language  public.invoice_language not null default 'en',
  sold_by           uuid references public.profiles (id),   -- staff attribution
  notes             text,
  voided_at         timestamptz,
  voided_by         uuid references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references public.profiles (id),
  unique (organization_id, invoice_no)
);
create index sales_org_outlet_date_idx on public.sales (organization_id, outlet_id, sale_date desc);
create index sales_customer_idx on public.sales (customer_id);
create trigger sales_set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- sale_items carry COST and PROFIT → not directly readable by Staff.
-- Name/size snapshots keep historical invoices reproducible.
create table public.sale_items (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete restrict,
  outlet_id            uuid not null references public.outlets (id) on delete restrict,
  sale_id              uuid not null references public.sales (id) on delete cascade,
  plant_id             uuid not null references public.plants (id) on delete restrict,
  size_id              uuid not null references public.plant_sizes (id) on delete restrict,
  plant_name_snapshot  text not null,
  size_label_snapshot  text,
  quantity             integer not null check (quantity > 0),
  unit_price           numeric(12,2) not null check (unit_price >= 0),
  discount             numeric(12,2) not null default 0,
  line_total           numeric(12,2) not null,
  cost_total           numeric(12,2) not null default 0,   -- FIFO cost consumed
  profit_total         numeric(12,2) not null default 0,
  below_min            boolean not null default false,
  override_by          uuid references public.profiles (id),
  created_at           timestamptz not null default now()
);
create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_plant_idx on public.sale_items (plant_id);

create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid references public.outlets (id) on delete set null,
  direction        public.payment_direction not null,
  method           public.payment_method not null,
  amount           numeric(12,2) not null check (amount > 0),
  paid_at          timestamptz not null default now(),
  customer_id      uuid references public.customers (id) on delete set null,
  sale_id          uuid references public.sales (id) on delete set null,
  supplier_id      uuid references public.suppliers (id) on delete set null,
  purchase_id      uuid references public.purchases (id) on delete set null,
  reference        text,
  note             text,
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id),
  check (
    (direction = 'customer_in'  and (customer_id is not null or sale_id is not null)) or
    (direction = 'supplier_out' and (supplier_id is not null or purchase_id is not null))
  )
);
create index payments_org_idx on public.payments (organization_id);
create index payments_sale_idx on public.payments (sale_id);
create index payments_purchase_idx on public.payments (purchase_id);

create table public.returns (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid not null references public.outlets (id) on delete restrict,
  sale_id          uuid not null references public.sales (id) on delete restrict,
  return_type      public.return_type not null,
  reason           text,
  refund_amount    numeric(12,2) not null default 0,
  note             text,
  created_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id)
);
create index returns_sale_idx on public.returns (sale_id);

create table public.return_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid not null references public.outlets (id) on delete restrict,
  return_id        uuid not null references public.returns (id) on delete cascade,
  sale_item_id     uuid not null references public.sale_items (id) on delete restrict,
  quantity         integer not null check (quantity > 0),
  restock          boolean not null default true,
  created_at       timestamptz not null default now()
);
create index return_items_return_idx on public.return_items (return_id);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.returns enable row level security;
alter table public.return_items enable row level security;

-- sales header: any outlet member (incl. Staff) may view & create for their outlet.
create policy sales_select on public.sales
  for select to authenticated
  using (organization_id = public.auth_org_id() and public.is_member_of_outlet(outlet_id));
create policy sales_insert on public.sales
  for insert to authenticated
  with check (organization_id = public.auth_org_id() and public.is_member_of_outlet(outlet_id));
-- edits/voids: manager+ only.
create policy sales_update on public.sales
  for update to authenticated
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

-- sale_items: manager+ only (cost/profit). Staff create sales via the M8 RPC
-- (SECURITY DEFINER, bypasses RLS) and view invoices via get_public_invoice().
create policy sale_items_access on public.sale_items
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

-- payments: customer_in = any outlet member; supplier_out = manager+.
create policy payments_select on public.payments
  for select to authenticated
  using (
    organization_id = public.auth_org_id()
    and (
      public.is_org_admin()
      or (direction = 'customer_in' and public.is_member_of_outlet(outlet_id))
    )
  );
create policy payments_insert on public.payments
  for insert to authenticated
  with check (
    organization_id = public.auth_org_id()
    and (
      (direction = 'customer_in' and public.is_member_of_outlet(outlet_id))
      or (direction = 'supplier_out' and public.auth_role() in ('owner', 'admin', 'outlet_manager'))
    )
  );

-- returns / return_items: manager+ (they affect refunds & profit).
create policy returns_access on public.returns
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
create policy return_items_access on public.return_items
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
-- Public invoice (secure token). SECURITY DEFINER: header + customer name +
-- line items WITHOUT cost/profit + nursery name. No auth required.
-- =============================================================================
create or replace function public.get_public_invoice(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'nursery_name', o.name,
    'invoice_no', s.invoice_no,
    'sale_date', s.sale_date,
    'invoice_language', s.invoice_language,
    'customer_name', c.name,
    'items_subtotal', s.items_subtotal,
    'discount_total', s.discount_total,
    'tax_total', s.tax_total,
    'total', s.total,
    'amount_paid', s.amount_paid,
    'outstanding', s.outstanding,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'plant', si.plant_name_snapshot,
          'size', si.size_label_snapshot,
          'quantity', si.quantity,
          'unit_price', si.unit_price,
          'discount', si.discount,
          'line_total', si.line_total
        ) order by si.created_at
      )
      from public.sale_items si
      where si.sale_id = s.id
    ), '[]'::jsonb)
  )
  from public.sales s
  join public.organizations o on o.id = s.organization_id
  left join public.customers c on c.id = s.customer_id
  where s.invoice_token = p_token and s.status <> 'voided'
$$;

grant execute on function public.get_public_invoice(text) to anon, authenticated;
