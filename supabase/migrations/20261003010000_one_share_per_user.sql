delete from public.post_shares a
using public.post_shares b
where a.post_id = b.post_id
  and a.user_id = b.user_id
  and (a.created_at, a.id) > (b.created_at, b.id);

alter table public.post_shares
  add constraint post_shares_post_user_key unique (post_id, user_id);
