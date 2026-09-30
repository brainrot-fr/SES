create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_gender text check (onboarding_gender is null or onboarding_gender in ('girl', 'boy')),
  follower_confirmed boolean not null default false,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  onboarding_completed_at timestamptz
);

alter table public.profiles
  add column if not exists onboarding_gender text,
  add column if not exists follower_confirmed boolean not null default false,
  add column if not exists country_code text,
  add column if not exists onboarding_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_onboarding_gender_check'
  ) then
    alter table public.profiles
      add constraint profiles_onboarding_gender_check
      check (onboarding_gender is null or onboarding_gender in ('girl', 'boy'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_country_code_check'
  ) then
    alter table public.profiles
      add constraint profiles_country_code_check
      check (country_code is null or country_code ~ '^[A-Z]{2}$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_onboarding_completion_check'
  ) then
    alter table public.profiles
      add constraint profiles_onboarding_completion_check
      check (
        onboarding_completed_at is null
        or (
          onboarding_gender in ('girl', 'boy')
          and follower_confirmed = true
        )
      );
  end if;
end
$$;

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Users can read their own account profile" on public.profiles;
create policy "Users can read their own account profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Account profile data is private" on public.profiles;
create policy "Account profile data is private"
  on public.profiles as restrictive for select
  to anon, authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can create their own account profile" on public.profiles;
create policy "Users can create their own account profile"
  on public.profiles for insert
  to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "Users can update their own account profile" on public.profiles;
create policy "Users can update their own account profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
