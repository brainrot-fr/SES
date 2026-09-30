create or replace function public.can_view_post_by_gender(p_author_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles as viewer
    join public.profiles as author
      on author.id = p_author_id
    where viewer.id = (select auth.uid())
      and viewer.onboarding_gender in ('girl', 'boy')
      and author.onboarding_gender = viewer.onboarding_gender
  );
$$;

revoke all on function public.can_view_post_by_gender(uuid) from public;
grant execute on function public.can_view_post_by_gender(uuid) to authenticated;

drop policy if exists "Authenticated users can read posts" on public.posts;
create policy "Authenticated users can read same-gender posts"
  on public.posts for select
  to authenticated
  using (public.can_view_post_by_gender(author_id));

-- Keep the gender check restrictive so another permissive SELECT policy cannot
-- accidentally make opposite-gender posts visible.
drop policy if exists "Posts are visible only to same-gender viewers" on public.posts;
create policy "Posts are visible only to same-gender viewers"
  on public.posts as restrictive for select
  to authenticated
  using (public.can_view_post_by_gender(author_id));

drop policy if exists "Post comments follow post gender visibility" on public.post_comments;
create policy "Post comments follow post gender visibility"
  on public.post_comments as restrictive for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts as visible_post
      where visible_post.id = post_comments.post_id
    )
  );

drop policy if exists "Post likes follow post gender visibility" on public.post_likes;
create policy "Post likes follow post gender visibility"
  on public.post_likes as restrictive for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts as visible_post
      where visible_post.id = post_likes.post_id
    )
  );

drop policy if exists "Post views follow post gender visibility" on public.post_views;
create policy "Post views follow post gender visibility"
  on public.post_views as restrictive for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts as visible_post
      where visible_post.id = post_views.post_id
    )
  );

drop policy if exists "Post shares follow post gender visibility" on public.post_shares;
create policy "Post shares follow post gender visibility"
  on public.post_shares as restrictive for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts as visible_post
      where visible_post.id = post_shares.post_id
    )
  );
