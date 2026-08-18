-- =============================================================================
-- Plantory — Migration 0003: RLS helpers & identity policies
-- RLS is the real security boundary (CLAUDE.md §0.3, §3). These SECURITY DEFINER
-- helpers read the caller's profile/outlets while BYPASSING RLS, which prevents
-- infinite policy recursion (a policy on profiles that needs to read profiles).
-- Every helper is STABLE and schema-qualified (search_path = '').
-- =============================================================================

-- The caller's organization_id (null if no active profile → all policies fail closed).
create or replace function public.auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from public.profiles
  where id = (select auth.uid()) and active
$$;

-- The caller's role (null if inactive/unknown).
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid()) and active
$$;

-- Owner or Admin => org-wide operational access.
create or replace function public.is_org_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.auth_role() in ('owner', 'admin')
$$;

-- Owner => the most sensitive financial/permission actions.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.auth_role() = 'owner'
$$;

-- Can the caller act within a given outlet?
--   Owner/Admin: any outlet in their org.
--   Others: only outlets they are explicitly assigned to.
create or replace function public.is_member_of_outlet(target_outlet uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when public.is_org_admin() then
      exists (
        select 1 from public.outlets o
        where o.id = target_outlet and o.organization_id = public.auth_org_id()
      )
    else
      exists (
        select 1 from public.user_outlets uo
        where uo.outlet_id = target_outlet and uo.user_id = (select auth.uid())
      )
  end
$$;

grant execute on function
  public.auth_org_id(),
  public.auth_role(),
  public.is_org_admin(),
  public.is_owner(),
  public.is_member_of_outlet(uuid)
to authenticated;

-- =============================================================================
-- Enable RLS + policies. Note: the postgres owner and the service_role key both
-- bypass RLS; these policies constrain the `authenticated` (and `anon`) roles.
-- Tables have RLS enabled with NO permissive default, so anything without an
-- explicit policy is denied (fail closed).
-- =============================================================================

-- organizations -----------------------------------------------------------------
alter table public.organizations enable row level security;

create policy organizations_select on public.organizations
  for select to authenticated
  using (id = public.auth_org_id());

create policy organizations_update on public.organizations
  for update to authenticated
  using (id = public.auth_org_id() and public.is_owner())
  with check (id = public.auth_org_id() and public.is_owner());

-- (insert/delete: none for app users — created by seed/service role only)

-- outlets -----------------------------------------------------------------------
alter table public.outlets enable row level security;

create policy outlets_select on public.outlets
  for select to authenticated
  using (organization_id = public.auth_org_id());

create policy outlets_insert on public.outlets
  for insert to authenticated
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

create policy outlets_update on public.outlets
  for update to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

create policy outlets_delete on public.outlets
  for delete to authenticated
  using (organization_id = public.auth_org_id() and public.is_owner());

-- profiles ----------------------------------------------------------------------
-- Readable by everyone in the org (needed to show staff names, e.g. "sold by").
-- Writes are Owner/Admin only (provisioning). Self-service of preferred_language
-- will go through a dedicated RPC in M2 to avoid role-escalation via direct writes.
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (organization_id = public.auth_org_id());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

create policy profiles_update on public.profiles
  for update to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

-- (delete: none — users are deactivated via active flag, never hard-deleted)

-- user_outlets ------------------------------------------------------------------
alter table public.user_outlets enable row level security;

create policy user_outlets_select on public.user_outlets
  for select to authenticated
  using (organization_id = public.auth_org_id());

create policy user_outlets_insert on public.user_outlets
  for insert to authenticated
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

create policy user_outlets_update on public.user_outlets
  for update to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

create policy user_outlets_delete on public.user_outlets
  for delete to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin());

-- org_settings ------------------------------------------------------------------
alter table public.org_settings enable row level security;

create policy org_settings_select on public.org_settings
  for select to authenticated
  using (organization_id = public.auth_org_id());

create policy org_settings_insert on public.org_settings
  for insert to authenticated
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

create policy org_settings_update on public.org_settings
  for update to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin())
  with check (organization_id = public.auth_org_id() and public.is_org_admin());

-- audit_logs --------------------------------------------------------------------
-- Append-only: authenticated users can insert within their org; only Owner/Admin
-- can read. No update/delete policies => those are denied for all app users.
alter table public.audit_logs enable row level security;

create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (organization_id = public.auth_org_id() and public.is_org_admin());

create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (organization_id = public.auth_org_id());
