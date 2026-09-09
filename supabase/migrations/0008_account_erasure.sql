-- Built at Albert — make an account erasable without destroying the board
--
-- Everything cascaded from profiles, so deleting one account also deleted its
-- ideas, and with them the votes other students had cast and any tool that had
-- been delivered against them. Erasure is a right; taking the community's
-- contributions down with it is not required and is bad for the platform.
--
-- Contributions therefore survive their author, detached. Personal data goes:
-- the auth row, the name, the promo, the campus, and the person's own votes.

alter table public.ideas drop constraint if exists ideas_author_id_fkey;
alter table public.ideas alter column author_id drop not null;
alter table public.ideas
  add constraint ideas_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

alter table public.projects drop constraint if exists projects_author_id_fkey;
alter table public.projects alter column author_id drop not null;
alter table public.projects
  add constraint projects_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

-- Frees whatever the departing account was holding, so an idea it had reserved
-- goes back on the board instead of staying locked to nobody. Runs as the
-- service role from the erasure endpoint; there is no session to check.
create or replace function public.release_claims_for_user(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  freed integer;
begin
  with released as (
    update public.claims c
    set status = 'released', ended_at = now()
    where c.user_id = p_user_id and c.status = 'active'
    returning c.idea_id
  )
  update public.ideas i
  set status = 'open'
  from released r
  where i.id = r.idea_id and i.status = 'claimed';

  get diagnostics freed = row_count;
  return freed;
end;
$$;

revoke execute on function public.release_claims_for_user(uuid) from public, anon, authenticated;
