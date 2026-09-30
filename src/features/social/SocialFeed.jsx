import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import PostCard from "./PostCard";
import ReelCard from "./ReelCard";
import AppIcon from "../../components/icons/AppIcon";
import {
  deletePost,
  fetchPosts,
  fetchReels,
  POSTS_PAGE_SIZE,
  recordPostShare,
  recordPostView,
  setFollow,
  setPostLike,
} from "./postsApi";
import { readReelPreferences, recordReelPreference } from "./reelRanking";
import ReelEndCard from "./ReelEndCard";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Toast from "../../components/ui/Toast";
import IconButton from "../../components/ui/IconButton";
import "./socialFeed.css";

export default function SocialFeed({ mode = "posts", onShareStatus }) {
  const { t } = useLang();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isReels = mode === "reels";
  const prioritizedReelId = isReels ? new URLSearchParams(location.search).get("reel") : null;
  const prioritizedPostId = !isReels ? new URLSearchParams(location.search).get("post") : null;
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
  const [status, setStatus] = useState("");

  const loadPage = useCallback(async (pageNumber, append) => {
    if (loadingRef.current || (append && !hasMoreRef.current)) return;
    loadingRef.current = true;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    setLoadError("");
    try {
      const nextPosts = isReels
        ? await fetchReels(pageNumber, user?.id, readReelPreferences(user?.id), pageNumber === 0 ? prioritizedReelId : null)
        : await fetchPosts(pageNumber, undefined, pageNumber === 0 ? prioritizedPostId : null);
      if (requestId !== requestIdRef.current) return;
      setPosts((current) => append ? [...current, ...nextPosts] : nextPosts);
      const nextHasMore = nextPosts.length === POSTS_PAGE_SIZE;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      setPage(pageNumber);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      console.error("[SocialFeed] failed to load posts", loadError);
      setLoadError(loadError.message || t("socialFeedFailed"));
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [isReels, prioritizedPostId, prioritizedReelId, t, user?.id]);

  useEffect(() => {
    loadingRef.current = false;
    hasMoreRef.current = true;
    setPosts([]);
    setPage(0);
    setHasMore(true);
    loadPage(0, false);
    return () => {
      requestIdRef.current += 1;
      loadingRef.current = false;
    };
  }, [loadPage]);

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
    await recordPostShare(post.id, user.id);
    setPosts((current) => current.map((item) => item.id === post.id
      ? { ...item, share_count: (item.share_count || 0) + 1 }
      : item));
  }, [user?.id]);

  const handleCommentCreated = useCallback((postId, body, delta = 1) => {
    if (isReels && body && delta > 0) recordReelPreference(user.id, body, 0.5);
    setPosts((current) => current.map((post) => post.id === postId
      ? { ...post, comment_count: Math.max(0, (post.comment_count || 0) + delta) }
      : post));
  }, [isReels, user?.id]);

  const handleShareStatus = (message) => {
    setStatus(message);
    onShareStatus?.(message);
  };

  const dismissStatus = useCallback(() => setStatus(""), []);

  const handleNearEnd = useCallback((index) => {
    if (hasMore && !loadingRef.current && index >= posts.length - 4) {
      loadPage(page + 1, true);
    }
  }, [hasMore, loadPage, page, posts.length]);

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
      setError(deleteError.message || t("socialDeleteError"));
    }
  };

  return (
    <section className={`social-feed${isReels ? " social-feed--reels" : ""}`}>
      {isReels ? (
        <header className="social-reels__topbar">
          <div className="social-reels__title">
            <h1>{t("navReels")}</h1>
            <span title={t("reelsRankingInfo")}><AppIcon name="sparkle" size={15} /> {t("reelsForYou")}</span>
          </div>
          <IconButton as={Link} className="social-reels__top-action" icon="plus" to="/reels/create" label={t("reelsCreate")} title={t("reelsCreate")} />
        </header>
      ) : (
        <>
          <header className="social-feed__intro">
            <div className="social-feed__heading">
              <div>
                <p className="social-feed__eyebrow">{t("socialEyebrow")}</p>
                <h1>{t("titleSocial")}</h1>
                <p>{t("socialIntro")}</p>
              </div>
              <IconButton
                as={Link}
                className="social-feed__create-action"
                icon="plus"
                to="/social/create"
                label={t("socialCreatePost")}
                title={t("socialCreatePost")}
              />
            </div>
          </header>
        </>
      )}
      {error && <p className="social-error" role="alert">{error}</p>}
      {loadError && !isReels && (
        <div className="social-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button>
        </div>
      )}
      {loading && posts.length === 0 && (
        <Skeleton
          variant={isReels ? "reel" : "avatar-line"}
          count={isReels ? 1 : 3}
          label={t("socialLoading")}
          className={isReels ? "social-reels__skeleton" : "social-post__skeleton"}
        />
      )}
      {!loading && loadError && isReels && <div className="social-reels__load-error" role="alert">{loadError}<button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button></div>}
      {!loading && !loadError && posts.length === 0 && isReels && (
        <div className="social-reels__end social-reels__end--empty">
          <ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => loadPage(0, false)} />
        </div>
      )}
      {!loading && !loadError && posts.length === 0 && !isReels && (
        <EmptyState
          icon="social"
          title={t("socialEmptyTitle")}
          description={t("socialEmptyDescription")}
          action={{ label: t("socialWriteFirstPost"), onClick: () => navigate("/social/create") }}
        />
      )}
      <div ref={feedRef} className={isReels ? "social-feed__reels" : "social-feed__posts"}>
        {posts.map((post, index) => (
          isReels ? (
            <ReelCard
              key={post.id}
              post={post}
              index={index}
              user={user}
              isOwn={post.author_id === user?.id}
              onDelete={handleDelete}
              onLike={handleLike}
              onFollow={handleFollow}
              onView={handleView}
              onShare={handleShare}
              onCommentCreated={handleCommentCreated}
              onNearEnd={handleNearEnd}
              onEnded={handleReelEnd}
              onShareStatus={handleShareStatus}
            />
          ) : (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              isOwn={post.author_id === user?.id}
              onDelete={handleDelete}
              onLike={handleLike}
              onFollow={handleFollow}
              onView={handleView}
              onShare={handleShare}
              onCommentCreated={handleCommentCreated}
              onStatus={handleShareStatus}
            />
          )
        ))}
        {isReels && posts.length > 0 && !hasMore && !loading && (
          <div className="social-reels__end" data-reel-index={posts.length}>
            <ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => feedRef.current?.querySelector('[data-reel-index="0"]')?.scrollIntoView({ behavior: "smooth" })} />
          </div>
        )}
      </div>
      {status && <Toast key={status} variant="info" onDismiss={dismissStatus}>{status}</Toast>}
      {!isReels && hasMore && posts.length > 0 && (
        <button
          type="button"
          className="social-feed__more"
          onClick={() => loadPage(page + 1, true)}
          disabled={loading}
        >
          {loading ? t("socialLoading") : t("socialLoadMore")}
        </button>
      )}
    </section>
  );
}
