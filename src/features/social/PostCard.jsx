import { useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/shadcn/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { Card } from "@/components/shadcn/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcn/dropdown-menu";
import { splitCaption } from "@/features/social/reelRanking";
import SocialCommentsSheet from "@/features/social/SocialComments";
import { DeleteDialog, ReportDialog, usePostActions } from "@/features/social/postActions";
import { cloudinaryImageUrl } from "@/lib/cloudinaryUpload";
import { Ellipsis, Eye, Heart, MessageCircle, Share2 } from "lucide-react";

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
  onReport,
}) {
  const { lang, t } = useLang();
  const cardRef = useRef(null);
  const captionRef = useRef(null);
  const viewRecorded = useRef(false);
  const [mediaError, setMediaError] = useState(false);
  const [hasCaptionOverflow, setHasCaptionOverflow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const actions = usePostActions(post, {
    onLike,
    onFollow,
    onShare,
    onCommentCreated,
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
  const authorAvatar = cloudinaryImageUrl(
    post.author_avatar_url || (post.author_id === user?.id ? user.user_metadata?.avatar_url : null),
    "c_fill,w_256,h_256,f_auto,q_auto",
  );
  const { caption, hashtags } = splitCaption(post.body || "");

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

  useEffect(() => {
    const captionElement = captionRef.current;
    if (!captionElement || expanded) return undefined;
    const measure = () => {
      setHasCaptionOverflow(captionElement.scrollHeight > captionElement.clientHeight + 1);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(captionElement);
    return () => observer?.disconnect();
  }, [caption, expanded]);

  const share = () => {
    const publicUrl = (import.meta.env.VITE_PUBLIC_URL || "https://ses-mvp.vercel.app").replace(/\/+$/, "");
    const url = `${publicUrl}/#/social?post=${encodeURIComponent(post.id)}`;
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

  return (
    <Card ref={cardRef} className="gap-3 rounded-xl border p-4 shadow-sm [content-visibility:auto] [contain-intrinsic-size:auto_320px]">
      <header className="flex min-w-0 items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={cloudinaryImageUrl(authorAvatar, "c_fill,w_256,h_256,f_auto,q_auto") || undefined} alt="" />
          <AvatarFallback>{authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{authorName}</span>
          <time className="text-xs text-muted-foreground" dateTime={post.created_at} aria-label={absoluteDate}>{date}</time>
        </div>
        {!isOwn && (
          <Button type="button" size="sm" variant="outline" disabled={followBusy} onClick={actions.toggleFollow} aria-pressed={following}>
            {following ? t("socialUnfollow") : t("socialFollow")}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label={t("socialPostActions")}><Ellipsis /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwn
              ? <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteDialogOpen(true)}>{t("socialDeletePost")}</DropdownMenuItem>
              : <DropdownMenuItem onSelect={() => setReportDialogOpen(true)}>{t("socialReport")}</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      {caption && (
        <div>
          <p ref={captionRef} className={`whitespace-pre-wrap text-[15px] leading-7 ${expanded ? "" : "line-clamp-6"}`}>{caption}</p>
          {(hasCaptionOverflow || expanded) && <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setExpanded((value) => !value)}>{t(expanded ? "socialReadLess" : "socialReadMore")}</Button>}
        </div>
      )}
      {hashtags.length > 0 && <div className="flex flex-wrap gap-2" aria-label={t("socialTopics")}>{hashtags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{tag}</span>)}</div>}
      {post.media_url && !mediaError && (
        <div className="w-full overflow-hidden rounded-lg bg-muted" style={post.media_width > 0 && post.media_height > 0 ? { aspectRatio: `${post.media_width} / ${post.media_height}` } : undefined}>
          {post.media_type === "video" ? (
            <video className="max-h-[min(68vh,660px)] w-full object-contain" src={post.media_url} controls playsInline preload="none" aria-label={t("socialVideo")} onError={() => setMediaError(true)} />
          ) : (
            <img className="max-h-[min(68vh,660px)] w-full object-contain" src={cloudinaryImageUrl(post.media_url, "f_auto,q_auto,w_1080")} alt={post.media_alt || t("socialImage")} loading="lazy" onError={() => setMediaError(true)} />
          )}
        </div>
      )}
      {post.media_url && mediaError && <p className="text-sm text-muted-foreground">{t("socialMediaLoadError")}</p>}
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={actions.toggleLike} disabled={likeBusy} aria-pressed={liked} aria-label={`${liked ? t("socialUnlike") : t("socialLike")} · ${likeCount}`} className={liked ? "text-destructive" : ""}>
          <Heart className={liked ? "fill-current" : ""} />{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(likeCount)}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setCommentsOpen(true)} aria-label={`${t("socialComments")} · ${commentCount}`}>
          <MessageCircle />{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(commentCount)}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={share} aria-label={t("socialShare")}>
          <Share2 />{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(shareCount)}
        </Button>
        <span className="ms-auto inline-flex items-center gap-1 text-xs text-muted-foreground" aria-label={`${t("socialViews")} ${viewCount}`}>
          <Eye size={15} />{new Intl.NumberFormat(lang === "ur" ? "ur" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(viewCount)}
        </span>
      </div>
      <DeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => onDelete(post.id)} />
      <ReportDialog id={post.id} open={reportDialogOpen} onOpenChange={setReportDialogOpen} onReport={(reason) => onReport(post.id, reason)} />
      {commentsOpen && (
        <SocialCommentsSheet
          post={post}
          user={user}
          onClose={() => setCommentsOpen(false)}
          onCommentCreated={actions.updateCommentCount}
        />
      )}
    </Card>
  );
}
