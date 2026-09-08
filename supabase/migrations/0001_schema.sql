-- Built at Albert — core schema
-- Idea lifecycle: pending -> open -> claimed -> delivered, with rejected/expired branches.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  full_name   text,
  promo       text,
  campus      text,
  role        text not null default 'student' check (role in ('student', 'admin')),
  locale      text not null default 'fr' check (locale in ('fr', 'en')),
  created_at  timestamptz not null default now()
);

-- Bootstrap list for the very first admin(s). The role still lives in
-- profiles.role; this table only decides who starts out as one, so no email is
-- hardcoded in application logic.
create table if not exists public.admin_bootstrap (
  email text primary key
);

insert into public.admin_bootstrap (email) values ('ifrancois@albertschool.com')
  on conflict do nothing;

-- Every auth.users row gets a profile. Runs as definer so it can read the
-- bootstrap table regardless of the caller.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, promo, campus, locale, role)
  values (
    new.id,
    lower(new.email),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'promo', ''),
    nullif(new.raw_user_meta_data ->> 'campus', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'fr'),
    case
      when exists (select 1 from public.admin_bootstrap b where b.email = lower(new.email))
      then 'admin'
      else 'student'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- ideas
-- ---------------------------------------------------------------------------

create table if not exists public.ideas (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles (id) on delete cascade,
  title           text not null check (char_length(btrim(title)) between 3 and 120),
  problem         text not null check (char_length(btrim(problem)) between 10 and 2000),
  description     text not null default '' check (char_length(description) <= 5000),
  language        text not null default 'fr' check (language in ('fr', 'en')),
  tags            text[] not null default '{}',
  status          text not null default 'pending'
                    check (status in ('pending', 'open', 'claimed', 'delivered', 'rejected')),
  rejected_reason text,
  vote_count      integer not null default 0,
  campus          text,
  created_at      timestamptz not null default now(),
  published_at    timestamptz,
  constraint ideas_rejected_needs_reason
    check (status <> 'rejected' or nullif(btrim(coalesce(rejected_reason, '')), '') is not null)
);

create index if not exists ideas_status_votes_idx on public.ideas (status, vote_count desc, created_at desc);
create index if not exists ideas_author_idx on public.ideas (author_id);
create index if not exists ideas_tags_idx on public.ideas using gin (tags);

-- ---------------------------------------------------------------------------
-- votes
-- ---------------------------------------------------------------------------

create table if not exists public.votes (
  idea_id    uuid not null references public.ideas (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create index if not exists votes_user_idx on public.votes (user_id);

-- vote_count is denormalised for sorting; the trigger is the only writer.
create or replace function public.sync_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.ideas set vote_count = vote_count + 1 where id = new.idea_id;
    return new;
  else
    update public.ideas set vote_count = greatest(vote_count - 1, 0) where id = old.idea_id;
    return old;
  end if;
end;
$$;

drop trigger if exists votes_sync_count on public.votes;
create trigger votes_sync_count
  after insert or delete on public.votes
  for each row execute function public.sync_vote_count();

-- Nobody votes for their own idea. Enforced here as well as in the RLS policy,
-- so a service-role call cannot bypass it by accident.
create or replace function public.reject_self_vote()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (select 1 from public.ideas i where i.id = new.idea_id and i.author_id = new.user_id) then
    raise exception 'self_vote_not_allowed' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists votes_reject_self on public.votes;
create trigger votes_reject_self
  before insert on public.votes
  for each row execute function public.reject_self_vote();

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------

create table if not exists public.claims (
  id          uuid primary key default gen_random_uuid(),
  idea_id     uuid not null references public.ideas (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  status      text not null default 'active'
                check (status in ('active', 'delivered', 'expired', 'released')),
  started_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '21 days',
  reminded_at timestamptz,
  ended_at    timestamptz
);

-- The exclusivity rule. Two concurrent reservations on the same idea cannot
-- both commit: the loser gets a unique-violation, never a silent overwrite.
create unique index if not exists claims_one_active_per_idea
  on public.claims (idea_id) where status = 'active';

create index if not exists claims_user_status_idx on public.claims (user_id, status);
create index if not exists claims_active_expiry_idx on public.claims (expires_at) where status = 'active';

-- Quota: at most 2 active reservations per student.
create or replace function public.enforce_claim_quota()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  active_count integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select count(*) into active_count
  from public.claims c
  where c.user_id = new.user_id
    and c.status = 'active'
    and (tg_op = 'INSERT' or c.id <> new.id);

  if active_count >= 2 then
    raise exception 'claim_quota_reached' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists claims_quota on public.claims;
create trigger claims_quota
  before insert or update of status, user_id on public.claims
  for each row execute function public.enforce_claim_quota();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  claim_id     uuid not null unique references public.claims (id) on delete cascade,
  idea_id      uuid not null references public.ideas (id) on delete cascade,
  author_id    uuid not null references public.profiles (id) on delete cascade,
  url          text not null check (url ~* '^https?://.+'),
  repo_url     text check (repo_url is null or repo_url ~* '^https?://.+'),
  description  text not null default '' check (char_length(description) <= 5000),
  screenshots  text[] not null default '{}'
                 check (array_length(screenshots, 1) between 1 and 3),
  is_public    boolean not null default true,
  published_at timestamptz not null default now()
);

create index if not exists projects_public_idx on public.projects (is_public, published_at desc);
create index if not exists projects_idea_idx on public.projects (idea_id);
