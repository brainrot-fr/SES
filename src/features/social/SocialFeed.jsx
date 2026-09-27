import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";
import ReelCard from "./ReelCard";
import AppIcon from "../../components/icons/AppIcon";
import { createPost, deletePost, fetchPosts, fetchReels, POSTS_PAGE_SIZE, setReelLike } from "./postsApi";
import { readReelPreferences, recordReelPreference } from "./reelRanking";
import ReelEndCard from "./ReelEndCard";
import "./socialFeed.css";

export default function SocialFeed({ mode = "posts", onShareStatus }) {
  const { t } = useLang();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isReels = mode === "reels";
  const prioritizedReelId = isReels ? new URLSearchParams(location.search).get("reel") : null;
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
  const [status, setStatus] = useState("");

  const loadPage = useCallback(async (pageNumber, append) => {
    if (loadingRef.current || (append && !hasMoreRef.current)) return;
    loadingRef.current = true;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");
    try {
      const nextPosts = isReels
        ? await fetchReels(pageNumber, user?.id, readReelPreferences(user?.id), pageNumber === 0 ? prioritizedReelId : null)
        : await fetchPosts(pageNumber);
      if (requestId !== requestIdRef.current) return;
      setPosts((current) => append ? [...current, ...nextPosts] : nextPosts);
      const nextHasMore = nextPosts.length === POSTS_PAGE_SIZE;
      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);
      setPage(pageNumber);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      console.error("[SocialFeed] failed to load posts", loadError);
      setError(loadError.message || "Could not load posts.");
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [isReels, prioritizedReelId, user?.id]);

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

  const handleCreate = async (post) => {
    const created = await createPost(post);
    setPosts((current) => [created, ...current]);
  };

  const handleLike = async (post) => {
    const liked = !post.liked_by_me;
    await setReelLike(post.id, user.id, liked);
    setPosts((current) => current.map((item) => item.id === post.id
      ? { ...item, liked_by_me: liked, like_count: Math.max(0, item.like_count + (liked ? 1 : -1)) }
      : item));
    recordReelPreference(user.id, post.body, liked ? 1 : -1);
  };

  const handleCommentCreated = useCallback((postId, body, delta = 1) => {
    if (body && delta > 0) recordReelPreference(user.id, body, 0.5);
    setPosts((current) => current.map((post) => post.id === postId
      ? { ...post, comment_count: Math.max(0, post.comment_count + delta) }
      : post));
  }, [user.id]);

  const handleShareStatus = (message) => {
    setStatus(message);
    onShareStatus?.(message);
    window.setTimeout(() => setStatus(""), 3000);
  };

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
          <button type="button" className="social-reels__top-action" onClick={() => navigate("/social")} aria-label={t("goBack")}>
            <AppIcon name="back" />
          </button>
          <div className="social-reels__title">
            <h1>{t("navReels")}</h1>
            <span title={t("reelsRankingInfo")}><AppIcon name="sparkle" size={15} /> {t("reelsForYou")}</span>
          </div>
          <Link className="social-reels__top-action" to="/reels/create" aria-label={t("reelsCreate")} title={t("reelsCreate")}>
            <AppIcon name="plus" />
          </Link>
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
            </div>
          </header>
          <nav className="social-feed__tabs" aria-label={t("socialViewLabel")}>
            <Link to="/social" className="social-feed__tab social-feed__tab--active" aria-current="page">{t("socialPostsTab")}</Link>
            <Link to="/reels" className="social-feed__tab">{t("navReels")}</Link>
          </nav>
        </>
      )}
      {!isReels && <PostComposer onCreate={handleCreate} />}
      {error && <p className="social-error" role="alert">{error}</p>}
      {loading && posts.length === 0 && <p className="social-feed__empty">{t("socialLoading")}</p>}
      {!loading && error && isReels && <div className="social-reels__load-error" role="alert">{error}<button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button></div>}
      {!loading && !error && posts.length === 0 && isReels && (
        <div className="social-reels__end social-reels__end--empty">
          <ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => loadPage(0, false)} />
        </div>
      )}
      {!loading && !error && posts.length === 0 && !isReels && <p className="social-feed__empty">{t("socialEmpty")}</p>}
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
              onCommentCreated={handleCommentCreated}
              onNearEnd={handleNearEnd}
              onEnded={handleReelEnd}
              onShareStatus={handleShareStatus}
            />
          ) : (
            <PostCard
              key={post.id}
              post={post}
              isOwn={post.author_id === user?.id}
              onDelete={handleDelete}
            />
          )
        ))}
        {isReels && posts.length > 0 && !hasMore && !loading && (
          <div className="social-reels__end" data-reel-index={posts.length}>
            <ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => feedRef.current?.querySelector('[data-reel-index="0"]')?.scrollIntoView({ behavior: "smooth" })} />
          </div>
        )}
      </div>
      {status && <div className="social-reels__status" role="status" aria-live="polite">{status}</div>}
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
