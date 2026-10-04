import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
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
import { Skeleton } from "../../components/shadcn/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/shadcn/empty";
import { Button } from "../../components/shadcn/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";
import { Card } from "../../components/shadcn/card";
import Split from "../../components/layout/Split";
import { ImagePlus, Plus } from "lucide-react";
import { friendlyError } from "../../lib/supabaseClient.js";
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
  const [error, setError] = useState("");
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
    setError("");
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
      setLoadError(friendlyError(loadError, t, "socialFeedFailed"));
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [isReels, prioritizedPostId, prioritizedReelId, t, user?.id]);

  useEffect(() => {
    if (!loadError) return undefined;
    const retry = () => loadPage(page, page > 0);
    window.addEventListener("online", retry, { once: true });
    return () => window.removeEventListener("online", retry);
  }, [loadError, loadPage, page]);

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
    const isNew = await recordPostShare(post.id, user.id);
    if (isNew) {
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, share_count: (item.share_count || 0) + 1 }
        : item));
    }
    return isNew;
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
    setError("");
    try {
      await deletePost(postId);
    } catch (deleteError) {
      console.error("[SocialFeed] failed to delete post", deleteError);
      setPosts(previousPosts);
      setError(friendlyError(deleteError, t, "socialDeleteError"));
    }
  };

  return (
    <section className={`social-feed${isReels ? " social-feed--reels" : ""} ${isReels ? "" : "mx-auto w-full max-w-[var(--measure-feed)] px-4 py-4 lg:max-w-6xl lg:px-0"}`}>
      {isReels ? (
        <>
          <header className="social-reels__topbar">
            <div className="social-reels__title">
              <h1>{t("navReels")}</h1>
              <span title={t("reelsRankingInfo")}><AppIcon name="sparkle" size={15} /> {t("reelsForYou")}</span>
            </div>
            <Button asChild variant="ghost" size="icon" className="social-reels__top-action" aria-label={t("reelsCreate")} title={t("reelsCreate")}><Link to="/reels/create"><Plus /></Link></Button>
          </header>
          {error && <p className="social-error" role="alert">{error}</p>}
          {loadError && <div className="social-reels__load-error" role="alert">{loadError}<button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button></div>}
          {loading && posts.length === 0 && <div className="social-reels__skeleton" role="status" aria-label={t("socialLoading")}><Skeleton className="aspect-[9/16] w-full" /></div>}
          {!loading && !loadError && posts.length === 0 && <div className="social-reels__end social-reels__end--empty"><ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => loadPage(0, false)} /></div>}
          <div ref={feedRef} className="social-feed__reels">
            {posts.map((post, index) => (
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
            {posts.length > 0 && !hasMore && !loading && <div className="social-reels__end" data-reel-index={posts.length}><ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => feedRef.current?.querySelector('[data-reel-index="0"]')?.scrollIntoView({ behavior: "smooth" })} /></div>}
          </div>
        </>
      ) : (
        <Split
          className="social-feed__split"
          rail={(
            <aside className="hidden space-y-4 lg:sticky lg:top-[calc(var(--header-height)+var(--space-4))] lg:block">
              <p className="border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">{t("socialVisibilityNotice")}</p>
              <Button asChild variant="outline" className="w-full"><Link to="/reels">{t("socialWatchReels")}</Link></Button>
            </aside>
          )}
        >
        <main className="min-w-0 w-full lg:max-w-[var(--measure-feed)]">
        <Card className="mb-3 flex-row items-center gap-3 rounded-xl border p-3 shadow-sm">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} alt="" />
            <AvatarFallback>{(getDisplayName(user) || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Button asChild variant="secondary" className="h-11 flex-1 justify-start rounded-full text-muted-foreground">
            <Link to="/social/create">{t("socialSharePrompt")}<ImagePlus className="ms-auto" /></Link>
          </Button>
        </Card>
        {error && <p className="social-error" role="alert">{error}</p>}
        {loadError && <div className="social-error" role="alert"><span>{loadError}</span><button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button></div>}
        {loading && posts.length === 0 && (
          <div className="grid gap-3" role="status" aria-label={t("socialLoading")}>
            {Array.from({ length: 3 }, (_, index) => (
              <Card key={index} className="gap-3 rounded-xl border p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="grid flex-1 gap-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                </div>
                <Skeleton className="h-28 w-full" />
                <div className="flex gap-2"><Skeleton className="h-8 w-14" /><Skeleton className="h-8 w-14" /><Skeleton className="h-8 w-14" /></div>
              </Card>
            ))}
          </div>
        )}
        {!loading && !loadError && posts.length === 0 && (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia><AppIcon name="social" size={25} /></EmptyMedia>
              <EmptyTitle>{t("socialEmptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("socialEmptyDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button type="button" variant="secondary" onClick={() => navigate("/social/create")}>{t("socialWriteFirstPost")}</Button></EmptyContent>
          </Empty>
        )}
        <div ref={feedRef} className="mt-3 flex flex-col gap-3">
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
        </div>
        {hasMore && posts.length > 0 && <Button type="button" variant="secondary" className="mx-auto mt-4 block" onClick={() => loadPage(page + 1, true)} disabled={loading}>{loading ? t("socialLoading") : t("socialLoadMore")}</Button>}
        </main>
        </Split>
      )}
    </section>
  );
}
