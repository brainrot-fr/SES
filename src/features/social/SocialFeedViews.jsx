import { Link } from "react-router-dom";
import { getDisplayName } from "../auth/authSession";
import PostCard from "./PostCard";
import ReelCard from "./ReelCard";
import ReelEndCard from "./ReelEndCard";
import AppIcon from "../../components/icons/AppIcon";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/shadcn/empty";
import { Skeleton } from "../../components/shadcn/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";
import { Button } from "../../components/shadcn/button";
import { Card } from "../../components/shadcn/card";
import Split from "../../components/layout/Split";
import { ImagePlus, Plus } from "lucide-react";

export function ReelsViewport({ t, user, navigate, feed }) {
  const {
    posts,
    page,
    hasMore,
    loading,
    error,
    loadError,
    activeReelIndex,
    reelMuted,
    setReelMuted,
    feedRef,
    loadPage,
    handleLike,
    handleFollow,
    handleView,
    handleShare,
    handleCommentCreated,
    handleNearEnd,
    handleActiveReel,
    handleReelEnd,
    handleDelete,
    handleReport,
  } = feed;

  return (
    <>
      <header className="social-reels__topbar">
        <div className="social-reels__title">
          <h1>{t("navReels")}</h1>
          <span title={t("reelsRankingInfo")}><AppIcon name="sparkle" size={15} /> {t("reelsForYou")}</span>
        </div>
        <Button asChild variant="ghost" size="icon" className="social-reels__top-action" aria-label={t("reelsCreate")} title={t("reelsCreate")}><Link to="/reels/create"><Plus /></Link></Button>
      </header>
      {error && <p className="social-error" role="alert">{error}</p>}
      {loadError && <div className="social-reels__load-error" role="alert">{loadError}<button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button></div>}
      {loading && posts.length === 0 && <div className="social-reels__skeleton" role="status" aria-label={t("socialLoading")}><Skeleton className="aspect-[9/16] w-full" /></div>}
      {!loading && !loadError && posts.length === 0 && <div className="social-reels__end social-reels__end--empty"><ReelEndCard onCreate={() => navigate("/reels/create")} onRestart={() => loadPage(0, false)} /></div>}
      <div ref={feedRef} className="social-feed__reels">
        {posts.map((post, index) => (
          <ReelCard
            key={post.id}
            post={post}
            index={index}
            isActive={index === activeReelIndex}
            muted={reelMuted}
            onMutedChange={setReelMuted}
            user={user}
            isOwn={post.author_id === user?.id}
            onDelete={handleDelete}
            onLike={handleLike}
            onFollow={handleFollow}
            onView={handleView}
            onShare={handleShare}
            onCommentCreated={handleCommentCreated}
            onNearEnd={handleNearEnd}
            onEnded={handleReelEnd}
            onActive={handleActiveReel}
            onReport={handleReport}
          />
        ))}
        {posts.length > 0 && !hasMore && !loading && (
          <div className="social-reels__end" data-reel-index={posts.length}>
            <ReelEndCard
              onCreate={() => navigate("/reels/create")}
              onRestart={() => feedRef.current?.querySelector('[data-reel-index="0"]')?.scrollIntoView({ behavior: "smooth" })}
            />
          </div>
        )}
      </div>
    </>
  );
}

export function FeedList({ t, user, navigate, feed }) {
  const {
    posts,
    page,
    hasMore,
    loading,
    error,
    loadError,
    feedRef,
    loadPage,
    handleLike,
    handleFollow,
    handleView,
    handleShare,
    handleCommentCreated,
    handleDelete,
    handleReport,
  } = feed;

  return (
    <Split
      className="social-feed__split"
      rail={(
        <aside className="hidden space-y-4 lg:sticky lg:top-[calc(var(--header-height)+var(--space-4))] lg:block">
          <p className="border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">{t("socialVisibilityNotice")}</p>
          <Button asChild variant="outline" className="w-full"><Link to="/reels">{t("socialWatchReels")}</Link></Button>
        </aside>
      )}
    >
      <main className="min-w-0 w-full lg:max-w-[var(--measure-feed)]">
        <Card className="mb-3 flex-row items-center gap-3 rounded-xl border p-3 shadow-sm">
          <Avatar>
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} alt="" />
            <AvatarFallback>{(getDisplayName(user) || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <Button asChild variant="secondary" className="h-11 flex-1 justify-start rounded-full text-muted-foreground">
            <Link to="/social/create">{t("socialSharePrompt")}<ImagePlus className="ms-auto" /></Link>
          </Button>
        </Card>
        {error && <p className="social-error" role="alert">{error}</p>}
        {loadError && <div className="social-error" role="alert"><span>{loadError}</span><button type="button" onClick={() => loadPage(page, page > 0)}>{t("socialRetry")}</button></div>}
        {loading && posts.length === 0 && (
          <div className="grid gap-3" role="status" aria-label={t("socialLoading")}>
            {Array.from({ length: 3 }, (_, index) => (
              <Card key={index} className="gap-3 rounded-xl border p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="grid flex-1 gap-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                </div>
                <Skeleton className="h-28 w-full" />
                <div className="flex gap-2"><Skeleton className="h-8 w-14" /><Skeleton className="h-8 w-14" /><Skeleton className="h-8 w-14" /></div>
              </Card>
            ))}
          </div>
        )}
        {!loading && !loadError && posts.length === 0 && (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia><AppIcon name="social" size={25} /></EmptyMedia>
              <EmptyTitle>{t("socialEmptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("socialEmptyDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent><Button type="button" variant="secondary" onClick={() => navigate("/social/create")}>{t("socialWriteFirstPost")}</Button></EmptyContent>
          </Empty>
        )}
        <div ref={feedRef} className="mt-3 flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              isOwn={post.author_id === user?.id}
              onDelete={handleDelete}
              onLike={handleLike}
              onFollow={handleFollow}
              onView={handleView}
              onShare={handleShare}
              onCommentCreated={handleCommentCreated}
              onReport={handleReport}
            />
          ))}
        </div>
        {hasMore && posts.length > 0 && (
          <Button type="button" variant="secondary" className="mx-auto mt-4 block" onClick={() => loadPage(page + 1, true)} disabled={loading}>
            {loading ? t("socialLoading") : t("socialLoadMore")}
          </Button>
        )}
      </main>
    </Split>
  );
}
