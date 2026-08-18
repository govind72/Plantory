-- =============================================================================
-- Plantory — local seed (runs on `npm run db:reset`, local dev only).
-- Idempotent. Uses fixed UUIDs so re-seeding is stable and referenceable.
-- The Owner *auth* user is created in M2 via the Supabase Admin API (a password
-- hash can't be seeded reliably in SQL), so no profiles row is seeded here yet.
-- =============================================================================

insert into public.organizations (id, name, default_language, currency, gst_enabled)
values ('11111111-1111-4111-8111-111111111111', 'Shangrila Greens', 'en', 'INR', false)
on conflict (id) do update set name = excluded.name;

insert into public.outlets (id, organization_id, name, active)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Main Nursery',
  true
)
on conflict (id) do nothing;

insert into public.org_settings (organization_id)
values ('11111111-1111-4111-8111-111111111111')
on conflict (organization_id) do nothing;
