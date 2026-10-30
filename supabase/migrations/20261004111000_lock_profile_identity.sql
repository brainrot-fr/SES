create or replace function public.prevent_completed_profile_identity_changes()
returns trigger
language plpgsql
as $$
begin
  if old.onboarding_completed_at is not null and (
    new.onboarding_completed_at is distinct from old.onboarding_completed_at
    or new.onboarding_gender is distinct from old.onboarding_gender
    or new.follower_confirmed is distinct from old.follower_confirmed
  ) then
    raise exception 'Completed onboarding identity fields cannot be changed.';
  end if;
  return new;
end;
$$;
