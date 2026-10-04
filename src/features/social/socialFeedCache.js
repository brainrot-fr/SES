const SOCIAL_FEED_CACHE_PREFIX = "ses-social-feed-cache-v1";

function getStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function getSocialFeedCacheKey(userId, mode, viewerGender) {
  return `${SOCIAL_FEED_CACHE_PREFIX}:${userId}:${viewerGender}:${mode}`;
}

export function readSocialFeedCache(userId, mode, viewerGender, storage = getStorage()) {
  if (!userId || !["girl", "boy"].includes(viewerGender) || !storage) return null;
  try {
    const cached = JSON.parse(storage.getItem(getSocialFeedCacheKey(userId, mode, viewerGender)) || "null");
    if (
      cached?.version !== 1
      || !Array.isArray(cached.posts)
      || cached.posts.some((post) => typeof post?.id !== "string")
    ) return null;
    return cached.posts;
  } catch {
    return null;
  }
}

export function writeSocialFeedCache(userId, mode, viewerGender, posts, storage = getStorage()) {
  if (!userId || !["girl", "boy"].includes(viewerGender) || !storage || !Array.isArray(posts)) return false;
  try {
    storage.setItem(
      getSocialFeedCacheKey(userId, mode, viewerGender),
      JSON.stringify({ version: 1, posts }),
    );
    return true;
  } catch {
    return false;
  }
}
