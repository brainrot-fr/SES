import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/shadcn/button";
import { getDisplayName } from "../auth/authSession";
import PostCard from "./PostCard";
import ReelCard, { getReelPosterUrl, REEL_MUTE_KEY } from "./ReelCard";
import AppIcon from "../../components/icons/AppIcon";
import {
  deletePost,
  fetchPosts,
  fetchReels,
  recordPostShare,
  recordPostView,
  reportPost,
  setFollow,
  setPostLike,
} from "./postsApi";
import { readReelPreferences, recordReelPreference } from "./reelRanking";
import ReelEndCard from "./ReelEndCard";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/shadcn/empty";
import { Skeleton } from "@/components/shadcn/skeleton";
import IconButton from "../../components/ui/IconButton";
import RowList from "../../components/layout/RowList";
import Row from "../../components/layout/Row";
import "./socialFeed.css";

export default function SocialFeed({ mode = "posts" }) {
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
  const [loadError, setLoadError] = useState("");
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
    setLoadError("");
    try {
      const pageResult = isReels
        ? await fetchReels(pageNumber, user?.id, readReelPreferences(user?.id), prioritizedReelId)
        : await fetchPosts(pageNumber, undefined, prioritizedPostId);
      if (requestId !== requestIdRef.current) return;
      const { posts: nextPosts, hasMore: nextHasMore } = pageResult;
      setPosts((current) => append ? [...current, ...nextPosts] : nextPosts);
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

  const nextPosterUrl = isReels ? getReelPosterUrl(posts[activeReelIndex + 1]) : "";

  useEffect(() => {
    loadingRef.current = false;
    hasMoreRef.current = true;
    setPosts([]);
    if (isReels) setActiveReelIndex(0);
    setPage(0);
    setHasMore(true);
    loadPage(0, false);
    return () => {
      requestIdRef.current += 1;
      loadingRef.current = false;
    };
  }, [loadPage]);

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
    await recordPostShare(post.id, user.id);
    setPosts((current) => current.map((item) => item.id === post.id
      ? { ...item, share_count: (item.share_count || 0) + 1 }
      : item));
  }, [user?.id]);

  const handleReport = useCallback((postId, reason) => reportPost(postId, user.id, reason), [user?.id]);

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

  const handleActiveReel = useCallback((index) => {
    setActiveReelIndex(index);
  }, []);

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
    try {
      await deletePost(postId);
    } catch (deleteError) {
      console.error("[SocialFeed] failed to delete post", deleteError);
      setPosts(previousPosts);
      toast(deleteError.message || t("socialDeleteError"));
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
        <Row
          as={Link}
          to="/social/create"
          className="social-feed__compose-link"
          leading={user?.user_metadata?.avatar_url
            ? <img className="social-feed__compose-avatar" src={user.user_metadata.avatar_url} alt="" />
            : <span className="social-feed__compose-avatar social-feed__compose-avatar--initial" aria-hidden="true">{(getDisplayName(user) || "?").slice(0, 1).toUpperCase()}</span>}
          content={<span>{t("socialSharePrompt")}</span>}
          trailing={<AppIcon name="plus" size={20} />}
        />
      )}
      {loadError && !isReels && (
        <div className="social-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button>
        </div>
      )}
      {loading && posts.length === 0 && (
        isReels ? (
          <Skeleton
            role="status"
            aria-label={t("socialLoading")}
            className="social-reels__skeleton mx-auto h-[78dvh] w-full max-w-[26rem] bg-muted"
          />
        ) : (
          <div className="social-post__skeleton grid" role="status" aria-label={t("socialLoading")}>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex gap-3 border-b border-hairline px-4 py-4">
                <Skeleton className="size-11 shrink-0 rounded-full bg-muted" />
                <div className="grid flex-1 gap-3 py-1">
                  <Skeleton className="h-4 w-2/5 bg-muted" />
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {!loading && loadError && isReels && <div className="social-reels__load-error" role="alert">{loadError}<button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button></div>}
      {!loading && !loadError && posts.length === 0 && isReels && (
        <div className="social-reels__end social-reels__end--empty">
          <ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => loadPage(0, false)} />
        </div>
      )}
      {!loading && !loadError && posts.length === 0 && !isReels && (
        <Empty className="gap-3 rounded-none border-0 p-5 md:p-6">
          <EmptyHeader>
            <EmptyMedia><AppIcon name="social" size={25} /></EmptyMedia>
            <EmptyTitle>{t("socialEmptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("socialEmptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="secondary" onClick={() => navigate("/social/create")}>
            {t("socialWriteFirstPost")}
          </Button>
        </Empty>
      )}
      <div ref={feedRef} className={isReels ? "social-feed__reels" : "social-feed__posts"}>
        {!isReels && (
          <RowList className="social-feed__row-list">
            {posts.map((post) => (
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
              onReport={handleReport}
            />
            ))}
          </RowList>
        )}
        {isReels && posts.map((post, index) => (
          <ReelCard
            key={post.id}
            post={post}
            index={index}
            isActive={index === activeReelIndex}
            muted={reelMuted}
            onMutedChange={setReelMuted}
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
            onActive={handleActiveReel}
            onReport={handleReport}
          />
        ))}
        {isReels && posts.length > 0 && !hasMore && !loading && (
          <div className="social-reels__end" data-reel-index={posts.length}>
            <ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => feedRef.current?.querySelector('[data-reel-index="0"]')?.scrollIntoView({ behavior: "smooth" })} />
          </div>
        )}
      </div>

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
