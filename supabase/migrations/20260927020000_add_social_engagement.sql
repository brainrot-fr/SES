create table if not exists public.social_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint user_follows_not_self check (follower_id <> followed_id)
);

create table if not exists public.post_views (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.post_comments
  add column if not exists reply_to_id uuid references public.post_comments(id) on delete set null;

create index if not exists post_comments_reply_to_idx
  on public.post_comments (reply_to_id, created_at);
create index if not exists user_follows_followed_id_idx
  on public.user_follows (followed_id, follower_id);
create index if not exists post_shares_post_id_idx
  on public.post_shares (post_id);

alter table public.social_profiles enable row level security;
alter table public.user_follows enable row level security;
alter table public.post_views enable row level security;
alter table public.post_shares enable row level security;

grant select, insert, update on public.social_profiles to authenticated;
grant select, insert, delete on public.user_follows to authenticated;
grant select, insert on public.post_views to authenticated;
grant select, insert on public.post_shares to authenticated;
grant select, insert, delete on public.post_comments to authenticated;

drop policy if exists "Authenticated users can read social profiles" on public.social_profiles;
drop policy if exists "Users can manage their own social profile" on public.social_profiles;
create policy "Authenticated users can read social profiles"
  on public.social_profiles for select
  to authenticated
  using (true);
create policy "Users can manage their own social profile"
  on public.social_profiles for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read follows" on public.user_follows;
drop policy if exists "Users can follow as themselves" on public.user_follows;
drop policy if exists "Users can unfollow as themselves" on public.user_follows;
create policy "Authenticated users can read follows"
  on public.user_follows for select
  to authenticated
  using (follower_id = (select auth.uid()) or followed_id = (select auth.uid()));
create policy "Users can follow as themselves"
  on public.user_follows for insert
  to authenticated
  with check (follower_id = (select auth.uid()) and followed_id <> (select auth.uid()));
create policy "Users can unfollow as themselves"
  on public.user_follows for delete
  to authenticated
  using (follower_id = (select auth.uid()));

drop policy if exists "Authenticated users can read post views" on public.post_views;
drop policy if exists "Users can record their own post views" on public.post_views;
create policy "Authenticated users can read post views"
  on public.post_views for select
  to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can record their own post views"
  on public.post_views for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Authenticated users can read post shares" on public.post_shares;
drop policy if exists "Users can record their own post shares" on public.post_shares;
create policy "Authenticated users can read post shares"
  on public.post_shares for select
  to authenticated
  using (user_id = (select auth.uid()));
create policy "Users can record their own post shares"
  on public.post_shares for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can comment as themselves" on public.post_comments;
drop policy if exists "Users can reply to comments" on public.post_comments;
create policy "Users can reply to comments"
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
    and (
      reply_to_id is null
      or exists (
        select 1
        from public.post_comments parent
        where parent.id = post_comments.reply_to_id
          and parent.post_id = post_comments.post_id
      )
    )
  );

create or replace function public.get_social_engagement(p_post_ids uuid[])
returns table (
  post_id uuid,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean,
  view_count bigint,
  share_count bigint,
  is_following boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    requested.post_id,
    coalesce(likes.like_count, 0),
    coalesce(comments.comment_count, 0),
    coalesce(likes.liked_by_me, false),
    coalesce(views.view_count, 0),
    coalesce(shares.share_count, 0),
    coalesce(follows.is_following, false)
  from unnest(p_post_ids) with ordinality as requested(post_id, ordinal)
  left join public.posts as posts on posts.id = requested.post_id
  left join lateral (
    select count(*) as like_count, bool_or(post_likes.user_id = (select auth.uid())) as liked_by_me
    from public.post_likes
    where post_likes.post_id = requested.post_id
  ) as likes on true
  left join lateral (
    select count(*) as comment_count
    from public.post_comments
    where post_comments.post_id = requested.post_id
  ) as comments on true
  left join lateral (
    select count(*) as view_count
    from public.post_views
    where post_views.post_id = requested.post_id
  ) as views on true
  left join lateral (
    select count(*) as share_count
    from public.post_shares
    where post_shares.post_id = requested.post_id
  ) as shares on true
  left join lateral (
    select exists (
      select 1 from public.user_follows
      where user_follows.follower_id = (select auth.uid())
        and user_follows.followed_id = posts.author_id
    ) as is_following
  ) as follows on true
  where (select auth.uid()) is not null
  order by requested.ordinal;
$$;

revoke all on function public.get_social_engagement(uuid[]) from public, anon;
grant execute on function public.get_social_engagement(uuid[]) to authenticated;
