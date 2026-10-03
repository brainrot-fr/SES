create or replace function public.prevent_completed_profile_identity_changes()
returns trigger
language plpgsql
as $$
begin
  if old.onboarding_completed_at is not null and (
    new.onboarding_gender is distinct from old.onboarding_gender
    or new.follower_confirmed is distinct from old.follower_confirmed
  ) then
    raise exception 'Completed onboarding identity fields cannot be changed.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_completed_identity_changes on public.profiles;
create trigger profiles_prevent_completed_identity_changes
before update on public.profiles
for each row execute function public.prevent_completed_profile_identity_changes();

alter table public.posts
  add constraint posts_media_url_cloudinary_check
  check (media_url is null or media_url like 'https://res.cloudinary.com/%');

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate')),
  created_at timestamptz not null default now()
);

alter table public.post_reports enable row level security;
revoke all on public.post_reports from anon, authenticated;
grant insert on public.post_reports to authenticated;

create policy "Users can report posts as themselves"
  on public.post_reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));