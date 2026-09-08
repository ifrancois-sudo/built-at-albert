-- Built at Albert — function privileges
-- Postgres grants EXECUTE on a new function to PUBLIC, and PUBLIC includes
-- every logged-in student. Revoking from `anon` and `authenticated` by name
-- therefore changes nothing: the grant that matters is the one on PUBLIC.
-- Start from nothing and hand back each function on purpose.
--
-- Trigger functions are unaffected: Postgres checks EXECUTE when a trigger is
-- created, not each time it fires.

revoke execute on all functions in schema public from public, anon, authenticated;

-- Used inside RLS policies, so the querying role must be able to call them.
grant execute on function public.is_verified() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Student-facing operations. Each one re-checks the caller internally.
grant execute on function public.claim_idea(uuid) to authenticated;
grant execute on function public.release_claim(uuid) to authenticated;
grant execute on function public.extend_claim(uuid, integer) to authenticated;
grant execute on function public.submit_project(uuid, text, text, text[], text) to authenticated;

-- Admin operations. They raise 'not_admin' for anyone else, but the grant is
-- still limited to signed-in accounts.
grant execute on function public.moderate_idea(uuid, boolean, text) to authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.set_project_visibility(uuid, boolean) to authenticated;

-- Cron only. No student session can reach these at all.
grant execute on function public.expire_due_claims() to service_role;
grant execute on function public.claim_reminders_due() to service_role;
