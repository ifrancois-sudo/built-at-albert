-- Built at Albert — guarded operations
-- Every state transition goes through one of these functions. They run as
-- definer and re-check the caller themselves, so the rules hold even if a
-- client talks to Postgres directly.

-- Reminders fire relative to expires_at, so extending a claim naturally
-- re-arms them. The stage only ever moves forward, which makes the cron
-- idempotent: a second run in the same window matches no rows.
alter table public.claims
  add column if not exists reminder_stage smallint not null default 0;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_verified()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid()
      and p.role = 'admin'
      and u.email_confirmed_at is not null
  );
$$;

-- ---------------------------------------------------------------------------
-- moderation
-- ---------------------------------------------------------------------------

create or replace function public.moderate_idea(
  p_idea_id uuid,
  p_approve boolean,
  p_reason  text default null
)
returns public.ideas
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.ideas;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = 'insufficient_privilege';
  end if;

  if not p_approve and nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'reason_required' using errcode = 'check_violation';
  end if;

  update public.ideas i
  set status          = case when p_approve then 'open' else 'rejected' end,
      published_at    = case when p_approve then coalesce(i.published_at, now()) else null end,
      rejected_reason = case when p_approve then null else btrim(p_reason) end
  where i.id = p_idea_id
    and i.status = 'pending'
  returning * into result;

  if result.id is null then
    raise exception 'idea_not_pending' using errcode = 'check_violation';
  end if;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- reservations
-- ---------------------------------------------------------------------------

create or replace function public.claim_idea(p_idea_id uuid)
returns public.claims
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.claims;
  idea_status text;
begin
  if not public.is_verified() then
    raise exception 'not_verified' using errcode = 'insufficient_privilege';
  end if;

  select status into idea_status from public.ideas where id = p_idea_id for update;

  if idea_status is null then
    raise exception 'idea_not_found' using errcode = 'no_data_found';
  end if;

  if idea_status <> 'open' then
    raise exception 'idea_not_open' using errcode = 'check_violation';
  end if;

  -- The partial unique index is what actually guarantees exclusivity; the
  -- quota trigger fires on the same insert.
  insert into public.claims (idea_id, user_id)
  values (p_idea_id, auth.uid())
  returning * into result;

  update public.ideas set status = 'claimed' where id = p_idea_id;

  return result;
end;
$$;

create or replace function public.release_claim(p_claim_id uuid)
returns public.claims
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.claims;
begin
  update public.claims c
  set status = 'released', ended_at = now()
  where c.id = p_claim_id
    and c.status = 'active'
    and (c.user_id = auth.uid() or public.is_admin())
  returning * into result;

  if result.id is null then
    raise exception 'claim_not_releasable' using errcode = 'check_violation';
  end if;

  update public.ideas set status = 'open' where id = result.idea_id and status = 'claimed';

  return result;
end;
$$;

create or replace function public.extend_claim(p_claim_id uuid, p_days integer default 14)
returns public.claims
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.claims;
begin
  if p_days is null or p_days < 1 or p_days > 21 then
    raise exception 'invalid_extension' using errcode = 'check_violation';
  end if;

  update public.claims c
  set expires_at     = greatest(c.expires_at, now()) + make_interval(days => p_days),
      reminder_stage = 0,
      reminded_at    = null
  where c.id = p_claim_id
    and c.status = 'active'
    and (c.user_id = auth.uid() or public.is_admin())
  returning * into result;

  if result.id is null then
    raise exception 'claim_not_extendable' using errcode = 'check_violation';
  end if;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- delivery
-- ---------------------------------------------------------------------------

create or replace function public.submit_project(
  p_claim_id    uuid,
  p_url         text,
  p_description text,
  p_screenshots text[],
  p_repo_url    text default null
)
returns public.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.claims;
  result public.projects;
begin
  select * into target
  from public.claims c
  where c.id = p_claim_id and c.status = 'active' and c.user_id = auth.uid()
  for update;

  if target.id is null then
    raise exception 'claim_not_deliverable' using errcode = 'check_violation';
  end if;

  insert into public.projects (claim_id, idea_id, author_id, url, repo_url, description, screenshots)
  values (target.id, target.idea_id, target.user_id, btrim(p_url),
          nullif(btrim(coalesce(p_repo_url, '')), ''), coalesce(p_description, ''), p_screenshots)
  returning * into result;

  update public.claims set status = 'delivered', ended_at = now() where id = target.id;
  update public.ideas  set status = 'delivered' where id = target.idea_id;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin
-- ---------------------------------------------------------------------------

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.profiles;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = 'insufficient_privilege';
  end if;

  if p_role not in ('student', 'admin') then
    raise exception 'invalid_role' using errcode = 'check_violation';
  end if;

  -- An admin cannot demote themselves; that would allow locking the platform
  -- out of moderation entirely.
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'cannot_demote_self' using errcode = 'check_violation';
  end if;

  update public.profiles set role = p_role where id = p_user_id returning * into result;

  if result.id is null then
    raise exception 'profile_not_found' using errcode = 'no_data_found';
  end if;

  return result;
end;
$$;

create or replace function public.set_project_visibility(p_project_id uuid, p_is_public boolean)
returns public.projects
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.projects;
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = 'insufficient_privilege';
  end if;

  update public.projects set is_public = p_is_public where id = p_project_id returning * into result;

  if result.id is null then
    raise exception 'project_not_found' using errcode = 'no_data_found';
  end if;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- cron
-- ---------------------------------------------------------------------------

-- Both cron functions mutate and return in a single statement, so a concurrent
-- or repeated invocation finds no rows left to claim and sends nothing.

create or replace function public.expire_due_claims()
returns table (
  claim_id     uuid,
  idea_id      uuid,
  idea_title   text,
  builder_id   uuid,
  author_id    uuid
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with expired as (
    update public.claims c
    set status = 'expired', ended_at = now()
    where c.status = 'active' and c.expires_at <= now()
    returning c.id, c.idea_id, c.user_id
  ),
  reopened as (
    update public.ideas i
    set status = 'open'
    from expired e
    where i.id = e.idea_id and i.status = 'claimed'
    returning i.id, i.title, i.author_id
  )
  select e.id, e.idea_id, r.title, e.user_id, r.author_id
  from expired e
  join reopened r on r.id = e.idea_id;
end;
$$;

create or replace function public.claim_reminders_due()
returns table (
  claim_id   uuid,
  idea_id    uuid,
  idea_title text,
  builder_id uuid,
  stage      smallint,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  with bumped as (
    update public.claims c
    set reminder_stage = c.reminder_stage + 1,
        reminded_at    = now()
    where c.status = 'active'
      and (
        (c.reminder_stage = 0 and c.expires_at - now() <= interval '7 days')
        or
        (c.reminder_stage = 1 and c.expires_at - now() <= interval '2 days')
      )
    returning c.id, c.idea_id, c.user_id, c.reminder_stage, c.expires_at
  )
  select b.id, b.idea_id, i.title, b.user_id, b.reminder_stage, b.expires_at
  from bumped b
  join public.ideas i on i.id = b.idea_id;
end;
$$;

-- Only the service role runs the cron functions.
revoke execute on function public.expire_due_claims() from anon, authenticated;
revoke execute on function public.claim_reminders_due() from anon, authenticated;
