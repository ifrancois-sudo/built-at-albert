-- Built at Albert — tell an author when their idea gains traction
--
-- Nothing brought anyone back between two weekly digests. The one moment worth
-- interrupting someone for is their own idea crossing a threshold: it is the
-- signal that the school actually wants the thing they described.
--
-- Thresholds rather than one email per vote, because per-vote mail would be
-- noise and would leak who voted and when.

alter table public.ideas
  add column if not exists notified_votes integer not null default 0;

-- Mutates and returns in a single statement, like the other scheduled
-- functions, so a repeated or concurrent run finds nothing left to announce.
create or replace function public.vote_milestones_due()
returns table (idea_id uuid, idea_title text, author_id uuid, milestone integer)
language sql
security definer
set search_path = public, pg_temp
as $$
  with due as (
    select
      i.id,
      (
        select max(m)
        from unnest(array[10, 25, 50, 100]) as m
        where i.vote_count >= m
      ) as milestone
    from public.ideas i
    where i.author_id is not null
      and i.status in ('open', 'claimed', 'delivered')
  ),
  bumped as (
    update public.ideas i
    set notified_votes = d.milestone
    from due d
    where i.id = d.id
      and d.milestone is not null
      and d.milestone > i.notified_votes
    returning i.id, i.title, i.author_id, d.milestone
  )
  select id, title, author_id, milestone from bumped;
$$;

revoke execute on function public.vote_milestones_due() from public, anon, authenticated;
