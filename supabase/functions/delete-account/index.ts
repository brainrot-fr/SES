import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { destroyCloudinaryAsset, getCloudinaryAssetFromUrl } from './cloudinary.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PostMedia = {
  media_public_id: string | null;
  media_type: string | null;
  media_url: string | null;
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getUserPosts(supabase: ReturnType<typeof createClient>, userId: string): Promise<PostMedia[]> {
  const posts: PostMedia[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('posts')
      .select('media_public_id, media_type, media_url')
      .eq('author_id', userId)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    posts.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) return posts;
  }
}

function collectCloudinaryAssets(posts: PostMedia[], avatarUrls: unknown[], cloudName: string) {
  const assets = new Map<string, { publicId: string; resourceType: string }>();

  for (const post of posts) {
    const asset = post.media_public_id && post.media_type
      ? { publicId: post.media_public_id, resourceType: post.media_type }
      : getCloudinaryAssetFromUrl(post.media_url, cloudName);

    if (asset && ['image', 'video', 'raw'].includes(asset.resourceType)) {
      assets.set(`${asset.resourceType}:${asset.publicId}`, asset);
    }
  }

  for (const url of avatarUrls) {
    if (typeof url !== 'string') continue;
    const asset = getCloudinaryAssetFromUrl(url, cloudName);
    if (asset) assets.set(`${asset.resourceType}:${asset.publicId}`, asset);
  }

  return [...assets.values()];
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const cloudinaryApiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const cloudinaryApiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  if (!supabaseUrl || !serviceRoleKey || !cloudName || !cloudinaryApiKey || !cloudinaryApiSecret) {
    return jsonResponse({ error: 'Account deletion is not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let posts: PostMedia[];
  let socialProfileAvatarUrl: string | null;
  try {
    const [userPosts, socialProfileResult] = await Promise.all([
      getUserPosts(supabase, user.id),
      supabase.from('social_profiles').select('avatar_url').eq('user_id', user.id).maybeSingle(),
    ]);
    if (socialProfileResult.error) throw socialProfileResult.error;
    posts = userPosts;
    socialProfileAvatarUrl = socialProfileResult.data?.avatar_url ?? null;
  } catch (error) {
    console.error('[delete-account] failed to load user media metadata', error);
    return jsonResponse({ error: 'Could not prepare account media deletion' }, 500);
  }

  const assets = collectCloudinaryAssets(
    posts,
    [socialProfileAvatarUrl, user.user_metadata?.avatar_url],
    cloudName,
  );
  for (let offset = 0; offset < assets.length; offset += 5) {
    const batch = assets.slice(offset, offset + 5);
    const deletionResults = await Promise.allSettled(
      batch.map((asset) =>
        destroyCloudinaryAsset(asset, {
          cloudName,
          apiKey: cloudinaryApiKey,
          apiSecret: cloudinaryApiSecret,
        })
      ),
    );
    const deletionError = deletionResults.find((result) => result.status === 'rejected');
    if (deletionError?.status === 'rejected') {
      console.error('[delete-account] failed to remove user media', deletionError.reason);
      return jsonResponse({ error: 'Could not remove account media' }, 502);
    }
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account] failed to delete user', deleteError);
    return jsonResponse({ error: 'Could not delete account' }, 500);
  }

  return jsonResponse({ deleted: true }, 200);
});