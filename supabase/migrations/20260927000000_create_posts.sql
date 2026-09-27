create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  author_display_name text not null default 'Community member',
  body text not null default '',
  media_url text,
  media_type text,
  media_public_id text,
  created_at timestamptz not null default now()
);

alter table public.posts
  add column if not exists author_display_name text not null default 'Community member',
  add column if not exists body text not null default '',
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists media_public_id text,
  add column if not exists created_at timestamptz not null default now();

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.posts'::regclass
      and contype = 'f'
      and confrelid = 'public.profiles'::regclass
  loop
    execute format('alter table public.posts drop constraint %I', constraint_row.conname);
  end loop;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.posts'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
  ) then
    alter table public.posts
      add constraint posts_author_id_auth_users_fkey
      foreign key (author_id) references auth.users(id) on delete cascade not valid;
  end if;
end
$$;

alter table public.posts enable row level security;
grant select, insert, update, delete on public.posts to authenticated;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'posts'
  loop
    execute format('drop policy %I on public.posts', policy_row.policyname);
  end loop;
end
$$;

create policy "Authenticated users can read posts"
  on public.posts for select
  to authenticated
  using (true);

create policy "Users can create their own posts"
  on public.posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and author_display_name = coalesce(
      nullif((select auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
      nullif((select auth.jwt() -> 'user_metadata' ->> 'full_name'), ''),
      nullif((select auth.jwt() -> 'user_metadata' ->> 'name'), ''),
      'Community member'
    )
  );

create policy "Users can update their own posts"
  on public.posts for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (
    author_id = (select auth.uid())
    and author_display_name = coalesce(
      nullif((select auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
      nullif((select auth.jwt() -> 'user_metadata' ->> 'full_name'), ''),
      nullif((select auth.jwt() -> 'user_metadata' ->> 'name'), ''),
      'Community member'
    )
  );

create policy "Users can delete their own posts"
  on public.posts for delete
  to authenticated
  using (author_id = (select auth.uid()));

create index if not exists posts_created_at_id_idx
  on public.posts (created_at desc, id desc);
