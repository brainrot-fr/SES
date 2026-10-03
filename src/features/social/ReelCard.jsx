import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SocialCommentsSheet from "./SocialComments";

export const REEL_MUTE_KEY = "ses-reels-muted-v1";
const DOUBLE_TAP_WINDOW_MS = 280;

export function getReelPosterUrl(post, width = 540, blurred = false) {
  const url = post?.media_url;
  if (url?.includes("/video/upload/")) {
    const blurTransform = blurred ? ",e_blur:1000" : "";
    return url
      .replace(
        "/video/upload/",
        `/video/upload/so_0,f_jpg,q_auto,w_${width}${blurTransform}/`,
      )
      .replace(/\.[a-z0-9]+$/i, ".jpg");
  }
  return width === 540 && !blurred
    ? post?.poster_url || post?.thumbnail_url || ""
    : "";
}

function splitCaption(body) {
  const hashtags = body.match(/#[\p{L}\p{N}_-]+/gu) || [];
  const caption = body
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { caption, hashtags };
}

export default function ReelCard({
  post,
  index,
  isActive = false,
  muted = true,
  onMutedChange = () => {},
  user,
  isOwn,
  onDelete,
  onLike,
  onFollow,
  onView,
  onShare,
  onCommentCreated,
  onNearEnd,
  onEnded,
  onActive = () => {},
  onShareStatus,
}) {
  const { lang, t } = useLang();
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const progressRef = useRef(null);
  const tapTimeoutRef = useRef(null);
  const lastTapRef = useRef(0);
  const [mediaError, setMediaError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [following, setFollowing] = useState(post.is_following);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [viewCount, setViewCount] = useState(post.view_count || 0);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const viewRecorded = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [likeBurst, setLikeBurst] = useState(0);
  const posterUrl = getReelPosterUrl(post);
  const ambientUrl = getReelPosterUrl(post, 32, true);
  const { caption, hashtags } = splitCaption(post.body || "");
  const authorName = post.author_display_name || t("socialUnknownAuthor");
  const authorAvatar = post.author_avatar_url || (post.author_id === user?.id ? user.user_metadata?.avatar_url : null);
  const date = new Intl.DateTimeFormat(lang === "ur" ? "ur" : "en", {
    dateStyle: "medium",
  }).format(new Date(post.created_at));

  useEffect(() => {
    setLiked(post.liked_by_me);
    setFollowing(post.is_following);
    setLikeCount(post.like_count);
    setCommentCount(post.comment_count);
    setViewCount(post.view_count || 0);
    setShareCount(post.share_count || 0);
  }, [post.is_following, post.liked_by_me, post.like_count, post.comment_count, post.view_count, post.share_count]);

  useEffect(() => {
    if (commentsOpen) videoRef.current?.pause();
  }, [commentsOpen]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => () => {
    if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const progress = progressRef.current;
    if (!video || !progress) return undefined;
    const updateProgress = () => {
      const value = video.duration ? Math.min(1, video.currentTime / video.duration) : 0;
      progress.style.setProperty("--reel-progress", String(value));
    };
    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", updateProgress);
    video.addEventListener("ended", updateProgress);
    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", updateProgress);
      video.removeEventListener("ended", updateProgress);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const card = cardRef.current;
    if (!video || !card || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.78) {
          onActive(index);
          if (index >= 0) onNearEnd(index);
          if (!viewRecorded.current) {
            viewRecorded.current = true;
            onView(post.id);
          }
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
  }, [index, onActive, onNearEnd, onView, post.id]);

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
      try {
        await onShare(post);
        setShareCount((count) => count + 1);
      } catch (shareRecordError) {
        console.error("[Reels] failed to record share", shareRecordError);
      }
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

  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current <= DOUBLE_TAP_WINDOW_MS) {
      lastTapRef.current = 0;
      if (tapTimeoutRef.current) window.clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
      setLikeBurst((current) => current + 1);
      if (!liked && !likeBusy) handleLike();
      return;
    }

    lastTapRef.current = now;
    tapTimeoutRef.current = window.setTimeout(() => {
      tapTimeoutRef.current = null;
      togglePlayback();
    }, DOUBLE_TAP_WINDOW_MS);
  };

  const updateCommentCount = (postId, body, delta = 1) => {
    const change = body === null ? -1 : delta;
    setCommentCount((count) => Math.max(0, count + change));
    onCommentCreated(postId, body, change);
  };

  const toggleFollow = async () => {
    if (followBusy) return;
    const nextFollowing = !following;
    setFollowing(nextFollowing);
    setFollowBusy(true);
    try {
      await onFollow(post, nextFollowing);
    } catch (followError) {
      setFollowing(!nextFollowing);
      onShareStatus(followError.message || t("socialFollowError"));
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <article ref={cardRef} className="social-reel" data-reel-index={index} data-active={isActive || undefined}>
      {isActive && ambientUrl && <img className="social-reel__ambient" src={ambientUrl} alt="" aria-hidden="true" />}
      <div className="social-reel__frame">
        {!mediaError ? (
          <video
            ref={videoRef}
            className="social-reel__video"
            src={post.media_url}
            poster={isActive ? posterUrl || undefined : undefined}
            playsInline
            muted={muted}
            loop={false}
            preload={isActive ? "metadata" : "none"}
            aria-label={`${t("socialVideo")} — ${authorName}`}
            onClick={handleVideoTap}
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
          onClick={handleVideoTap}
          aria-label={playing ? t("reelsPause") : t("reelsPlay")}
        >
          <AppIcon name={playing ? "pause" : "play"} size={34} filled />
        </button>
        <div className="social-reel__shade" />
        <div ref={progressRef} className="social-reel__progress" aria-hidden="true">
          <span className="social-reel__progress-bar" />
        </div>
        {likeBurst > 0 && (
          <span key={likeBurst} className="social-reel__like-burst" aria-hidden="true">
            <AppIcon name="heart" size={76} filled />
          </span>
        )}
        <div className="social-reel__caption">
          <div className="social-reel__author">
            {authorAvatar
              ? <img className="social-post__avatar social-post__avatar--image" src={authorAvatar} alt="" />
              : <span className="social-post__avatar" aria-hidden="true">{authorName.slice(0, 1).toUpperCase()}</span>}
            <span className="social-reel__author-copy">
              <span className="social-reel__author-name">{authorName}</span>
              <time dateTime={post.created_at}>{date}</time>
            </span>
            {!isOwn && <button type="button" className="social-reel__follow" onClick={toggleFollow} disabled={followBusy} aria-pressed={following}>{following ? t("socialUnfollow") : t("socialFollow")}</button>}
          </div>
          {caption && <p className="social-reel__body">{caption}</p>}
          {hashtags.length > 0 && (
            <div className="social-reel__tags">
              {hashtags.map((tag, tagIndex) => (
                <span className="social-reel__hashtag" key={`${tag}-${tagIndex}`}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        {isOwn && (
          <div className="social-reel__manage">
            <button type="button" onClick={() => setDeleteDialogOpen(true)} aria-label={t("socialDeletePost")}><AppIcon name="more" /></button>
          </div>
        )}
      </div>
      <aside className="social-reel__actions" aria-label={t("reelsActions")}>
        <button type="button" className={`social-reel__action${liked ? " social-reel__action--liked" : ""}`} onClick={handleLike} disabled={likeBusy} aria-label={`${liked ? t("reelsUnlike") : t("reelsLike")} · ${likeCount}`} aria-pressed={liked}>
          <span className="social-reel__action-icon"><AppIcon name="heart" size={25} filled={liked} /></span>
          <span>
            {!liked && `${t("reelsLike")} · `}
            {new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(likeCount)}
          </span>
        </button>
        <button type="button" className="social-reel__action" onClick={() => setCommentsOpen(true)} aria-label={`${t("reelsComments")} · ${commentCount}`}>
          <span className="social-reel__action-icon"><AppIcon name="comment" size={24} /></span>
          <span>{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(commentCount)}</span>
        </button>
        <button type="button" className="social-reel__action" onClick={handleShare} aria-label={t("reelsShare")}>
          <span className="social-reel__action-icon"><AppIcon name="share" size={24} /></span>
          <span>{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(shareCount)}</span>
        </button>
        <span className="social-reel__views" aria-label={`${t("socialViews")} ${viewCount}`}>{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(viewCount)} {t("socialViewsShort")}</span>
        <button type="button" className="social-reel__action" onClick={() => {
          onMutedChange((current) => !current);
        }} aria-label={muted ? t("reelsUnmute") : t("reelsMute")} aria-pressed={!muted}>
          <span className="social-reel__action-icon"><AppIcon name={muted ? "volumeOff" : "volume"} size={23} /></span>
          <span>{muted ? t("reelsSoundOff") : t("reelsSoundOn")}</span>
        </button>
      </aside>
      <Modal
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        labelledBy={`reel-delete-title-${post.id}`}
        className="ui-auth-dialog"
      >
        <h2 className="ui-dialog-title" id={`reel-delete-title-${post.id}`}>{t("socialDeleteConfirm")}</h2>
        <div className="ui-dialog-actions">
          <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>{t("socialDeleteNo")}</Button>
          <Button type="button" variant="danger" onClick={() => {
            setDeleteDialogOpen(false);
            onDelete(post.id);
          }}>{t("socialDeleteYes")}</Button>
        </div>
      </Modal>
      {commentsOpen && (
        <SocialCommentsSheet
          post={post}
          user={user}
          onClose={closeComments}
          onCommentCreated={updateCommentCount}
        />
      )}
    </article>
  );
}
