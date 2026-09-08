-- Built at Albert — let trusted SQL author an idea
--
-- force_idea_defaults() overwrote author_id with auth.uid() unconditionally.
-- That is right for a client insert, but it also silenced any insert made
-- outside a session — a migration, a seed, a service-role repair — by setting
-- the column to null and tripping the not-null constraint.
--
-- Falling back to the supplied author_id when there is no session is safe: the
-- RLS insert policy still demands is_verified() and author_id = auth.uid(),
-- and both fail without one, so no client can reach this branch.

create or replace function public.force_idea_defaults()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.author_id       := coalesce(auth.uid(), new.author_id);
  new.vote_count      := coalesce(new.vote_count, 0);
  new.rejected_reason := case when new.status = 'rejected' then new.rejected_reason else null end;

  -- A signed-in student never gets to choose the status or the publication
  -- date; only trusted SQL, which has no session, may set them.
  if auth.uid() is not null then
    new.status       := 'pending';
    new.vote_count   := 0;
    new.published_at := null;
  end if;

  return new;
end;
$$;
