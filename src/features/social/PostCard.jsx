import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLang } from "../../context/LanguageContext";
import { Button } from "../../components/shadcn/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";
import { Badge } from "../../components/shadcn/badge";
import { Card } from "../../components/shadcn/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../components/shadcn/alert-dialog";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "../../components/shadcn/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/shadcn/dropdown-menu";
import { Label } from "../../components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "../../components/shadcn/radio-group";
import { splitCaption } from "./reelRanking";
import SocialCommentsSheet from "./SocialComments";
import { friendlyError } from "../../lib/supabaseClient.js";
import { Ellipsis, Eye, Heart, MessageCircle, Share2, X } from "lucide-react";

export function DeleteDialog({ open, onOpenChange, onConfirm, title }) {
  const { t } = useLang();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || t("socialDeleteConfirm")}</AlertDialogTitle>
          <AlertDialogDescription>{t("socialDeleteWarning")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("socialDeleteNo")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>{t("socialDeleteYes")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ReportDialog({ id, open, onOpenChange, onReport }) {
  const { t } = useLang();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reasons = [["spam", "socialReportSpam"], ["harassment", "socialReportHarassment"], ["inappropriate", "socialReportInappropriate"]];

  useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const submit = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setError("");
    try {
      await onReport(reason);
      onOpenChange(false);
      toast(t("socialReportSuccess"));
    } catch (reportError) {
      setError(friendlyError(reportError, t, "socialReportError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon" className="absolute end-2 top-2" aria-label={t("socialDeleteNo")}><X /></Button>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>{t("socialReportTitle")}</DialogTitle>
          <DialogDescription>{t("socialReportReason")}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="gap-1">
          {reasons.map(([value, label]) => (
            <Label key={value} htmlFor={`report-reason-${id}-${value}`} className="flex min-h-11 items-center gap-3 font-normal">
              <RadioGroupItem id={`report-reason-${id}-${value}`} value={value} />
              {t(label)}
            </Label>
          ))}
        </RadioGroup>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("socialDeleteNo")}</Button>
          <Button type="button" disabled={!reason || busy} onClick={submit}>{t("socialReportSubmit")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function usePostActions(post, {
  onLike,
  onFollow,
  onShare,
  onCommentCreated,
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
      toast(friendlyError(error, t, likeErrorKey));
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
      toast(friendlyError(error, t, followErrorKey));
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
      toast(message);
    } catch (error) {
      if (error.name !== "AbortError") toast(friendlyError(error, t, errorMessageKey));
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
  onReport,
}) {
  const { lang, t } = useLang();
  const cardRef = useRef(null);
  const viewRecorded = useRef(false);
  const [mediaError, setMediaError] = useState(false);
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

  const { caption, hashtags } = splitCaption(post.body || "");
  const [expanded, setExpanded] = useState(false);

  return (
    <Card ref={cardRef} className="gap-3 rounded-xl border p-4 shadow-sm [content-visibility:auto]">
      <header className="flex min-w-0 items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={authorAvatar || undefined} alt="" />
          <AvatarFallback>{authorName.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{authorName}</span>
          <time className="text-xs text-muted-foreground" dateTime={post.created_at} title={absoluteDate}>{date}</time>
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
          <p className={`whitespace-pre-wrap text-[15px] leading-7 ${expanded ? "" : "line-clamp-6"}`}>{caption}</p>
          {post.body.length > 280 && <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setExpanded((value) => !value)}>{t(expanded ? "socialReadLess" : "socialReadMore")}</Button>}
        </div>
      )}
      {hashtags.length > 0 && <div className="flex flex-wrap gap-2">{hashtags.map((tag, index) => <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>)}</div>}
      {post.media_url && !mediaError && (
        <div className="w-full overflow-hidden rounded-lg bg-muted">
          {post.media_type === "video" ? (
            <video className="max-h-[min(68vh,660px)] w-full object-contain" src={post.media_url} controls playsInline preload="none" aria-label={t("socialVideo")} onError={() => setMediaError(true)} />
          ) : (
            <img className="max-h-[min(68vh,660px)] w-full object-contain" src={post.media_url} alt={t("socialImage")} loading="lazy" onError={() => setMediaError(true)} />
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
