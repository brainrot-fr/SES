import { useCallback, useEffect, useRef, useState } from "react";
import { deletePost, fetchPosts, fetchReels, recordPostShare, recordPostView, reportPost, setFollow, setPostLike } from "./postsApi";
import { readReelPreferences, recordReelPreference } from "./reelRanking";
import { getReelPosterUrl, REEL_MUTE_KEY } from "./ReelCard";
import { readSocialFeedCache, writeSocialFeedCache } from "./socialFeedCache";
import { friendlyError } from "../../lib/supabaseClient.js";

export function useSocialFeed({ mode, user, viewerGender, prioritizedPostId, prioritizedReelId, t }) {
  const isReels = mode === "reels";
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const feedRef = useRef(null);
  const pendingNextRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showingCachedContent, setShowingCachedContent] = useState(false);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [reelMuted, setReelMuted] = useState(() => {
    try {
      return localStorage.getItem(REEL_MUTE_KEY) !== "false";
    } catch {
      return true;
    }
  });

  const loadPage = useCallback(async (pageNumber, append) => {
    if (loadingRef.current || (append && !hasMoreRef.current)) return;
    loadingRef.current = true;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    setLoadError("");
    try {
      const pageResult = isReels
        ? await fetchReels(pageNumber, user?.id, readReelPreferences(user?.id), prioritizedReelId)
        : await fetchPosts(pageNumber, undefined, prioritizedPostId);
      if (requestId !== requestIdRef.current) return;
      const { posts: nextPosts, hasMore: nextHasMore } = pageResult;
      setPosts((current) => append ? [...current, ...nextPosts] : nextPosts);
      if (!append && pageNumber === 0) {
        writeSocialFeedCache(user?.id, mode, viewerGender, nextPosts);
        setShowingCachedContent(false);
      }
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      setPage(pageNumber);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      console.error("[SocialFeed] failed to load posts", loadError);
      if (loadError?.code === "SOCIAL_VISIBILITY_VIOLATION") {
        setLoadError(t("socialVisibilityFetchError"));
      } else {
        const cachedPosts = !append && pageNumber === 0
          ? readSocialFeedCache(user?.id, mode, viewerGender)
          : null;
        if (cachedPosts) {
          setPosts(cachedPosts);
          setHasMore(false);
          hasMoreRef.current = false;
          setShowingCachedContent(true);
          setLoadError("");
        } else {
          setLoadError(friendlyError(loadError, t, "socialFeedFailed"));
        }
      }
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [isReels, mode, prioritizedPostId, prioritizedReelId, t, user?.id, viewerGender]);

  useEffect(() => {
    if (!loadError && !showingCachedContent) return undefined;
    const retry = () => loadPage(page, page > 0);
    window.addEventListener("online", retry, { once: true });
    return () => window.removeEventListener("online", retry);
  }, [loadError, loadPage, page, showingCachedContent]);

  const nextPosterUrl = isReels ? getReelPosterUrl(posts[activeReelIndex + 1]) : "";

  useEffect(() => {
    loadingRef.current = false;
    hasMoreRef.current = true;
    setPosts([]);
    setShowingCachedContent(false);
    if (isReels) setActiveReelIndex(0);
    setPage(0);
    setHasMore(true);
    loadPage(0, false);
    return () => {
      requestIdRef.current += 1;
      loadingRef.current = false;
    };
  }, [loadPage, isReels]);

  useEffect(() => {
    if (!nextPosterUrl) return undefined;
    const poster = new Image();
    poster.src = nextPosterUrl;
    return () => {
      poster.onload = null;
      poster.onerror = null;
    };
  }, [nextPosterUrl]);

  useEffect(() => {
    if (!isReels) return;
    try {
      localStorage.setItem(REEL_MUTE_KEY, String(reelMuted));
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, [isReels, reelMuted]);

  useEffect(() => {
    if (pendingNextRef.current == null) return;
    const target = feedRef.current?.querySelector(`[data-reel-index="${pendingNextRef.current}"]`);
    if (target) {
      pendingNextRef.current = null;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (!hasMore && posts.length) {
      pendingNextRef.current = null;
      feedRef.current?.querySelector(".social-reels__end")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [posts.length, hasMore]);

  const handleLike = async (post) => {
    const liked = !post.liked_by_me;
    await setPostLike(post.id, user.id, liked);
    setPosts((current) => current.map((item) => item.id === post.id
      ? { ...item, liked_by_me: liked, like_count: Math.max(0, (item.like_count || 0) + (liked ? 1 : -1)) }
      : item));
    if (isReels) recordReelPreference(user.id, post.body, liked ? 1 : -1);
  };

  const handleFollow = async (post, following) => {
    await setFollow(user.id, post.author_id, following);
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, is_following: following } : item));
  };

  const handleView = useCallback(async (postId) => {
    try {
      const isNewView = await recordPostView(postId, user.id);
      if (isNewView) {
        setPosts((current) => current.map((post) => post.id === postId
          ? { ...post, view_count: (post.view_count || 0) + 1 }
          : post));
      }
    } catch (viewError) {
      console.error("[SocialFeed] failed to record view", viewError);
    }
  }, [user?.id]);

  const handleShare = useCallback(async (post) => {
    const isNew = await recordPostShare(post.id, user.id);
    if (isNew) {
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, share_count: (item.share_count || 0) + 1 }
        : item));
    }
    return isNew;
  }, [user?.id]);

  const handleReport = useCallback((postId, reason) =>
    reportPost(postId, user.id, reason), [user?.id]);

  const handleCommentCreated = useCallback((postId, body, delta = 1) => {
    if (isReels && body && delta > 0) recordReelPreference(user.id, body, 0.5);
    setPosts((current) => current.map((post) => post.id === postId
      ? { ...post, comment_count: Math.max(0, (post.comment_count || 0) + delta) }
      : post));
  }, [isReels, user?.id]);

  const handleNearEnd = useCallback((index) => {
    if (hasMore && !loadingRef.current && index >= posts.length - 4) {
      loadPage(page + 1, true);
    }
  }, [hasMore, loadPage, page, posts.length]);

  const handleActiveReel = useCallback((index) => setActiveReelIndex(index), []);

  const handleReelEnd = useCallback((index) => {
    if (index + 1 < posts.length) {
      feedRef.current?.querySelector(`[data-reel-index="${index + 1}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    pendingNextRef.current = index + 1;
    if (hasMore) loadPage(page + 1, true);
    else feedRef.current?.querySelector(".social-reels__end")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasMore, loadPage, page, posts.length]);

  const handleDelete = async (postId) => {
    const previousPosts = posts;
    setPosts((current) => current.filter((post) => post.id !== postId));
    setError("");
    try {
      await deletePost(postId);
    } catch (deleteError) {
      console.error("[SocialFeed] failed to delete post", deleteError);
      setPosts(previousPosts);
      setError(friendlyError(deleteError, t, "socialDeleteError"));
    }
  };

  return {
    posts,
    page,
    hasMore,
    loading,
    error,
    loadError,
    showingCachedContent,
    activeReelIndex,
    reelMuted,
    setReelMuted,
    feedRef,
    loadPage,
    handleLike,
    handleFollow,
    handleView,
    handleShare,
    handleReport,
    handleCommentCreated,
    handleNearEnd,
    handleActiveReel,
    handleReelEnd,
    handleDelete,
  };
}
