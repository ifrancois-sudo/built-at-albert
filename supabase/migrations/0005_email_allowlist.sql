-- Built at Albert — email domain allowlist
-- The application also checks the domain before calling signUp, but that check
-- lives on a route anyone can skip: the anon key is public and Supabase's
-- /auth/v1/signup endpoint is reachable directly. This trigger is what actually
-- refuses the account.

create table if not exists public.allowed_email_domains (
  domain text primary key
);

alter table public.allowed_email_domains enable row level security;
revoke all on public.allowed_email_domains from anon, authenticated;

insert into public.allowed_email_domains (domain) values ('albertschool.com')
  on conflict do nothing;

create or replace function public.enforce_email_domain()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  domain text;
begin
  domain := lower(split_part(coalesce(new.email, ''), '@', 2));

  if domain = '' then
    raise exception 'email_domain_not_allowed' using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.allowed_email_domains d where d.domain = domain) then
    raise exception 'email_domain_not_allowed' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_domain on auth.users;
create trigger on_auth_user_email_domain
  before insert on auth.users
  for each row execute function public.enforce_email_domain();
