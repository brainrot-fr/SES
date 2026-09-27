import { useCallback, useEffect, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";
import { createPost, fetchPosts, POSTS_PAGE_SIZE } from "./postsApi";
import "./socialFeed.css";

export default function SocialFeed() {
  const { t } = useLang();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (pageNumber, append) => {
    setLoading(true);
    setError("");
    try {
      const nextPosts = await fetchPosts(pageNumber);
      setPosts((current) => append ? [...current, ...nextPosts] : nextPosts);
      setHasMore(nextPosts.length === POSTS_PAGE_SIZE);
      setPage(pageNumber);
    } catch (loadError) {
      console.error("[SocialFeed] failed to load posts", loadError);
      setError(loadError.message || "Could not load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  const handleCreate = async (post) => {
    const created = await createPost(post);
    setPosts((current) => [created, ...current]);
  };

  return (
    <section className="social-feed">
      <header className="social-feed__intro">
        <h1>{t("titleSocial")}</h1>
        <p>{t("socialIntro")}</p>
      </header>
      <PostComposer onCreate={handleCreate} />
      {error && <p className="social-error" role="alert">{error}</p>}
      {loading && posts.length === 0 && <p className="social-feed__empty">{t("socialLoading")}</p>}
      {!loading && !error && posts.length === 0 && <p className="social-feed__empty">{t("socialEmpty")}</p>}
      <div className="social-feed__posts">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
      {hasMore && posts.length > 0 && (
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
