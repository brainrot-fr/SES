create or replace function public.comment_parent_matches_post(
  p_parent_id uuid,
  p_post_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.post_comments as parent
    where parent.id = p_parent_id
      and parent.post_id = p_post_id
  );
$$;

revoke all on function public.comment_parent_matches_post(uuid, uuid) from public;
grant execute on function public.comment_parent_matches_post(uuid, uuid) to authenticated;

drop policy if exists "Users can reply to comments" on public.post_comments;
drop policy if exists "Users can comment as themselves" on public.post_comments;

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
      or public.comment_parent_matches_post(reply_to_id, post_id)
    )
  );
