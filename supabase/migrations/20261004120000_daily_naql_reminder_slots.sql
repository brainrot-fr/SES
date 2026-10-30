alter table public.device_tokens
  add column slots_per_day integer not null default 7
  check (slots_per_day in (0, 1, 3, 7));

drop function public.register_device_token(text, text, text);

create function public.register_device_token(
  p_token text,
  p_timezone text,
  p_lang text,
  p_slots_per_day integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Not signed in'; end if;
  if char_length(p_token) not between 20 and 4096 then raise exception 'Invalid token'; end if;
  if p_slots_per_day not in (0, 1, 3, 7) then raise exception 'Invalid reminder frequency'; end if;
  insert into public.device_tokens (token, user_id, timezone, lang, slots_per_day, updated_at)
  values (p_token, (select auth.uid()), coalesce(nullif(p_timezone, ''), 'UTC'),
          case when p_lang = 'ur' then 'ur' else 'en' end, p_slots_per_day, now())
  on conflict (token) do update
    set user_id = excluded.user_id, timezone = excluded.timezone,
        lang = excluded.lang, slots_per_day = excluded.slots_per_day, updated_at = now();
end;
$$;

create or replace function public.set_naql_reminder_slots(p_slots_per_day integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Not signed in'; end if;
  if p_slots_per_day not in (0, 1, 3, 7) then raise exception 'Invalid reminder frequency'; end if;
  update public.device_tokens
  set slots_per_day = p_slots_per_day, updated_at = now()
  where user_id = (select auth.uid());
end;
$$;

revoke all on function public.register_device_token(text, text, text, integer) from public, anon;
revoke all on function public.set_naql_reminder_slots(integer) from public, anon;
grant execute on function public.register_device_token(text, text, text, integer) to authenticated;
grant execute on function public.set_naql_reminder_slots(integer) to authenticated;
