import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import {
  createReelComment,
  deletePostComment,
  fetchReelComments,
} from "./postsApi";

function CommentsSheet({ post, user, onClose, onCommentCreated }) {
  const { lang, t } = useLang();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const previouslyFocused = document.activeElement;
    fetchReelComments(post.id)
      .then((result) => {
        if (!cancelled) setComments(result);
      })
      .catch((loadError) => {
        console.error("[Reels] failed to load comments", loadError);
        if (!cancelled) setError(loadError.message || t("reelsCommentsError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = sheetRef.current?.querySelectorAll("button:not(:disabled), input:not(:disabled)");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [post.id, onClose, t]);

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await createReelComment({ postId: post.id, body, user });
      setComments((current) => [...current, created]);
      setBody("");
      onCommentCreated(post.id, created.body);
    } catch (submitError) {
      console.error("[Reels] failed to create comment", submitError);
      setError(submitError.message || t("reelsCommentFailed"));
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await deletePostComment(commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
      onCommentCreated(post.id, null, -1);
    } catch (deleteError) {
      console.error("[Reels] failed to delete comment", deleteError);
      setError(deleteError.message || t("socialDeleteError"));
    }
  };

  return (
    <div className="reel-comments-backdrop">
      <button type="button" className="reel-comments-dismiss" aria-label={t("reelsCloseComments")} onClick={onClose} />
      <section ref={sheetRef} className="reel-comments" role="dialog" aria-modal="true" aria-labelledby="reel-comments-title">
        <header className="reel-comments__header">
          <div>
            <h2 id="reel-comments-title">{t("reelsComments")}</h2>
            <span>{new Intl.NumberFormat(lang === "ur" ? "ur" : "en").format(comments.length)}</span>
          </div>
          <button type="button" className="reel-comments__close" onClick={onClose} aria-label={t("reelsCloseComments")}>
            <AppIcon name="close" />
          </button>
        </header>
        <div className="reel-comments__list" aria-live="polite">
          {loading && <p className="reel-comments__empty">{t("socialLoading")}</p>}
          {!loading && !comments.length && <p className="reel-comments__empty">{t("reelsFirstComment")}</p>}
          {comments.map((comment) => (
            <article key={comment.id} className="reel-comment">
              <span className="reel-comment__avatar" aria-hidden="true">{comment.author_display_name.slice(0, 1).toUpperCase()}</span>
              <div className="reel-comment__copy">
                <strong>{comment.author_display_name}</strong>
                <p>{comment.body}</p>
              </div>
              {comment.author_id === user.id && (
                <button type="button" className="reel-comment__delete" onClick={() => removeComment(comment.id)} aria-label={t("socialDeletePost")}>
                  <AppIcon name="close" size={17} />
                </button>
              )}
            </article>
          ))}
        </div>
        {error && <p className="reel-comments__error" role="alert">{error}</p>}
        <form className="reel-comments__form" onSubmit={submit}>
          <label className="sr-only" htmlFor={`reel-comment-${post.id}`}>{t("reelsCommentLabel")}</label>
          <input
            ref={inputRef}
            id={`reel-comment-${post.id}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("reelsCommentPlaceholder")}
            maxLength={1000}
            disabled={busy}
          />
          <button type="submit" disabled={!body.trim() || busy}>{busy ? t("socialPosting") : t("reelsSendComment")}</button>
        </form>
      </section>
    </div>
  );
}

export default function ReelCard({
  post,
  index,
  user,
  isOwn,
  onDelete,
  onLike,
  onCommentCreated,
  onNearEnd,
  onEnded,
  onShareStatus,
}) {
  const { lang, t } = useLang();
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [mediaError, setMediaError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const authorName = post.author_display_name || t("socialUnknownAuthor");
  const date = new Intl.DateTimeFormat(lang === "ur" ? "ur" : "en", {
    dateStyle: "medium",
  }).format(new Date(post.created_at));

  useEffect(() => {
    setLiked(post.liked_by_me);
    setLikeCount(post.like_count);
    setCommentCount(post.comment_count);
  }, [post.liked_by_me, post.like_count, post.comment_count]);

  useEffect(() => {
    if (commentsOpen) videoRef.current?.pause();
  }, [commentsOpen]);

  useEffect(() => {
    const video = videoRef.current;
    const card = cardRef.current;
    if (!video || !card || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.78) {
          if (index >= 0) onNearEnd(index);
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (reducedMotion) return;
          video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else {
          video.pause();
          setPlaying(false);
        }
      },
      { threshold: [0, 0.78, 1] },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [index, onNearEnd]);

  const closeComments = useCallback(() => setCommentsOpen(false), []);

  const handleLike = async () => {
    if (likeBusy) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    setLikeBusy(true);
    try {
      await onLike(post);
    } catch (likeError) {
      console.error("[Reels] failed to update like", likeError);
      setLiked(!nextLiked);
      setLikeCount((count) => Math.max(0, count + (nextLiked ? -1 : 1)));
      onShareStatus(likeError.message || t("reelsLikeError"));
    } finally {
      setLikeBusy(false);
    }
  };

  const handleShare = async () => {
    const shareData = { title: authorName, text: post.body || t("reelsShareText"), url: `${window.location.origin}${window.location.pathname}#/reels?reel=${post.id}` };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        onShareStatus(t("reelsShareSuccess"));
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        onShareStatus(t("reelsLinkCopied"));
      }
      else throw new Error(t("reelsShareError"));
    } catch (shareError) {
      if (shareError.name !== "AbortError") {
        console.error("[Reels] failed to share", shareError);
        onShareStatus(shareError.message || t("reelsShareError"));
      }
    }
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().then(() => setPlaying(true)).catch((playError) => {
      console.error("[Reels] playback could not start", playError);
      onShareStatus(t("reelsPlaybackError"));
    });
    else {
      video.pause();
      setPlaying(false);
    }
  };

  const updateCommentCount = (postId, body, delta = 1) => {
    const change = body === null ? -1 : delta;
    setCommentCount((count) => Math.max(0, count + change));
    onCommentCreated(postId, body, change);
  };

  return (
    <article ref={cardRef} className="social-reel" data-reel-index={index}>
      <div className="social-reel__frame">
        {!mediaError ? (
          <video
            ref={videoRef}
            className="social-reel__video"
            src={post.media_url}
            playsInline
            muted={muted}
            loop={false}
            preload="none"
            aria-label={`${t("socialVideo")} — ${authorName}`}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => onEnded(index)}
            onError={() => setMediaError(true)}
          />
        ) : (
          <p className="social-post__media-error">{t("socialMediaLoadError")}</p>
        )}
        <button
          type="button"
          className={`social-reel__play-toggle${playing ? " social-reel__play-toggle--playing" : ""}`}
          onClick={togglePlayback}
          aria-label={playing ? t("reelsPause") : t("reelsPlay")}
        >
          <AppIcon name={playing ? "pause" : "play"} size={34} filled />
        </button>
        <div className="social-reel__shade" />
        <div className="social-reel__caption">
          <div className="social-reel__author">
            <span className="social-post__avatar" aria-hidden="true">{authorName.slice(0, 1).toUpperCase()}</span>
            <span className="social-reel__author-copy">
              <span className="social-reel__author-name">{authorName}</span>
              <time dateTime={post.created_at}>{date}</time>
            </span>
          </div>
          {post.body && <p className="social-reel__body">{post.body}</p>}
          <span className="social-reel__community-note"><AppIcon name="sparkle" size={15} /> {t("reelsCommunityNote")}</span>
        </div>
        <aside className="social-reel__actions" aria-label={t("reelsActions")}>
          <button type="button" className={`social-reel__action${liked ? " social-reel__action--liked" : ""}`} onClick={handleLike} disabled={likeBusy} aria-label={`${liked ? t("reelsUnlike") : t("reelsLike")} · ${likeCount}`} aria-pressed={liked}>
            <span className="social-reel__action-icon"><AppIcon name="heart" size={25} filled={liked} /></span>
            <span>{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(likeCount)}</span>
          </button>
          <button type="button" className="social-reel__action" onClick={() => setCommentsOpen(true)} aria-label={`${t("reelsComments")} · ${commentCount}`}>
            <span className="social-reel__action-icon"><AppIcon name="comment" size={24} /></span>
            <span>{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(commentCount)}</span>
          </button>
          <button type="button" className="social-reel__action" onClick={handleShare} aria-label={t("reelsShare")}>
            <span className="social-reel__action-icon"><AppIcon name="share" size={24} /></span>
            <span>{t("reelsShare")}</span>
          </button>
          <button type="button" className="social-reel__action" onClick={() => {
            setMuted((current) => {
              if (videoRef.current) videoRef.current.muted = !current;
              return !current;
            });
          }} aria-label={muted ? t("reelsUnmute") : t("reelsMute")} aria-pressed={!muted}>
            <span className="social-reel__action-icon"><AppIcon name={muted ? "volumeOff" : "volume"} size={23} /></span>
            <span>{muted ? t("reelsSoundOff") : t("reelsSoundOn")}</span>
          </button>
        </aside>
        {isOwn && (
          <div className="social-reel__manage">
            {confirmingDelete ? (
              <>
                <span>{t("socialDeleteConfirm")}</span>
                <button type="button" onClick={() => onDelete(post.id)}>{t("socialDeleteYes")}</button>
                <button type="button" onClick={() => setConfirmingDelete(false)}>{t("socialDeleteNo")}</button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} aria-label={t("socialDeletePost")}><AppIcon name="more" /></button>
            )}
          </div>
        )}
      </div>
      {commentsOpen && (
        <CommentsSheet
          post={post}
          user={user}
          onClose={closeComments}
          onCommentCreated={updateCommentCount}
        />
      )}
    </article>
  );
}
