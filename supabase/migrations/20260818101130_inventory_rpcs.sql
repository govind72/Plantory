-- =============================================================================
-- Plantory — Migration 0016: inventory RPCs (record_loss, transfer_stock)
-- Both FIFO-consume source batches with FOR UPDATE row locks (so concurrent
-- consumers can never drive stock negative) and write a stock_movement per
-- batch touched. transfer_stock preserves each consumed batch's landed cost
-- into a new destination batch. SECURITY DEFINER; each re-checks the caller.
-- Mirrors lib/domain/fifo.ts (consumeFifo).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- record_loss: mortality / damage etc. FIFO-consume and reduce stock.
-- ---------------------------------------------------------------------------
create or replace function public.record_loss(
  p_outlet uuid,
  p_plant uuid,
  p_size uuid,
  p_qty integer,
  p_reason public.loss_reason,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := public.auth_org_id();
  v_actor uuid := (select auth.uid());
  v_available integer;
  v_remaining integer := p_qty;
  v_loss_id uuid;
  v_move_type public.stock_movement_type;
  v_take integer;
  b record;
begin
  if p_qty is null or p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  if v_org is null
     or not (
       public.is_org_admin()
       or (public.auth_role() = 'outlet_manager' and public.is_member_of_outlet(p_outlet))
     ) then
    raise exception 'Not authorized';
  end if;

  if not exists (
    select 1 from public.outlets where id = p_outlet and organization_id = v_org
  ) then
    raise exception 'Invalid outlet';
  end if;

  select coalesce(sum(qty_remaining), 0) into v_available
  from public.inventory_batches
  where outlet_id = p_outlet and plant_id = p_plant and size_id = p_size
    and organization_id = v_org and active;

  if v_available < p_qty then
    raise exception 'Insufficient stock: % available, % requested', v_available, p_qty;
  end if;

  v_move_type := case
    when p_reason in ('damage', 'transport_damage') then 'damage'
    else 'mortality'
  end;

  insert into public.plant_losses (
    organization_id, outlet_id, plant_id, size_id, quantity, reason, note, created_by
  )
  values (v_org, p_outlet, p_plant, p_size, p_qty, p_reason, p_note, v_actor)
  returning id into v_loss_id;

  for b in
    select id, qty_remaining, landed_unit_cost
    from public.inventory_batches
    where outlet_id = p_outlet and plant_id = p_plant and size_id = p_size
      and organization_id = v_org and active and qty_remaining > 0
    order by received_at asc, id asc
    for update
  loop
    exit when v_remaining <= 0;
    v_take := least(v_remaining, b.qty_remaining);

    update public.inventory_batches
    set qty_remaining = qty_remaining - v_take
    where id = b.id;

    insert into public.stock_movements (
      organization_id, outlet_id, plant_id, size_id, batch_id,
      movement_type, quantity, unit_cost, reference_type, reference_id, note, created_by
    )
    values (
      v_org, p_outlet, p_plant, p_size, b.id,
      v_move_type, v_take, b.landed_unit_cost, 'loss', v_loss_id, p_note, v_actor
    );

    v_remaining := v_remaining - v_take;
  end loop;

  if v_remaining > 0 then
    raise exception 'Insufficient stock (concurrent change)';
  end if;

  insert into public.audit_logs (
    organization_id, outlet_id, actor_id, action, entity, entity_id, new_value
  )
  values (
    v_org, p_outlet, v_actor, 'record_loss', 'plant_losses', v_loss_id,
    jsonb_build_object('quantity', p_qty, 'reason', p_reason)
  );

  return v_loss_id;
end;
$$;

grant execute on function
  public.record_loss(uuid, uuid, uuid, integer, public.loss_reason, text)
to authenticated;

-- ---------------------------------------------------------------------------
-- transfer_stock: move items between outlets, preserving batch cost.
-- p_items = [{ "plant_id": uuid, "size_id": uuid, "quantity": int }, ...]
-- ---------------------------------------------------------------------------
create or replace function public.transfer_stock(
  p_from_outlet uuid,
  p_to_outlet uuid,
  p_items jsonb,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid := public.auth_org_id();
  v_actor uuid := (select auth.uid());
  v_transfer_id uuid;
  it jsonb;
  v_plant uuid;
  v_size uuid;
  v_qty integer;
  v_available integer;
  v_remaining integer;
  v_take integer;
  v_new_batch uuid;
  b record;
begin
  if v_org is null then
    raise exception 'Not authorized';
  end if;
  if p_from_outlet = p_to_outlet then
    raise exception 'Source and destination outlets must differ';
  end if;

  if not (
    public.is_org_admin()
    or (
      public.auth_role() = 'outlet_manager'
      and public.is_member_of_outlet(p_from_outlet)
      and public.is_member_of_outlet(p_to_outlet)
    )
  ) then
    raise exception 'Not authorized';
  end if;

  if (
    select count(*) from public.outlets
    where id in (p_from_outlet, p_to_outlet) and organization_id = v_org
  ) <> 2 then
    raise exception 'Invalid outlets';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'No items to transfer';
  end if;

  insert into public.stock_transfers (
    organization_id, from_outlet_id, to_outlet_id, status, note, created_by
  )
  values (v_org, p_from_outlet, p_to_outlet, 'completed', p_note, v_actor)
  returning id into v_transfer_id;

  for it in select * from jsonb_array_elements(p_items)
  loop
    v_plant := (it->>'plant_id')::uuid;
    v_size := (it->>'size_id')::uuid;
    v_qty := (it->>'quantity')::integer;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantity must be positive';
    end if;

    select coalesce(sum(qty_remaining), 0) into v_available
    from public.inventory_batches
    where outlet_id = p_from_outlet and plant_id = v_plant and size_id = v_size
      and organization_id = v_org and active;

    if v_available < v_qty then
      raise exception 'Insufficient stock for transfer: % available, % requested', v_available, v_qty;
    end if;

    insert into public.stock_transfer_items (
      organization_id, transfer_id, plant_id, size_id, quantity
    )
    values (v_org, v_transfer_id, v_plant, v_size, v_qty);

    v_remaining := v_qty;
    for b in
      select id, qty_remaining, landed_unit_cost
      from public.inventory_batches
      where outlet_id = p_from_outlet and plant_id = v_plant and size_id = v_size
        and organization_id = v_org and active and qty_remaining > 0
      order by received_at asc, id asc
      for update
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining, b.qty_remaining);

      update public.inventory_batches
      set qty_remaining = qty_remaining - v_take
      where id = b.id;

      insert into public.stock_movements (
        organization_id, outlet_id, plant_id, size_id, batch_id,
        movement_type, quantity, unit_cost, reference_type, reference_id, created_by
      )
      values (
        v_org, p_from_outlet, v_plant, v_size, b.id,
        'transfer_out', v_take, b.landed_unit_cost, 'transfer', v_transfer_id, v_actor
      );

      insert into public.inventory_batches (
        organization_id, outlet_id, plant_id, size_id, source_batch_id,
        landed_unit_cost, qty_received, qty_remaining, created_by
      )
      values (
        v_org, p_to_outlet, v_plant, v_size, b.id,
        b.landed_unit_cost, v_take, v_take, v_actor
      )
      returning id into v_new_batch;

      insert into public.stock_movements (
        organization_id, outlet_id, plant_id, size_id, batch_id,
        movement_type, quantity, unit_cost, reference_type, reference_id, created_by
      )
      values (
        v_org, p_to_outlet, v_plant, v_size, v_new_batch,
        'transfer_in', v_take, b.landed_unit_cost, 'transfer', v_transfer_id, v_actor
      );

      v_remaining := v_remaining - v_take;
    end loop;

    if v_remaining > 0 then
      raise exception 'Insufficient stock (concurrent change)';
    end if;
  end loop;

  insert into public.audit_logs (
    organization_id, outlet_id, actor_id, action, entity, entity_id, new_value
  )
  values (
    v_org, p_from_outlet, v_actor, 'stock_transfer', 'stock_transfers', v_transfer_id,
    jsonb_build_object('to_outlet', p_to_outlet, 'items', p_items)
  );

  return v_transfer_id;
end;
$$;

grant execute on function
  public.transfer_stock(uuid, uuid, jsonb, text)
to authenticated;
