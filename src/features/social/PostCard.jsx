import { useLang } from "../../context/LanguageContext";

export default function PostCard({ post }) {
  const { lang, t } = useLang();
  const date = new Intl.DateTimeFormat(lang === "ur" ? "ur" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(post.created_at));

  return (
    <article className="social-post">
      <header className="social-post__header">
        <span className="social-post__avatar" aria-hidden="true">
          {(post.author_display_name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="social-post__author">{post.author_display_name}</span>
        <time className="social-post__date" dateTime={post.created_at}>{date}</time>
      </header>
      {post.body && <p className="social-post__body">{post.body}</p>}
      {post.media_url && post.media_type === "video" ? (
        <video className="social-post__media" src={post.media_url} controls playsInline aria-label={t("socialVideo")} />
      ) : post.media_url ? (
        <img className="social-post__media" src={post.media_url} alt={t("socialImage")} loading="lazy" />
      ) : null}
    </article>
  );
}
