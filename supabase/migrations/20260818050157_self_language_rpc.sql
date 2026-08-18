-- =============================================================================
-- Plantory — Migration 0012: self-service language RPC
-- profiles writes are Owner/Admin-only (anti role-escalation), so a normal user
-- can't UPDATE their own row directly. This SECURITY DEFINER function lets any
-- authenticated user change ONLY their own preferred_language — nothing else.
-- =============================================================================

create or replace function public.set_my_language(p_lang public.app_language)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set preferred_language = p_lang
  where id = (select auth.uid());
$$;

grant execute on function public.set_my_language(public.app_language) to authenticated;
