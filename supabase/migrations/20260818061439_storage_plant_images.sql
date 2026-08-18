-- =============================================================================
-- Plantory — Migration 0013: plant image storage
-- A public-read bucket for plant photos (used by the public QR page). Writes are
-- Owner/Admin only, and each org can only write inside its own folder:
--   path = <organization_id>/<plant_id>/<uuid>.<ext>
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('plant-images', 'plant-images', true)
on conflict (id) do nothing;

-- Public read (bucket is public; explicit policy keeps the API list consistent).
create policy "plant_images_public_read"
  on storage.objects for select
  using (bucket_id = 'plant-images');

-- Owner/Admin may write, only within their own org's top-level folder.
create policy "plant_images_admin_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'plant-images'
    and public.is_org_admin()
    and (storage.foldername(name))[1] = public.auth_org_id()::text
  );

create policy "plant_images_admin_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'plant-images'
    and public.is_org_admin()
    and (storage.foldername(name))[1] = public.auth_org_id()::text
  )
  with check (
    bucket_id = 'plant-images'
    and public.is_org_admin()
    and (storage.foldername(name))[1] = public.auth_org_id()::text
  );

create policy "plant_images_admin_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'plant-images'
    and public.is_org_admin()
    and (storage.foldername(name))[1] = public.auth_org_id()::text
  );
