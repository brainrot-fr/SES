import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { destroyCloudinaryAsset, getCloudinaryAssetFromUrl } from '../delete-account/cloudinary.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  if (!supabaseUrl || !serviceRoleKey || !cloudName || !apiKey || !apiSecret) {
    return jsonResponse({ error: 'Media deletion is not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: { postId?: unknown; publicId?: unknown; resourceType?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  let asset: { publicId: string; resourceType: string } | null = null;
  if (typeof body.postId === 'string') {
    const { data: post, error } = await supabase
      .from('posts')
      .select('author_id, media_public_id, media_type, media_url')
      .eq('id', body.postId)
      .maybeSingle();
    if (error) {
      console.error('[delete-post-media] failed to load post metadata', error);
      return jsonResponse({ error: 'Could not load post media' }, 500);
    }
    if (!post) return jsonResponse({ error: 'Post not found' }, 404);
    if (post.author_id !== user.id) return jsonResponse({ error: 'Forbidden' }, 403);
    asset = post.media_public_id && ['image', 'video'].includes(post.media_type)
      ? { publicId: post.media_public_id, resourceType: post.media_type }
      : getCloudinaryAssetFromUrl(post.media_url, cloudName);
  } else if (
    typeof body.publicId === 'string'
    && typeof body.resourceType === 'string'
    && ['image', 'video'].includes(body.resourceType)
  ) {
    const pathParts = body.publicId.split('/');
    if (
      pathParts.some((part) => !part || part === '.' || part === '..')
      || !body.publicId.startsWith(`ses-posts/${user.id}/`)
    ) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
    asset = { publicId: body.publicId, resourceType: body.resourceType };
  } else {
    return jsonResponse({ error: 'A post ID or owned upload ID is required' }, 400);
  }

  if (!asset) return jsonResponse({ deleted: false }, 200);
  try {
    await destroyCloudinaryAsset(asset, { cloudName, apiKey, apiSecret });
  } catch (error) {
    console.error('[delete-post-media] Cloudinary deletion failed', error);
    return jsonResponse({ error: 'Could not delete post media' }, 502);
  }

  return jsonResponse({ deleted: true }, 200);
});
