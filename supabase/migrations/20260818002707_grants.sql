-- =============================================================================
-- Plantory — Migration 0011: role grants
-- Our tables are owned by `postgres`, whose default privileges grant the API
-- roles only TRUNCATE/REFERENCES/TRIGGER — NOT select/insert/update/delete.
-- GRANT is a separate gate from RLS: both must pass. So we grant table-level
-- DML to `authenticated` (RLS still constrains which rows) and full access to
-- `service_role` (the trusted, RLS-bypassing role used by the admin client).
--
-- `anon` intentionally gets NO table privileges — public access happens only
-- through SECURITY DEFINER RPCs (get_public_plant / get_public_invoice).
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- service_role: full access to everything in public.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- authenticated: DML on tables (RLS enforces row visibility) + sequence usage.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

-- Apply the same to objects created by later migrations (run as postgres).
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage on sequences to authenticated;
