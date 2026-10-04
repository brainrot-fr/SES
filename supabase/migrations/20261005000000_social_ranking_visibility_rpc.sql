create or replace function public.assert_social_post_visibility(p_author_ids uuid[])
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select
    exists (
      select 1
      from public.profiles as viewer
      where viewer.id = (select auth.uid())
        and viewer.onboarding_gender in ('girl', 'boy')
    )
    and not exists (
      select 1
      from unnest(coalesce(p_author_ids, '{}'::uuid[])) as requested(author_id)
      where not exists (
        select 1
        from public.profiles as viewer
        join public.profiles as author
          on author.id = requested.author_id
        where viewer.id = (select auth.uid())
          and viewer.onboarding_gender in ('girl', 'boy')
          and author.onboarding_gender = viewer.onboarding_gender
      )
    );
$$;

revoke all on function public.assert_social_post_visibility(uuid[]) from public, anon;
grant execute on function public.assert_social_post_visibility(uuid[]) to authenticated;

create or replace function public.rank_social_reels(
  p_post_ids uuid[],
  p_preferences jsonb default '{}'::jsonb
)
returns table (post_id uuid, rank_score double precision)
language sql
stable
security invoker
set search_path = ''
as $$
  with candidates as (
    select
      posts.id,
      posts.created_at,
      lower(coalesce(posts.body, '')) as body,
      coalesce(likes.like_count, 0) as like_count,
      coalesce(comments.comment_count, 0) as comment_count
    from public.posts as posts
    join (
      select distinct requested.post_id
      from unnest(coalesce(p_post_ids, '{}'::uuid[])) as requested(post_id)
    ) as requested on requested.post_id = posts.id
    left join lateral (
      select count(*) as like_count
      from public.post_likes
      where post_likes.post_id = posts.id
    ) as likes on true
    left join lateral (
      select count(*) as comment_count
      from public.post_comments
      where post_comments.post_id = posts.id
    ) as comments on true
    where posts.media_type = 'video'
  ),
  scored as (
    select
      candidates.id,
      candidates.created_at,
      -- Score = 45% four-day recency decay, 25% logarithmic engagement,
      -- and 30% keyword-matched user topic preferences.
      (
        0.45 * exp(
          -greatest(extract(epoch from (now() - candidates.created_at)), 0) / 345600.0
        )
        + 0.25 * least(
          1.0,
          ln(1.0 + candidates.like_count + candidates.comment_count * 1.5) / 6.0
        )
        + 0.30 * least(
          1.0,
          (
            case when candidates.body ~ '\m(quran|qur''an|surah|ayah|recitation|tajweed)\M'
              and jsonb_typeof(p_preferences -> 'quran') = 'number'
              then least(1.0, greatest(0.0, (p_preferences ->> 'quran')::float8) / 6.0)
              else 0.0 end
            + case when candidates.body ~ '\m(learn|lesson|knowledge|study|reflection|hadith|fiqh)\M'
              and jsonb_typeof(p_preferences -> 'learning') = 'number'
              then least(1.0, greatest(0.0, (p_preferences ->> 'learning')::float8) / 6.0)
              else 0.0 end
            + case when candidates.body ~ '\m(prayer|salah|dua|dhikr|ramadan|fasting)\M'
              and jsonb_typeof(p_preferences -> 'worship') = 'number'
              then least(1.0, greatest(0.0, (p_preferences ->> 'worship')::float8) / 6.0)
              else 0.0 end
            + case when candidates.body ~ '\m(community|family|volunteer|masjid|mosque|charity)\M'
              and jsonb_typeof(p_preferences -> 'community') = 'number'
              then least(1.0, greatest(0.0, (p_preferences ->> 'community')::float8) / 6.0)
              else 0.0 end
            + case when candidates.body ~ '\m(history|seerah|sirah|heritage|imam)\M'
              and jsonb_typeof(p_preferences -> 'history') = 'number'
              then least(1.0, greatest(0.0, (p_preferences ->> 'history')::float8) / 6.0)
              else 0.0 end
          ) / 2.0
        )
      )::double precision as score
    from candidates
  )
  select scored.id, scored.score
  from scored
  order by scored.score desc, scored.created_at desc, scored.id;
$$;

revoke all on function public.rank_social_reels(uuid[], jsonb) from public, anon;
grant execute on function public.rank_social_reels(uuid[], jsonb) to authenticated;
