alter table public.posts
  add column if not exists topics text[] not null default '{}'::text[];

update public.posts as posts
set topics = coalesce(
  (
    select array_agg(distinct lower(matches.parts[1]))
    from regexp_matches(posts.body, '#([[:alnum:]_-]+)', 'g') as matches(parts)
  ),
  '{}'::text[]
)
where posts.media_type = 'video'
  and cardinality(posts.topics) = 0;

create index if not exists posts_topics_gin_idx
  on public.posts using gin (topics);

create table public.reel_prefs (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (char_length(trim(topic)) between 1 and 64),
  score numeric not null default 0 check (score between 0 and 12),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

alter table public.reel_prefs enable row level security;
grant select, insert, update on public.reel_prefs to authenticated;

create policy "Users can read their reel preferences"
  on public.reel_prefs for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can save their reel preferences"
  on public.reel_prefs for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their reel preferences"
  on public.reel_prefs for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
