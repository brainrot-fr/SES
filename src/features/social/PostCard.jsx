import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SocialCommentsSheet from "./SocialComments";
import { friendlyError } from "../../lib/supabaseClient.js";

export function usePostActions(post, {
  onLike,
  onFollow,
  onShare,
  onCommentCreated,
  onStatus,
  likeErrorKey,
  followErrorKey,
}) {
  const { t } = useLang();
  const [likeBusy, setLikeBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [following, setFollowing] = useState(post.is_following);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [viewCount, setViewCount] = useState(post.view_count || 0);
  const [shareCount, setShareCount] = useState(post.share_count || 0);

  useEffect(() => {
    setLiked(post.liked_by_me);
    setFollowing(post.is_following);
    setLikeCount(post.like_count || 0);
    setCommentCount(post.comment_count || 0);
    setViewCount(post.view_count || 0);
    setShareCount(post.share_count || 0);
  }, [post.is_following, post.liked_by_me, post.like_count, post.comment_count, post.view_count, post.share_count]);

  const toggleLike = async () => {
    if (likeBusy) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    setLikeBusy(true);
    try {
      await onLike(post);
    } catch (error) {
      setLiked(!nextLiked);
      setLikeCount((count) => Math.max(0, count + (nextLiked ? -1 : 1)));
      onStatus(friendlyError(error, t, likeErrorKey));
    } finally {
      setLikeBusy(false);
    }
  };

  const toggleFollow = async () => {
    if (followBusy) return;
    const nextFollowing = !following;
    setFollowing(nextFollowing);
    setFollowBusy(true);
    try {
      await onFollow(post, nextFollowing);
    } catch (error) {
      setFollowing(!nextFollowing);
      onStatus(friendlyError(error, t, followErrorKey));
    } finally {
      setFollowBusy(false);
    }
  };

  const share = async ({ url, title, text, successMessage, copiedMessage, errorMessage, errorMessageKey }) => {
    try {
      let message;
      if (navigator.share) {
        await navigator.share({ title, text, url });
        message = successMessage;
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        message = copiedMessage;
      } else {
        throw new Error(errorMessage);
      }
      try {
        const isNew = await onShare(post);
        if (isNew) setShareCount((count) => count + 1);
      } catch (shareError) {
        console.error("[Social] failed to record share", shareError);
      }
      onStatus(message);
    } catch (error) {
      if (error.name !== "AbortError") onStatus(friendlyError(error, t, errorMessageKey));
    }
  };

  const updateCommentCount = (postId, body, delta = 1) => {
    const change = body === null ? -1 : delta;
    setCommentCount((count) => Math.max(0, count + change));
    onCommentCreated(postId, body, change);
  };

  return {
    liked,
    following,
    likeBusy,
    followBusy,
    likeCount,
    commentCount,
    viewCount,
    shareCount,
    toggleLike,
    toggleFollow,
    share,
    updateCommentCount,
  };
}

export default function PostCard({
  post,
  user,
  isOwn,
  onDelete,
  onLike,
  onFollow,
  onView,
  onShare,
  onCommentCreated,
  onStatus,
  onReport,
}) {
  const { lang, t } = useLang();
  const cardRef = useRef(null);
  const viewRecorded = useRef(false);
  const [mediaError, setMediaError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const actions = usePostActions(post, {
    onLike,
    onFollow,
    onShare,
    onCommentCreated,
    onStatus: (message) => onStatus(message || t("socialLikeError")),
    likeErrorKey: "socialLikeError",
    followErrorKey: "socialFollowError",
  });
  const { likeBusy, followBusy, liked, following, likeCount, commentCount, viewCount, shareCount } = actions;
  const createdAt = new Date(post.created_at);
  const absoluteDate = new Intl.DateTimeFormat(lang === "ur" ? "ur" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt);
  const elapsedSeconds = Math.max(0, (Date.now() - createdAt.getTime()) / 1000);
  const relativeUnit = elapsedSeconds < 60 ? ["second", 1]
    : elapsedSeconds < 3600 ? ["minute", 60]
      : elapsedSeconds < 86400 ? ["hour", 3600]
        : elapsedSeconds < 2592000 ? ["day", 86400]
          : elapsedSeconds < 31536000 ? ["month", 2592000] : ["year", 31536000];
  const date = new Intl.RelativeTimeFormat(lang === "ur" ? "ur" : "en", { numeric: "auto" })
    .format(-Math.floor(elapsedSeconds / relativeUnit[1]), relativeUnit[0]);
  const authorName = post.author_display_name || t("socialUnknownAuthor");
  const authorAvatar = post.author_avatar_url || (post.author_id === user?.id ? user.user_metadata?.avatar_url : null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !viewRecorded.current) {
        viewRecorded.current = true;
        onView(post.id);
      }
    }, { threshold: [0, 0.5, 1] });
    observer.observe(card);
    return () => observer.disconnect();
  }, [onView, post.id]);

  const share = () => {
    const url = `${window.location.origin}${window.location.pathname}#/social?post=${post.id}`;
    actions.share({
      url,
      title: authorName,
      text: post.body || t("socialShareText"),
      successMessage: t("socialShareSuccess"),
      copiedMessage: t("socialLinkCopied"),
      errorMessage: t("socialShareError"),
      errorMessageKey: "socialShareError",
    });
  };

  const submitReport = async () => {
    setReportBusy(true);
    try {
      await onReport(post.id, reportReason);
      setReportDialogOpen(false);
      onStatus(t("socialReportSuccess"));
    } catch (error) {
      onStatus(friendlyError(error, t, "socialReportError"));
    } finally {
      setReportBusy(false);
    }
  };

  return (
    <article ref={cardRef} className="social-post">
      <header className="social-post__header">
        {authorAvatar ? (
          <img className="social-post__avatar social-post__avatar--image" src={authorAvatar} alt="" loading="lazy" />
        ) : (
          <span className="social-post__avatar" aria-hidden="true">{authorName.slice(0, 1).toUpperCase()}</span>
        )}
        <span className="social-post__identity">
          <span className="social-post__author">{authorName}</span>
        {!isOwn && (
          <button type="button" className="social-post__action" disabled={followBusy} onClick={actions.toggleFollow} aria-pressed={following}>
            {following ? t("socialUnfollow") : t("socialFollow")}
          </button>
        )}
        </span>
        <time className="social-post__date" dateTime={post.created_at} title={absoluteDate}>{date}</time>
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
      {post.media_url && mediaError && <p className="social-post__media-error">{t("socialMediaLoadError")}</p>}
      <div className="social-post__actions">
          <button type="button" className={`social-post__action${liked ? " social-post__action--liked" : ""}`} onClick={actions.toggleLike} disabled={likeBusy} aria-pressed={liked} aria-label={`${liked ? t("socialUnlike") : t("socialLike")} · ${likeCount}`}>
        <AppIcon name="heart" size={17} /> {new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(likeCount)}
        </button>
        <button type="button" className="social-post__action" onClick={() => setCommentsOpen(true)}>
        <AppIcon name="comment" size={17} /> {new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(commentCount)}
        </button>
          <button type="button" className="social-post__action" onClick={share}>
        <AppIcon name="share" size={17} /> {new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(shareCount)}
        </button>
        <span className="social-post__views" aria-label={`${t("socialViews")} ${viewCount}`}>
          {new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(viewCount)} {t("socialViewsShort")}
        </span>
        {isOwn && (
          <button type="button" className="social-post__action" onClick={() => setDeleteDialogOpen(true)}>{t("socialDeletePost")}</button>
        )}
        {!isOwn && <button type="button" className="social-post__action" onClick={() => setReportDialogOpen(true)}>{t("socialReport")}</button>}
      </div>
      <Modal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        labelledBy={`social-delete-title-${post.id}`}
        className="ui-auth-dialog"
      >
        <h2 className="ui-dialog-title" id={`social-delete-title-${post.id}`}>{t("socialDeleteConfirm")}</h2>
        <div className="ui-dialog-actions">
          <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>{t("socialDeleteNo")}</Button>
          <Button type="button" variant="danger" onClick={() => {
            setDeleteDialogOpen(false);
            onDelete(post.id);
          }}>{t("socialDeleteYes")}</Button>
        </div>
      </Modal>
      <Modal
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        labelledBy={`social-report-title-${post.id}`}
        className="ui-auth-dialog"
      >
        <h2 className="ui-dialog-title" id={`social-report-title-${post.id}`}>{t("socialReportTitle")}</h2>
        <fieldset className="social-report__reasons">
          <legend>{t("socialReportReason")}</legend>
          {[["spam", "socialReportSpam"], ["harassment", "socialReportHarassment"], ["inappropriate", "socialReportInappropriate"]].map(([reason, label]) => (
            <label key={reason}>
              <input type="radio" name={`social-report-${post.id}`} value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} />
              {t(label)}
            </label>
          ))}
        </fieldset>
        <div className="ui-dialog-actions">
          <Button type="button" variant="secondary" onClick={() => setReportDialogOpen(false)}>{t("socialDeleteNo")}</Button>
          <Button type="button" busy={reportBusy} disabled={!reportReason} onClick={submitReport}>{t("socialReportSubmit")}</Button>
        </div>
      </Modal>
      {commentsOpen && (
        <SocialCommentsSheet
          post={post}
          user={user}
          onClose={() => setCommentsOpen(false)}
          onCommentCreated={actions.updateCommentCount}
        />
      )}
    </article>
  );
}
