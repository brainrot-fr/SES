import { supabase } from "../../lib/supabaseClient";
import { rankReels } from "./reelRanking";

export const POSTS_PAGE_SIZE = 20;
const POST_COLUMNS = "id, author_id, author_display_name, body, media_url, media_type, media_format, media_width, media_height, media_bytes, created_at";

export async function fetchPosts(page = 0, mediaType) {
  const start = page * POSTS_PAGE_SIZE;
  let query = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (mediaType) query = query.eq("media_type", mediaType);
  else query = query.or("media_type.is.null,media_type.neq.video");

  const { data, error } = await query.range(start, start + POSTS_PAGE_SIZE - 1);

  if (error) throw error;
  return data;
}

export async function fetchReels(page = 0, userId, preferences = {}, prioritizedReelId) {
  const start = page * POSTS_PAGE_SIZE;
  let postsQuery = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("media_type", "video")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  postsQuery = postsQuery.range(start, start + POSTS_PAGE_SIZE - 1);
  const requests = [postsQuery];
  if (page === 0 && prioritizedReelId) {
    requests.push(
      supabase.from("posts").select(POST_COLUMNS).eq("id", prioritizedReelId).eq("media_type", "video").maybeSingle(),
    );
  }
  const results = await Promise.all(requests);
  const { data: posts, error } = results[0];

  if (error) throw error;
  if (results[1]?.error) throw results[1].error;
  const prioritizedPost = results[1]?.data;
  const uniquePosts = prioritizedPost
    ? [prioritizedPost, ...posts.filter((post) => post.id !== prioritizedPost.id)]
    : posts;
  if (!uniquePosts.length) return uniquePosts;

  const postIds = uniquePosts.map((post) => post.id);
  const { data: engagement, error: engagementError } = await supabase.rpc("get_reel_engagement", {
    p_post_ids: postIds,
  });
  if (engagementError) throw engagementError;
  const engagementByPost = new Map(engagement.map((item) => [item.post_id, item]));

  const enriched = uniquePosts.map((post) => ({
    ...post,
    like_count: engagementByPost.get(post.id)?.like_count || 0,
    comment_count: engagementByPost.get(post.id)?.comment_count || 0,
    liked_by_me: engagementByPost.get(post.id)?.liked_by_me || false,
  }));
  const ranked = rankReels(enriched, preferences);
  if (!prioritizedPost) return ranked;
  return [
    ...ranked.filter((post) => post.id === prioritizedPost.id),
    ...ranked.filter((post) => post.id !== prioritizedPost.id),
  ];
}

export async function createPost({ body, media, user }) {
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Community member";

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      author_display_name: displayName,
      body: body.trim(),
      media_url: media?.url ?? null,
      media_type: media?.resourceType ?? null,
      media_public_id: media?.publicId ?? null,
      media_format: media?.format ?? null,
      media_width: media?.width ?? null,
      media_height: media?.height ?? null,
      media_bytes: media?.bytes ?? null,
    })
    .select("id, author_id, author_display_name, body, media_url, media_type, media_format, media_width, media_height, media_bytes, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function setReelLike(postId, userId, liked) {
  if (liked) {
    const { error } = await supabase
      .from("post_likes")
      .upsert({ post_id: postId, user_id: userId }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}

export async function fetchReelComments(postId) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id,author_id,author_display_name,body,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createReelComment({ postId, body, user }) {
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Community member";
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      author_display_name: displayName,
      body: body.trim(),
    })
    .select("id,author_id,author_display_name,body,created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePostComment(commentId) {
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
  if (error) throw error;
}
