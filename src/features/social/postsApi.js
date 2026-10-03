import { supabase } from "../../lib/supabaseClient.js";
import { hasMoreForPage, rankReels } from "./reelRanking.js";

export const POSTS_PAGE_SIZE = 20;
const POST_COLUMNS = "id, author_id, author_display_name, body, media_url, media_type, media_format, media_width, media_height, media_bytes, created_at";

async function fetchProfiles(posts) {
  const userIds = [...new Set(posts.map((post) => post.author_id))];
  if (!userIds.length) return new Map();
  const { data, error } = await supabase
    .from("social_profiles")
    .select("user_id,display_name,avatar_url")
    .in("user_id", userIds);
  if (error) throw error;
  return new Map(data.map((profile) => [profile.user_id, profile]));
}

async function addEngagement(posts) {
  if (!posts.length) return posts;
  const postIds = posts.map((post) => post.id);
  const [{ data: engagement, error: engagementError }, profiles] = await Promise.all([
    supabase.rpc("get_social_engagement", { p_post_ids: postIds }),
    fetchProfiles(posts),
  ]);
  if (engagementError) throw engagementError;
  const engagementByPost = new Map(engagement.map((item) => [item.post_id, item]));
  return posts.map((post) => ({
    ...post,
    ...engagementByPost.get(post.id),
    author_display_name: profiles.get(post.author_id)?.display_name || post.author_display_name,
    author_avatar_url: profiles.get(post.author_id)?.avatar_url || null,
  }));
}

export async function fetchPosts(page = 0, mediaType, prioritizedPostId) {
  const start = page * POSTS_PAGE_SIZE;
  let query = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (mediaType) query = query.eq("media_type", mediaType);
  else query = query.is("media_type", null).is("media_url", null);

  if (page > 0 && prioritizedPostId) query = query.neq("id", prioritizedPostId);
  query = query.range(start, start + POSTS_PAGE_SIZE - 1);
  const requests = [query];
  if (page === 0 && prioritizedPostId) {
    requests.push(
      supabase.from("posts").select(POST_COLUMNS).eq("id", prioritizedPostId).is("media_type", null).is("media_url", null).maybeSingle(),
    );
  }
  const results = await Promise.all(requests);
  const { data, error } = results[0];

  if (error) throw error;
  if (results[1]?.error) throw results[1].error;
  const hasMore = hasMoreForPage(data.length, POSTS_PAGE_SIZE);
  const prioritizedPost = results[1]?.data;
  const uniquePosts = prioritizedPost
    ? [prioritizedPost, ...data.filter((post) => post.id !== prioritizedPost.id)]
    : data;
  return { posts: await addEngagement(uniquePosts), hasMore };
}

export async function fetchReels(page = 0, userId, preferences = {}, prioritizedReelId) {
  const start = page * POSTS_PAGE_SIZE;
  let postsQuery = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("media_type", "video")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (page > 0 && prioritizedReelId) postsQuery = postsQuery.neq("id", prioritizedReelId);
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
  const hasMore = hasMoreForPage(posts.length, POSTS_PAGE_SIZE);
  const prioritizedPost = results[1]?.data;
  const uniquePosts = prioritizedPost
    ? [prioritizedPost, ...posts.filter((post) => post.id !== prioritizedPost.id)]
    : posts;
  if (!uniquePosts.length) return { posts: uniquePosts, hasMore };

  const postIds = uniquePosts.map((post) => post.id);
  const [{ data: engagement, error: engagementError }, profiles] = await Promise.all([
    supabase.rpc("get_social_engagement", { p_post_ids: postIds }),
    fetchProfiles(uniquePosts),
  ]);
  if (engagementError) throw engagementError;
  const engagementByPost = new Map(engagement.map((item) => [item.post_id, item]));

  const enriched = uniquePosts.map((post) => ({
    ...post,
    ...engagementByPost.get(post.id),
    author_display_name: profiles.get(post.author_id)?.display_name || post.author_display_name,
    author_avatar_url: profiles.get(post.author_id)?.avatar_url || null,
  }));
  // Ranking is intentionally scoped to this fetched page.
  const ranked = rankReels(enriched, preferences);
  const ordered = !prioritizedPost ? ranked : [
    ...ranked.filter((post) => post.id === prioritizedPost.id),
    ...ranked.filter((post) => post.id !== prioritizedPost.id),
  ];
  return { posts: ordered, hasMore };
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

export async function setPostLike(postId, userId, liked) {
  return setReelLike(postId, userId, liked);
}

export async function setFollow(userId, authorId, following) {
  if (following) {
    const { error } = await supabase
      .from("user_follows")
      .upsert({ follower_id: userId, followed_id: authorId }, {
        onConflict: "follower_id,followed_id",
        ignoreDuplicates: true,
      });
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", userId)
    .eq("followed_id", authorId);
  if (error) throw error;
}

export async function recordPostView(postId, userId) {
  const { data, error } = await supabase
    .from("post_views")
    .upsert({ post_id: postId, user_id: userId }, {
      onConflict: "post_id,user_id",
      ignoreDuplicates: true,
    })
    .select("post_id")
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function recordPostShare(postId, userId) {
  const { error } = await supabase.from("post_shares").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

export async function reportPost(postId, reporterId, reason) {
  const { error } = await supabase.from("post_reports").insert({
    post_id: postId,
    reporter_id: reporterId,
    reason,
  });
  if (error) throw error;
}

export async function fetchComments(postId) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id,author_id,author_display_name,body,reply_to_id,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const profiles = await fetchProfiles(data.map((comment) => ({ author_id: comment.author_id })));
  return data.map((comment) => ({
    ...comment,
    author_display_name: profiles.get(comment.author_id)?.display_name || comment.author_display_name,
    author_avatar_url: profiles.get(comment.author_id)?.avatar_url || null,
  }));
}

export async function createComment({ postId, body, user, replyToId = null }) {
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
      reply_to_id: replyToId,
    })
    .select("id,author_id,author_display_name,body,reply_to_id,created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSocialProfile({ user, displayName, avatarUrl }) {
  const normalizedDisplayName = displayName.trim();
  const normalizedAvatarUrl = avatarUrl || null;
  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      display_name: normalizedDisplayName,
      avatar_url: normalizedAvatarUrl,
    },
  });
  if (error) throw error;
  const { error: profileError } = await supabase.from("social_profiles").upsert({
    user_id: user.id,
    display_name: normalizedDisplayName,
    avatar_url: normalizedAvatarUrl,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw profileError;
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) throw refreshError;
  if (!refreshed.session?.user) {
    throw new Error("Unable to refresh the session after updating the social profile.");
  }
  return refreshed.session.user;
}

export async function fetchReelComments(postId) {
  return fetchComments(postId);
}

export async function createReelComment({ postId, body, user, replyToId = null }) {
  return createComment({ postId, body, user, replyToId });
}

export async function deletePostComment(commentId) {
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
  if (error) throw error;
}
