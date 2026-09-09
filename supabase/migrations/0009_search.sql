-- Built at Albert — full text search and duplicate detection
--
-- Twenty-four ideas fit on one screen. Two hundred do not, and the first thing
-- that happens at that size is two students posting the same idea a week apart
-- and nobody noticing. Both problems are the same problem: nothing here could
-- match text against text.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() is only STABLE, because it resolves its dictionary through a
-- catalog lookup. Pinning the dictionary makes the result depend on the input
-- alone, which is what a generated column and an index both require.
create or replace function public.immutable_unaccent(p_text text)
returns text
language sql
immutable
strict
parallel safe
set search_path = extensions, public, pg_temp
as $$
  select extensions.unaccent('extensions.unaccent', p_text)
$$;

-- Accents are the whole reason for the wrapper: a student searching "cafeteria"
-- has to find "cafétéria", and half of them type without accents on a laptop.
alter table public.ideas
  add column if not exists search_doc tsvector
  generated always as (
    to_tsvector(
      'french',
      public.immutable_unaccent(
        coalesce(title, '') || ' ' || coalesce(problem, '') || ' ' || coalesce(description, '')
      )
    )
  ) stored;

create index if not exists ideas_search_idx on public.ideas using gin (search_doc);

create index if not exists ideas_title_trgm_idx
  on public.ideas using gin (public.immutable_unaccent(title) extensions.gin_trgm_ops);

-- security invoker on purpose: row level security still decides what the caller
-- is allowed to see, so search can never become a way around it.
create or replace function public.search_ideas(p_query text)
returns setof public.ideas
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  select i.*
  from public.ideas i
  where i.status in ('open', 'claimed', 'delivered')
    and (
      i.search_doc @@ websearch_to_tsquery('french', public.immutable_unaccent(p_query))
      or public.immutable_unaccent(i.title) % public.immutable_unaccent(p_query)
    )
  order by
    ts_rank(i.search_doc, websearch_to_tsquery('french', public.immutable_unaccent(p_query))) desc,
    i.vote_count desc,
    i.created_at desc
  limit 50;
$$;

-- Shown while someone types a new title. Trigram similarity rather than full
-- text, because the point is to catch a rewording, not a keyword.
create or replace function public.similar_ideas(p_title text)
returns setof public.ideas
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  select i.*
  from public.ideas i
  where i.status in ('open', 'claimed', 'delivered')
    and similarity(public.immutable_unaccent(i.title), public.immutable_unaccent(p_title)) > 0.28
  order by similarity(public.immutable_unaccent(i.title), public.immutable_unaccent(p_title)) desc
  limit 3;
$$;

-- 0006 revoked EXECUTE from PUBLIC on everything, so anything created after it
-- has to be handed back deliberately.
revoke execute on function public.search_ideas(text) from public, anon;
revoke execute on function public.similar_ideas(text) from public, anon;
revoke execute on function public.immutable_unaccent(text) from public, anon;
grant execute on function public.search_ideas(text) to authenticated;
grant execute on function public.similar_ideas(text) to authenticated;
grant execute on function public.immutable_unaccent(text) to authenticated;
