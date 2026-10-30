create or replace function public.create_social_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  candidate_name text;
  safe_name text;
begin
  candidate_name := coalesce(
    nullif(btrim(metadata ->> 'display_name'), ''),
    nullif(btrim(metadata ->> 'full_name'), ''),
    nullif(btrim(metadata ->> 'name'), '')
  );
  safe_name := case
    when char_length(candidate_name) between 2 and 40 then candidate_name
    else 'Community member'
  end;

  insert into public.social_profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    safe_name,
    coalesce(
      nullif(metadata ->> 'avatar_url', ''),
      nullif(metadata ->> 'picture', '')
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_social_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists auth_user_create_social_profile on auth.users;
create trigger auth_user_create_social_profile
after insert on auth.users
for each row execute function public.create_social_profile_for_new_user();

insert into public.social_profiles (user_id, display_name, avatar_url)
select
  users.id,
  case
    when char_length(candidate.name) between 2 and 40 then candidate.name
    else 'Community member'
  end,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(users.raw_user_meta_data ->> 'picture', '')
  )
from auth.users as users
cross join lateral (
  select coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(users.raw_user_meta_data ->> 'name'), '')
  ) as name
) as candidate
on conflict (user_id) do nothing;

create table public.post_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint post_blocks_not_self check (blocker_id <> blocked_id)
);

alter table public.posts add column if not exists media_alt text;

alter table public.post_blocks enable row level security;
grant select, insert, delete on public.post_blocks to authenticated;

create policy "Users can read blocks involving themselves"
  on public.post_blocks for select
  to authenticated
  using (blocker_id = (select auth.uid()) or blocked_id = (select auth.uid()));

create policy "Users can block others as themselves"
  on public.post_blocks for insert
  to authenticated
  with check (blocker_id = (select auth.uid()) and blocked_id <> (select auth.uid()));

create policy "Users can unblock others as themselves"
  on public.post_blocks for delete
  to authenticated
  using (blocker_id = (select auth.uid()));

drop policy if exists "Posts are visible only to same-gender viewers" on public.posts;
create policy "Posts are visible only to same-gender viewers"
  on public.posts as restrictive for select
  to authenticated
  using (
    public.can_view_post_by_gender(author_id)
    and not exists (
      select 1
      from public.post_blocks as blocks
      where (blocks.blocker_id = (select auth.uid()) and blocks.blocked_id = posts.author_id)
        or (blocks.blocker_id = posts.author_id and blocks.blocked_id = (select auth.uid()))
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
  join public.posts as posts on posts.id = requested.post_id
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
    and not exists (
      select 1
      from public.post_blocks as blocks
      where (blocks.blocker_id = (select auth.uid()) and blocks.blocked_id = posts.author_id)
        or (blocks.blocker_id = posts.author_id and blocks.blocked_id = (select auth.uid()))
    )
  order by requested.ordinal;
$$;

revoke all on function public.get_social_engagement(uuid[]) from public, anon;
grant execute on function public.get_social_engagement(uuid[]) to authenticated;

create unique index if not exists post_reports_post_reporter_unique_idx
  on public.post_reports (post_id, reporter_id);
