-- Built at Albert — row level security
-- Nothing is readable by an anonymous or unverified caller. The anon key is
-- public by design, so these policies are the actual access control.

alter table public.profiles        enable row level security;
alter table public.admin_bootstrap enable row level security;
alter table public.ideas           enable row level security;
alter table public.votes           enable row level security;
alter table public.claims          enable row level security;
alter table public.projects        enable row level security;

-- Supabase grants broad table privileges to anon/authenticated by default.
-- Start from zero and hand back only what the app needs.
revoke all on public.profiles, public.admin_bootstrap, public.ideas,
              public.votes, public.claims, public.projects
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- Column privileges keep email out of reach and make `role` unwritable from a
-- client session; promotion only happens through set_user_role().
grant select (id, full_name, promo, campus, role, locale, created_at)
  on public.profiles to authenticated;
grant update (full_name, promo, campus, locale)
  on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.is_verified());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- admin_bootstrap stays invisible: only the definer trigger reads it.

-- ---------------------------------------------------------------------------
-- ideas
-- ---------------------------------------------------------------------------

grant select on public.ideas to authenticated;
grant insert (title, problem, description, language, tags, campus) on public.ideas to authenticated;
grant delete on public.ideas to authenticated;

-- Submission is always pending, whatever the client sends.
create or replace function public.force_idea_defaults()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.author_id       := auth.uid();
  new.status          := 'pending';
  new.vote_count      := 0;
  new.published_at    := null;
  new.rejected_reason := null;
  return new;
end;
$$;

drop trigger if exists ideas_force_defaults on public.ideas;
create trigger ideas_force_defaults
  before insert on public.ideas
  for each row execute function public.force_idea_defaults();

drop policy if exists ideas_select on public.ideas;
create policy ideas_select on public.ideas
  for select to authenticated
  using (
    public.is_verified()
    and (
      status in ('open', 'claimed', 'delivered')
      or author_id = auth.uid()
      or public.is_admin()
    )
  );

drop policy if exists ideas_insert_own on public.ideas;
create policy ideas_insert_own on public.ideas
  for insert to authenticated
  with check (public.is_verified() and author_id = auth.uid());

-- An author can withdraw an idea only while it is still waiting for review.
drop policy if exists ideas_delete_own_pending on public.ideas;
create policy ideas_delete_own_pending on public.ideas
  for delete to authenticated
  using (public.is_admin() or (author_id = auth.uid() and status = 'pending'));

-- ---------------------------------------------------------------------------
-- votes
-- ---------------------------------------------------------------------------

grant select, insert, delete on public.votes to authenticated;

drop policy if exists votes_select_own on public.votes;
create policy votes_select_own on public.votes
  for select to authenticated
  using (public.is_verified() and user_id = auth.uid());

drop policy if exists votes_insert_own on public.votes;
create policy votes_insert_own on public.votes
  for insert to authenticated
  with check (
    public.is_verified()
    and user_id = auth.uid()
    and exists (
      select 1 from public.ideas i
      where i.id = idea_id
        and i.status in ('open', 'claimed', 'delivered')
        and i.author_id <> auth.uid()
    )
  );

drop policy if exists votes_delete_own on public.votes;
create policy votes_delete_own on public.votes
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------

-- Read only. Every write goes through claim_idea / release_claim /
-- extend_claim / submit_project, which re-check the caller.
grant select on public.claims to authenticated;

drop policy if exists claims_select on public.claims;
create policy claims_select on public.claims
  for select to authenticated
  using (public.is_verified());

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

grant select on public.projects to authenticated;
grant update (url, repo_url, description, screenshots) on public.projects to authenticated;

drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select to authenticated
  using (
    public.is_verified()
    and (is_public or author_id = auth.uid() or public.is_admin())
  );

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own on public.projects
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- ---------------------------------------------------------------------------
-- function privileges
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from anon;

grant execute on function public.is_verified() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_idea(uuid) to authenticated;
grant execute on function public.release_claim(uuid) to authenticated;
grant execute on function public.extend_claim(uuid, integer) to authenticated;
grant execute on function public.submit_project(uuid, text, text, text[], text) to authenticated;
grant execute on function public.moderate_idea(uuid, boolean, text) to authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.set_project_visibility(uuid, boolean) to authenticated;
