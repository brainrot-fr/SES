import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/context/LanguageContext";
import BottomSheet from "@/components/BottomSheet";
import AppIcon from "@/components/icons/AppIcon";
import { Button } from "@/components/shadcn/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { Textarea } from "@/components/shadcn/textarea";
import { ScrollArea } from "@/components/shadcn/scroll-area";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { friendlyError } from "@/lib/supabaseClient.js";
import { cloudinaryImageUrl } from "@/lib/cloudinaryUpload";
import { createComment, deletePostComment, fetchComments } from "@/features/social/postsApi";

function CommentBranch({ comment, children, depth, userId, onReply, onDelete, t }) {
  return (
    <article className="social-comment" style={{ "--comment-depth": Math.min(depth, 4) }}>
      <Avatar className="social-comment__avatar">
        <AvatarImage src={cloudinaryImageUrl(comment.author_avatar_url, "c_fill,w_96,h_96,f_auto,q_auto") || undefined} alt="" />
        <AvatarFallback>{comment.author_display_name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="social-comment__content">
        <strong>{comment.author_display_name}</strong>
        <p>{comment.body}</p>
        <div className="social-comment__actions">
          {depth < 4 && (
            <Button type="button" variant="ghost" size="sm" className="h-11 px-0" onClick={() => onReply(comment)}>
              {t("socialReply")}
            </Button>
          )}
          {comment.author_id === userId && (
            <Button type="button" variant="ghost" size="sm" className="h-11 px-0 text-destructive" onClick={() => onDelete(comment)}>
              {t("socialDeleteComment")}
            </Button>
          )}
        </div>
        {children}
      </div>
    </article>
  );
}

export default function SocialCommentsSheet({ post, user, onClose, onCommentCreated }) {
  const { lang, t } = useLang();
  const tRef = useRef(t);
  tRef.current = t;
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchComments(post.id)
      .then((result) => {
        if (!cancelled) setComments(result);
      })
      .catch((loadError) => {
        console.error("[Social] failed to load comments", loadError);
        if (!cancelled) setError(friendlyError(loadError, tRef.current, "socialCommentsError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const created = await createComment({
        postId: post.id,
        body,
        user,
        replyToId: replyTo?.id,
        fallbackDisplayName: t("socialUnknownAuthor"),
      });
      const profile = user.user_metadata || {};
      setComments((current) => [...current, {
        ...created,
        author_display_name: profile.display_name || profile.full_name || profile.name || t("socialUnknownAuthor"),
        author_avatar_url: profile.avatar_url || null,
      }]);
      setBody("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setReplyTo(null);
      onCommentCreated(post.id, created.body);
    } catch (submitError) {
      console.error("[Social] failed to create comment", submitError);
      setError(friendlyError(submitError, t, "socialCommentFailed"));
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async () => {
    if (!commentToDelete || deletingComment) return;
    setDeletingComment(true);
    setError("");
    try {
      await deletePostComment(commentToDelete.id);
      setComments((current) => current.filter((comment) => comment.id !== commentToDelete.id));
      if (replyTo?.id === commentToDelete.id) setReplyTo(null);
      onCommentCreated(post.id, null, -1);
      setCommentToDelete(null);
    } catch (deleteError) {
      console.error("[Social] failed to delete comment", deleteError);
      setError(friendlyError(deleteError, t, "socialDeleteError"));
    } finally {
      setDeletingComment(false);
    }
  };

  const beginReply = (comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  const resizeCommentField = (event) => {
    const element = event.currentTarget;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
    setBody(element.value);
  };

  const close = useCallback(() => onClose(), [onClose]);
  const childComments = new Map();
  const commentIds = new Set(comments.map((comment) => comment.id));
  for (const comment of comments) {
    const parentId = commentIds.has(comment.reply_to_id) ? comment.reply_to_id : null;
    const siblings = childComments.get(parentId) || [];
    siblings.push(comment);
    childComments.set(parentId, siblings);
  }

  const renderComment = (comment, depth = 0) => (
    <CommentBranch
      key={comment.id}
      comment={comment}
      depth={depth}
      userId={user.id}
      onReply={beginReply}
      onDelete={setCommentToDelete}
      t={t}
    >
      {(childComments.get(comment.id) || []).map((child) => renderComment(child, depth + 1))}
    </CommentBranch>
  );

  return (
    <>
    <BottomSheet
      open
      onOpenChange={(open) => !open && close()}
      title={t("socialComments")}
      description={t("socialCommentsDescription")}
      closeLabel={t("socialCloseComments")}
      showCloseButton={false}
      className="mx-auto h-[82dvh] w-full max-w-xl gap-0 p-0"
    >
        <header className="flex min-h-16 items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="font-semibold text-foreground">{t("socialComments")}</h2>
            <span className="text-xs text-muted-foreground">{new Intl.NumberFormat(lang === "ur" ? "ur" : "en").format(comments.length)}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={close} aria-label={t("socialCloseComments")}>
            <AppIcon name="close" />
          </Button>
        </header>
        <ScrollArea className="min-h-0 flex-1 px-4" aria-live="polite">
          {loading && <p className="social-comments__empty">{t("socialLoading")}</p>}
          {!loading && !comments.length && <p className="social-comments__empty">{t("socialFirstComment")}</p>}
          {[...(childComments.get(null) || [])].map((comment) => renderComment(comment))}
        </ScrollArea>
        {error && <p className="px-4 py-2 text-sm text-destructive" role="alert">{error}</p>}
        <form className="grid grid-cols-[1fr_auto] gap-2 border-t p-4" onSubmit={submit}>
          {replyTo && (
            <div className="col-span-full flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("socialReplyingTo")} {replyTo.author_display_name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(null)}>{t("socialCancelReply")}</Button>
            </div>
          )}
          <label className="sr-only" htmlFor={`social-comment-${post.id}`}>{t("socialCommentLabel")}</label>
          <Textarea
            ref={inputRef}
            id={`social-comment-${post.id}`}
            value={body}
            onChange={resizeCommentField}
            placeholder={t("socialCommentPlaceholder")}
            maxLength={1000}
            rows={1}
            disabled={busy}
            className="min-h-11 max-h-40 resize-none"
          />
          <Button type="submit" disabled={!body.trim() || busy}>{busy ? t("socialPosting") : t("socialSendComment")}</Button>
        </form>
    </BottomSheet>
      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => {
        if (!open && !deletingComment) setCommentToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("socialDeleteCommentConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("socialDeleteWarning")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingComment}>{t("socialDeleteNo")}</AlertDialogCancel>
            <Button type="button" variant="destructive" busy={deletingComment} loadingLabel={t("socialDeleting")} onClick={removeComment}>{t("socialDeleteYes")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
