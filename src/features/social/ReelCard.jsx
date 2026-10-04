import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import SocialCommentsSheet from "./SocialComments";
import { DeleteDialog, ReportDialog, usePostActions } from "./PostCard";
import { getReelPosterUrl, splitCaption } from "./reelRanking";
import { Badge } from "../../components/shadcn/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";

export { getReelPosterUrl, splitCaption };

export const REEL_MUTE_KEY = "ses-reels-muted-v1";
const DOUBLE_TAP_WINDOW_MS = 280;

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
  onReport,
}) {
  const { lang, t } = useLang();
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const progressRef = useRef(null);
  const tapTimeoutRef = useRef(null);
  const lastTapRef = useRef(0);
  const [mediaError, setMediaError] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const actions = usePostActions(post, {
    onLike,
    onFollow,
    onShare,
    onCommentCreated,
    likeErrorKey: "reelsLikeError",
    followErrorKey: "socialFollowError",
  });
  const { likeBusy, followBusy, liked, following, likeCount, commentCount, viewCount, shareCount } = actions;
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

  const handleLike = actions.toggleLike;

  const handleShare = () => {
    actions.share({
      title: authorName,
      text: post.body || t("reelsShareText"),
      url: `${window.location.origin}${window.location.pathname}#/reels?reel=${post.id}`,
      successMessage: t("reelsShareSuccess"),
      copiedMessage: t("reelsLinkCopied"),
      errorMessage: t("reelsShareError"),
      errorMessageKey: "reelsShareError",
    });
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().then(() => setPlaying(true)).catch((playError) => {
      console.error("[Reels] playback could not start", playError);
      toast(t("reelsPlaybackError"));
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
          <p className="text-center text-sm text-muted-foreground">{t("socialMediaLoadError")}</p>
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
            <Avatar size="lg" className="border border-white/70 bg-primary text-foreground">
              <AvatarImage src={authorAvatar || undefined} alt="" />
              <AvatarFallback>{authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="social-reel__author-copy">
              <span className="social-reel__author-name">{authorName}</span>
              <time dateTime={post.created_at}>{date}</time>
            </span>
            {!isOwn && <button type="button" className="social-reel__follow" onClick={actions.toggleFollow} disabled={followBusy} aria-pressed={following}>{following ? t("socialUnfollow") : t("socialFollow")}</button>}
          </div>
          {caption && <p className="social-reel__body">{caption}</p>}
          {hashtags.length > 0 && (
            <div className="social-reel__tags">
              {hashtags.map((tag, tagIndex) => (
                <Badge variant="secondary" className="social-reel__hashtag" key={`${tag}-${tagIndex}`}>{tag}</Badge>
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
        {!isOwn && <button type="button" className="social-reel__action" onClick={() => setReportDialogOpen(true)}>{t("socialReport")}</button>}
        <button type="button" className="social-reel__action" onClick={() => {
          onMutedChange((current) => !current);
        }} aria-label={muted ? t("reelsUnmute") : t("reelsMute")} aria-pressed={!muted}>
          <span className="social-reel__action-icon"><AppIcon name={muted ? "volumeOff" : "volume"} size={23} /></span>
          <span>{muted ? t("reelsSoundOff") : t("reelsSoundOn")}</span>
        </button>
      </aside>
      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => onDelete(post.id)} />
      <ReportDialog id={post.id} open={reportDialogOpen} onOpenChange={setReportDialogOpen} onReport={(reason) => onReport(post.id, reason)} />
      {commentsOpen && (
        <SocialCommentsSheet
          post={post}
          user={user}
          onClose={closeComments}
          onCommentCreated={actions.updateCommentCount}
        />
      )}
    </article>
  );
}
