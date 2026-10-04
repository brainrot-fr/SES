// Template: Feed — presentational post regions.
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";
import { Badge } from "../../components/shadcn/badge";
import { Button } from "../../components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/shadcn/dropdown-menu";
import { Ellipsis, Eye, Heart, MessageCircle, Share2 } from "lucide-react";

export function PostHeader({
  post,
  authorName,
  authorAvatar,
  date,
  absoluteDate,
  isOwn,
  following,
  followBusy,
  onToggleFollow,
  onDelete,
  onReport,
  t,
}) {
  return (
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
        <Button type="button" size="sm" variant="outline" disabled={followBusy} onClick={onToggleFollow} aria-pressed={following}>
          {following ? t("socialUnfollow") : t("socialFollow")}
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label={t("socialPostActions")}><Ellipsis /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwn
            ? <DropdownMenuItem className="text-destructive" onSelect={onDelete}>{t("socialDeletePost")}</DropdownMenuItem>
            : <DropdownMenuItem onSelect={onReport}>{t("socialReport")}</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export function PostBody({ caption, hashtags, expanded, onExpand, postLength, t }) {
  return (
    <>
      {caption && (
        <div>
          <p className={`whitespace-pre-wrap text-[15px] leading-7 ${expanded ? "" : "line-clamp-6"}`}>{caption}</p>
          {postLength > 280 && (
            <Button variant="link" size="sm" className="h-auto p-0" onClick={onExpand}>
              {t(expanded ? "socialReadLess" : "socialReadMore")}
            </Button>
          )}
        </div>
      )}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}
    </>
  );
}

export function PostMedia({ post, mediaError, onError, t }) {
  if (!post.media_url) return null;
  if (mediaError) return <p className="text-sm text-muted-foreground">{t("socialMediaLoadError")}</p>;
  return (
    <div className="w-full overflow-hidden rounded-lg bg-muted">
      {post.media_type === "video" ? (
        <video className="max-h-[min(68vh,660px)] w-full object-contain" src={post.media_url} controls playsInline preload="none" aria-label={t("socialVideo")} onError={onError} />
      ) : (
        <img className="max-h-[min(68vh,660px)] w-full object-contain" src={post.media_url} alt={t("socialImage")} loading="lazy" onError={onError} />
      )}
    </div>
  );
}

export function PostActions({
  lang,
  liked,
  likeBusy,
  likeCount,
  commentCount,
  shareCount,
  viewCount,
  onLike,
  onComment,
  onShare,
  t,
}) {
  const formatCount = (count) =>
    new Intl.NumberFormat(lang === "ur" ? "ur" : "en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(count);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button type="button" variant="ghost" size="sm" onClick={onLike} disabled={likeBusy} aria-pressed={liked} aria-label={`${liked ? t("socialUnlike") : t("socialLike")} · ${likeCount}`} className={liked ? "text-destructive" : ""}>
        <Heart className={liked ? "fill-current" : ""} />{formatCount(likeCount)}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onComment} aria-label={`${t("socialComments")} · ${commentCount}`}>
        <MessageCircle />{formatCount(commentCount)}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onShare} aria-label={t("socialShare")}>
        <Share2 />{formatCount(shareCount)}
      </Button>
      <span className="ms-auto inline-flex items-center gap-1 text-xs text-muted-foreground" aria-label={`${t("socialViews")} ${viewCount}`}>
        <Eye size={15} />{formatCount(viewCount)}
      </span>
    </div>
  );
}
