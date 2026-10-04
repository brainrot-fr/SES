create table public.device_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'android',
  timezone text not null default 'UTC',
  lang text not null default 'en' check (lang in ('en', 'ur')),
  last_sent_key text,
  updated_at timestamptz not null default now()
);
create index device_tokens_user_id_idx on public.device_tokens (user_id);
alter table public.device_tokens enable row level security;
revoke all on public.device_tokens from anon, authenticated;

create or replace function public.register_device_token(p_token text, p_timezone text, p_lang text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Not signed in'; end if;
  if char_length(p_token) not between 20 and 4096 then raise exception 'Invalid token'; end if;
  insert into public.device_tokens (token, user_id, timezone, lang, updated_at)
  values (p_token, (select auth.uid()), coalesce(nullif(p_timezone, ''), 'UTC'),
          case when p_lang = 'ur' then 'ur' else 'en' end, now())
  on conflict (token) do update
    set user_id = excluded.user_id, timezone = excluded.timezone,
        lang = excluded.lang, updated_at = now();
end;
$$;

create or replace function public.unregister_device_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.device_tokens where token = p_token and user_id = (select auth.uid());
$$;

revoke all on function public.register_device_token(text, text, text) from public, anon;
revoke all on function public.unregister_device_token(text) from public, anon;
grant execute on function public.register_device_token(text, text, text) to authenticated;
grant execute on function public.unregister_device_token(text) to authenticated;
