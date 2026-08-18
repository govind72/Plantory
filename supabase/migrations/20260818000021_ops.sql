-- =============================================================================
-- Plantory — Migration 0010: ops
-- expenses (operating), day_closes (cash reconciliation), whatsapp_messages.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- expenses — operating expenses (purchase-related expenses live on the purchase).
-- outlet_id null => org-level expense (Admin/Owner only).
-- -----------------------------------------------------------------------------
create table public.expenses (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete restrict,
  outlet_id        uuid references public.outlets (id) on delete set null,
  category         public.expense_category not null,
  amount           numeric(12,2) not null check (amount > 0),
  spent_at         date not null default current_date,
  note             text,
  receipt_path     text,          -- Supabase Storage path (optional photo)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references public.profiles (id)
);
create index expenses_org_date_idx on public.expenses (organization_id, spent_at desc);
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- day_closes — one per outlet per business date. Expected vs counted cash.
-- -----------------------------------------------------------------------------
create table public.day_closes (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete restrict,
  outlet_id          uuid not null references public.outlets (id) on delete restrict,
  business_date      date not null,
  status             public.day_close_status not null default 'open',
  expected_cash      numeric(12,2) not null default 0,
  counted_cash       numeric(12,2),
  variance           numeric(12,2),
  expected_by_method jsonb,        -- {"cash": ..., "upi": ..., ...}
  note               text,
  opened_by          uuid references public.profiles (id),
  finalized_by       uuid references public.profiles (id),
  finalized_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references public.profiles (id),
  unique (outlet_id, business_date)
);
create index day_closes_org_date_idx on public.day_closes (organization_id, business_date desc);
create trigger day_closes_set_updated_at
  before update on public.day_closes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- whatsapp_messages — history for V1 deep-links; ready for future Cloud API.
-- -----------------------------------------------------------------------------
create table public.whatsapp_messages (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete restrict,
  customer_id          uuid references public.customers (id) on delete set null,
  sale_id              uuid references public.sales (id) on delete set null,
  message_type         public.whatsapp_message_type not null,
  recipient            text,
  status               public.whatsapp_message_status not null default 'deep_link_opened',
  provider_message_id  text,
  sent_at              timestamptz,
  error_message        text,
  created_at           timestamptz not null default now(),
  created_by           uuid references public.profiles (id)
);
create index whatsapp_messages_org_idx on public.whatsapp_messages (organization_id);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.expenses enable row level security;
alter table public.day_closes enable row level security;
alter table public.whatsapp_messages enable row level security;

-- expenses: Admin/Owner for org-level; Outlet-Manager for their outlet.
create policy expenses_access on public.expenses
  for all to authenticated
  using (
    organization_id = public.auth_org_id()
    and (
      public.is_org_admin()
      or (public.auth_role() = 'outlet_manager' and public.is_member_of_outlet(outlet_id))
    )
  )
  with check (
    organization_id = public.auth_org_id()
    and (
      public.is_org_admin()
      or (public.auth_role() = 'outlet_manager' and public.is_member_of_outlet(outlet_id))
    )
  );

-- day_closes: any outlet member (Staff record their shift; finalize gated in app/RPC).
create policy day_closes_access on public.day_closes
  for all to authenticated
  using (organization_id = public.auth_org_id() and public.is_member_of_outlet(outlet_id))
  with check (organization_id = public.auth_org_id() and public.is_member_of_outlet(outlet_id));

-- whatsapp_messages: any org member may log/view (relate to their sales/customers).
create policy whatsapp_messages_select on public.whatsapp_messages
  for select to authenticated
  using (organization_id = public.auth_org_id());
create policy whatsapp_messages_insert on public.whatsapp_messages
  for insert to authenticated
  with check (organization_id = public.auth_org_id());
