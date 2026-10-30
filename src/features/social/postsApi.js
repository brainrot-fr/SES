import { supabase } from "@/lib/supabaseClient.js";
import { hasMoreForPage, readReelPreferences } from "@/features/social/reelRanking.js";

export const POSTS_PAGE_SIZE = 20;
const POST_COLUMNS = "id, author_id, author_display_name, body, media_url, media_public_id, media_type, media_format, media_width, media_height, media_bytes, media_alt, topics, created_at";

function applyKeyset(query, cursor, includeImages = false) {
  if (cursor) {
    const beforeCursor = `created_at.lt.${cursor.created_at}`;
    const sameTimestampEarlierId = `and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
    const keysetFilter = includeImages
      ? [
        `and(media_type.is.null,${beforeCursor})`,
        `and(media_type.is.null,created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
        `and(media_type.eq.image,${beforeCursor})`,
        `and(media_type.eq.image,created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      ].join(",")
      : `${beforeCursor},${sameTimestampEarlierId}`;
    query = query.or(keysetFilter);
  } else if (includeImages) {
    query = query.or("media_type.is.null,media_type.eq.image");
  }
  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(POSTS_PAGE_SIZE);
}

function nextCursor(posts, fallback = null) {
  const lastPost = posts.at(-1);
  return lastPost
    ? { created_at: lastPost.created_at, id: lastPost.id }
    : fallback;
}

async function deleteUploadedMedia(media) {
  const { error } = await supabase.functions.invoke("delete-post-media", {
    body: { publicId: media.publicId, resourceType: media.resourceType },
  });
  if (error) throw error;
}

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

export async function fetchPosts(cursor = null, mediaType, prioritizedPostId) {
  let query = supabase
    .from("posts")
    .select(POST_COLUMNS);

  if (mediaType) query = query.eq("media_type", mediaType);

  if (cursor && prioritizedPostId) query = query.neq("id", prioritizedPostId);
  query = applyKeyset(query, cursor, !mediaType);
  const requests = [query];
  if (!cursor && prioritizedPostId) {
    let prioritizedQuery = supabase.from("posts").select(POST_COLUMNS).eq("id", prioritizedPostId);
    prioritizedQuery = mediaType
      ? prioritizedQuery.eq("media_type", mediaType)
      : prioritizedQuery.or("media_type.is.null,media_type.eq.image");
    requests.push(prioritizedQuery.maybeSingle());
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
  return {
    posts: await addEngagement(uniquePosts),
    hasMore,
    nextCursor: nextCursor(data, cursor),
  };
}

export async function fetchReels(cursor = null, userId, prioritizedReelId) {
  let postsQuery = supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("media_type", "video");

  if (cursor && prioritizedReelId) postsQuery = postsQuery.neq("id", prioritizedReelId);
  postsQuery = applyKeyset(postsQuery, cursor);
  const requests = [postsQuery];
  if (!cursor && prioritizedReelId) {
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
  if (!uniquePosts.length) return { posts: uniquePosts, hasMore, nextCursor: nextCursor(posts, cursor) };

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
  const ordered = !prioritizedPost ? enriched : [
    ...enriched.filter((post) => post.id === prioritizedPost.id),
    ...enriched.filter((post) => post.id !== prioritizedPost.id),
  ];
  return { posts: ordered, hasMore, nextCursor: nextCursor(posts, cursor) };
}

export async function fetchReelPreferences(userId) {
  const localPreferences = readReelPreferences(userId);
  if (!userId) return localPreferences;
  const { data, error } = await supabase
    .from("reel_prefs")
    .select("topic,score")
    .eq("user_id", userId);
  if (error) {
    console.warn("[Reels] could not load saved topic preferences; using local preferences", error);
    return localPreferences;
  }
  return Object.fromEntries(data.map(({ topic, score }) => [topic, Number(score) || 0]));
}

export async function saveReelPreferences(userId, preferences) {
  if (!userId) return;
  const rows = Object.entries(preferences).map(([topic, score]) => ({
    user_id: userId,
    topic,
    score,
  }));
  if (!rows.length) return;
  const { error } = await supabase
    .from("reel_prefs")
    .upsert(rows, { onConflict: "user_id,topic" });
  if (error) throw error;
}

export async function createPost({
  body,
  media,
  mediaAlt = null,
  topics = [],
  user,
  fallbackDisplayName,
}) {
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    fallbackDisplayName;

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
      media_alt: mediaAlt?.trim() || null,
      topics,
    })
    .select(POST_COLUMNS)
    .single();

  if (error) {
    if (media?.publicId && media?.resourceType) {
      try {
        await deleteUploadedMedia(media);
      } catch (cleanupError) {
        console.error("[Social] failed to remove orphaned Cloudinary media", cleanupError);
        throw new AggregateError(
          [error, cleanupError],
          "Post creation failed and uploaded media cleanup also failed.",
        );
      }
    }
    throw error;
  }
  return data;
}

export async function deletePost(postId, hasMedia = true) {
  if (hasMedia) {
    const { error: mediaError } = await supabase.functions.invoke("delete-post-media", {
      body: { postId },
    });
    if (mediaError) throw mediaError;
  }
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
  const { data, error } = await supabase
    .from("post_shares")
    .upsert({ post_id: postId, user_id: userId }, { onConflict: "post_id,user_id", ignoreDuplicates: true })
    .select("post_id")
    .maybeSingle();
  if (error) throw error;
  return !!data;
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

export async function createComment({
  postId,
  body,
  user,
  replyToId = null,
  fallbackDisplayName,
}) {
  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    fallbackDisplayName;
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
  const { error: profileError } = await supabase.from("social_profiles").upsert({
    user_id: user.id,
    display_name: normalizedDisplayName,
    avatar_url: normalizedAvatarUrl,
    updated_at: new Date().toISOString(),
  });
  if (profileError) throw profileError;
  const { error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      display_name: normalizedDisplayName,
      avatar_url: normalizedAvatarUrl,
    },
  });
  if (error) throw error;
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

export async function createReelComment({ postId, body, user, replyToId = null, fallbackDisplayName }) {
  return createComment({ postId, body, user, replyToId, fallbackDisplayName });
}

export async function deletePostComment(commentId) {
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function fetchBlockedUsers(userId) {
  const { data: blocks, error } = await supabase
    .from("post_blocks")
    .select("blocked_id")
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!blocks.length) return [];
  const blockedIds = blocks.map(({ blocked_id }) => blocked_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("social_profiles")
    .select("user_id,display_name")
    .in("user_id", blockedIds);
  if (profilesError) throw profilesError;
  const names = new Map(profiles.map(({ user_id, display_name }) => [user_id, display_name]));
  return blockedIds.map((id) => ({
    id,
    displayName: names.get(id) || "",
  }));
}

export async function unblockUser(userId, blockedId) {
  const { error } = await supabase
    .from("post_blocks")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
}
