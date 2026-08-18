-- =============================================================================
-- Plantory — Migration 0015: finalize_purchase() transactional RPC
-- Atomically turns a DRAFT purchase into finalized inventory:
--   1. allocate purchase expenses into landed cost (proportional to value,
--      quantity fallback, remainder on the largest line — mirrors lib/domain
--      allocateLandedCost)
--   2. create one inventory_batch per item (qty + landed_unit_cost)
--   3. write a 'purchase' stock_movement per batch
--   4. set purchase totals + status = finalized
--   5. write an audit_logs row
-- SECURITY DEFINER so it can write cost tables atomically; it re-checks the
-- caller's org + role itself (Owner/Admin, or Manager of the purchase outlet).
-- =============================================================================

create or replace function public.finalize_purchase(p_purchase_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_outlet uuid;
  v_status public.purchase_status;
  v_total_value numeric(12,2);
  v_total_qty bigint;
  v_total_expenses numeric(12,2);
  v_use_value boolean;
  v_alloc_sum numeric(12,2);
  v_remainder numeric(12,2);
  v_max_item uuid;
  v_landed_total numeric(12,2);
  v_actor uuid := (select auth.uid());
begin
  select organization_id, outlet_id, status
    into v_org, v_outlet, v_status
  from public.purchases
  where id = p_purchase_id;

  if v_org is null then
    raise exception 'Purchase not found';
  end if;

  if v_org <> public.auth_org_id()
     or not (
       public.is_org_admin()
       or (public.auth_role() = 'outlet_manager' and public.is_member_of_outlet(v_outlet))
     ) then
    raise exception 'Not authorized to finalize this purchase';
  end if;

  if v_status <> 'draft' then
    raise exception 'Purchase is not a draft';
  end if;

  select coalesce(sum(quantity * unit_cost), 0), coalesce(sum(quantity), 0)
    into v_total_value, v_total_qty
  from public.purchase_items
  where purchase_id = p_purchase_id;

  if v_total_qty = 0 then
    raise exception 'Purchase has no items';
  end if;

  select coalesce(sum(amount), 0)
    into v_total_expenses
  from public.purchase_expenses
  where purchase_id = p_purchase_id;

  v_use_value := v_total_value > 0;

  -- initial allocation (rounded to paise)
  update public.purchase_items pi
  set line_amount = round(pi.quantity * pi.unit_cost, 2),
      allocated_expense = case
        when v_total_expenses = 0 then 0
        when v_use_value then round(v_total_expenses * (pi.quantity * pi.unit_cost) / v_total_value, 2)
        else round(v_total_expenses * pi.quantity / v_total_qty, 2)
      end
  where pi.purchase_id = p_purchase_id;

  -- push rounding remainder onto the largest line
  select coalesce(sum(allocated_expense), 0)
    into v_alloc_sum
  from public.purchase_items
  where purchase_id = p_purchase_id;

  v_remainder := round(v_total_expenses - v_alloc_sum, 2);
  if v_remainder <> 0 then
    select id into v_max_item
    from public.purchase_items
    where purchase_id = p_purchase_id
    order by (case when v_use_value then quantity * unit_cost else quantity end) desc, id
    limit 1;

    update public.purchase_items
    set allocated_expense = round(allocated_expense + v_remainder, 2)
    where id = v_max_item;
  end if;

  -- per-item landed values
  update public.purchase_items
  set landed_line_total = round(line_amount + allocated_expense, 2),
      landed_unit_cost = round((line_amount + allocated_expense) / quantity, 2)
  where purchase_id = p_purchase_id;

  -- create inventory batches
  insert into public.inventory_batches (
    organization_id, outlet_id, plant_id, size_id, purchase_item_id,
    landed_unit_cost, qty_received, qty_remaining, created_by
  )
  select v_org, v_outlet, pi.plant_id, pi.size_id, pi.id,
         pi.landed_unit_cost, pi.quantity, pi.quantity, v_actor
  from public.purchase_items pi
  where pi.purchase_id = p_purchase_id;

  -- write purchase stock movements
  insert into public.stock_movements (
    organization_id, outlet_id, plant_id, size_id, batch_id,
    movement_type, quantity, unit_cost, reference_type, reference_id, created_by
  )
  select v_org, v_outlet, b.plant_id, b.size_id, b.id,
         'purchase', b.qty_received, b.landed_unit_cost, 'purchase', p_purchase_id, v_actor
  from public.inventory_batches b
  where b.purchase_item_id in (
    select id from public.purchase_items where purchase_id = p_purchase_id
  );

  select coalesce(sum(landed_line_total), 0)
    into v_landed_total
  from public.purchase_items
  where purchase_id = p_purchase_id;

  update public.purchases
  set status = 'finalized',
      items_subtotal = v_total_value,
      expenses_total = v_total_expenses,
      landed_total = v_landed_total,
      updated_at = now()
  where id = p_purchase_id;

  insert into public.audit_logs (
    organization_id, outlet_id, actor_id, action, entity, entity_id, new_value
  )
  values (
    v_org, v_outlet, v_actor, 'purchase_finalize', 'purchases', p_purchase_id,
    jsonb_build_object(
      'items_subtotal', v_total_value,
      'expenses_total', v_total_expenses,
      'landed_total', v_landed_total
    )
  );
end;
$$;

grant execute on function public.finalize_purchase(uuid) to authenticated;
