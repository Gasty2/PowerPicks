create schema if not exists powerpicks_private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (username is null or char_length(username) between 3 and 32),
  constraint profiles_username_format check (username is null or username ~ '^[a-zA-Z0-9_]+$')
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_points integer not null default 1000,
  lifetime_points integer not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_monthly_points_nonnegative check (monthly_points >= 0),
  constraint wallets_lifetime_points_nonnegative check (lifetime_points >= 0)
);

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.wallets from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.wallets to authenticated;
grant all privileges on table public.profiles to service_role;
grant all privileges on table public.wallets to service_role;
grant usage on schema powerpicks_private to service_role;
grant execute on all functions in schema powerpicks_private to service_role;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can read their own wallet" on public.wallets;
create policy "Users can read their own wallet"
on public.wallets
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function powerpicks_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function powerpicks_private.touch_updated_at();

drop trigger if exists wallets_touch_updated_at on public.wallets;
create trigger wallets_touch_updated_at
before update on public.wallets
for each row
execute function powerpicks_private.touch_updated_at();

create or replace function powerpicks_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'username', '')), '')
  )
  on conflict (id) do update set
    display_name = coalesce(profiles.display_name, excluded.display_name),
    username = coalesce(profiles.username, excluded.username);

  insert into public.wallets (user_id, monthly_points, lifetime_points)
  values (new.id, 1000, 1000)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_powerpicks on auth.users;
create trigger on_auth_user_created_powerpicks
after insert on auth.users
for each row
execute function powerpicks_private.handle_new_auth_user();

insert into public.profiles (id, display_name)
select
  users.id,
  nullif(trim(coalesce(users.raw_user_meta_data ->> 'display_name', '')), '')
from auth.users
on conflict (id) do nothing;

insert into public.wallets (user_id, monthly_points, lifetime_points)
select users.id, 1000, 1000
from auth.users
on conflict (user_id) do nothing;
