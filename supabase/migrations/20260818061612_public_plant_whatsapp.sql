-- =============================================================================
-- Plantory — Migration 0014: add nursery WhatsApp number to get_public_plant
-- The public QR page needs the org's WhatsApp number to build the "Enquire on
-- WhatsApp" deep link. Still info-only — no price, no stock.
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
    'nursery_whatsapp', o.whatsapp_number,
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
