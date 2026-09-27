import { supabase } from "../../lib/supabaseClient";

export const POSTS_PAGE_SIZE = 20;

export async function fetchPosts(page = 0) {
  const start = page * POSTS_PAGE_SIZE;
  const { data, error } = await supabase
    .from("posts")
    .select("id, author_id, author_display_name, body, media_url, media_type, media_format, media_width, media_height, media_bytes, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(start, start + POSTS_PAGE_SIZE - 1);

  if (error) throw error;
  return data;
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
