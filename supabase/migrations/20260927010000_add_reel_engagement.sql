create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null default 'Community member',
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_created_at_idx
  on public.post_comments (post_id, created_at);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

grant select, insert, delete on public.post_likes to authenticated;
grant select, insert, delete on public.post_comments to authenticated;

create policy "Authenticated users can read post likes"
  on public.post_likes for select
  to authenticated
  using (true);

create policy "Users can like posts as themselves"
  on public.post_likes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can remove their own post likes"
  on public.post_likes for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Authenticated users can read post comments"
  on public.post_comments for select
  to authenticated
  using (true);

create policy "Users can comment as themselves"
  on public.post_comments for insert
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

create policy "Users can delete their own post comments"
  on public.post_comments for delete
  to authenticated
  using (author_id = (select auth.uid()));

create or replace function public.get_reel_engagement(p_post_ids uuid[])
returns table (
  post_id uuid,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    requested.post_id,
    coalesce(likes.like_count, 0),
    coalesce(comments.comment_count, 0),
    coalesce(likes.liked_by_me, false)
  from unnest(p_post_ids) with ordinality as requested(post_id, ordinal)
  left join lateral (
    select
      count(*) as like_count,
      bool_or(post_likes.user_id = (select auth.uid())) as liked_by_me
    from public.post_likes
    where post_likes.post_id = requested.post_id
  ) as likes on true
  left join lateral (
    select count(*) as comment_count
    from public.post_comments
    where post_comments.post_id = requested.post_id
  ) as comments on true
  order by requested.ordinal;
$$;

grant execute on function public.get_reel_engagement(uuid[]) to authenticated;
