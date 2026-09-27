import { useState } from "react";
import { useLang } from "../../context/LanguageContext";

export default function PostCard({ post, isOwn, onDelete }) {
  const { lang, t } = useLang();
  const [mediaError, setMediaError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const date = new Intl.DateTimeFormat(lang === "ur" ? "ur" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(post.created_at));
  const authorName = post.author_display_name || t("socialUnknownAuthor");

  return (
    <article className="social-post">
      <header className="social-post__header">
        <span className="social-post__avatar" aria-hidden="true">
          {authorName.slice(0, 1).toUpperCase()}
        </span>
        <span className="social-post__author">{authorName}</span>
        <time className="social-post__date" dateTime={post.created_at}>{date}</time>
      </header>
      {post.body && <p className="social-post__body">{post.body}</p>}
      {post.media_url && !mediaError && (
        post.media_type === "video" ? (
          <video
            className="social-post__media"
            src={post.media_url}
            controls
            playsInline
            preload="none"
            aria-label={t("socialVideo")}
            onError={() => setMediaError(true)}
          />
        ) : (
          <img
            className="social-post__media"
            src={post.media_url}
            alt={t("socialImage")}
            loading="lazy"
            onError={() => setMediaError(true)}
          />
        )
      )}
      {post.media_url && mediaError && (
        <p className="social-post__media-error">{t("socialMediaLoadError")}</p>
      )}
      {isOwn && (
        <div className="social-post__actions">
          {confirmingDelete ? (
            <>
              <span className="social-post__confirm-text">{t("socialDeleteConfirm")}</span>
              <button
                type="button"
                className="social-post__action social-post__action--danger"
                onClick={() => onDelete(post.id)}
              >
                {t("socialDeleteYes")}
              </button>
              <button
                type="button"
                className="social-post__action"
                onClick={() => setConfirmingDelete(false)}
              >
                {t("socialDeleteNo")}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="social-post__action"
              onClick={() => setConfirmingDelete(true)}
            >
              {t("socialDeletePost")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
