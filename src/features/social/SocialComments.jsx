import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import { Button } from "@/components/shadcn/button";
import Modal from "../../components/ui/Modal";
import { createComment, deletePostComment, fetchComments } from "./postsApi";

function CommentBranch({ comment, children, depth, userId, onReply, onDelete, t }) {
  return (
    <article className="social-comment" style={{ "--comment-depth": Math.min(depth, 4) }}>
      {comment.author_avatar_url ? (
        <img className="social-comment__avatar" src={comment.author_avatar_url} alt="" loading="lazy" />
      ) : (
        <span className="social-comment__avatar social-comment__avatar--initial" aria-hidden="true">
          {comment.author_display_name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="social-comment__content">
        <strong>{comment.author_display_name}</strong>
        <p>{comment.body}</p>
        <div className="social-comment__actions">
          {depth < 4 && (
            <button type="button" onClick={() => onReply(comment)}>
              {t("socialReply")}
            </button>
          )}
          {comment.author_id === userId && (
            <button type="button" onClick={() => onDelete(comment)}>
              {t("socialDeleteComment")}
            </button>
          )}
        </div>
        {children}
      </div>
    </article>
  );
}

export default function SocialCommentsSheet({ post, user, onClose, onCommentCreated }) {
  const { lang, t } = useLang();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deletingComment, setDeletingComment] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const previouslyFocused = document.activeElement;
    fetchComments(post.id)
      .then((result) => {
        if (!cancelled) setComments(result);
      })
      .catch((loadError) => {
        console.error("[Social] failed to load comments", loadError);
        if (!cancelled) setError(loadError.message || t("socialCommentsError"));
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
      const created = await createComment({ postId: post.id, body, user, replyToId: replyTo?.id });
      const profile = user.user_metadata || {};
      setComments((current) => [...current, {
        ...created,
        author_display_name: profile.display_name || profile.full_name || profile.name || "Community member",
        author_avatar_url: profile.avatar_url || null,
      }]);
      setBody("");
      setReplyTo(null);
      onCommentCreated(post.id, created.body);
    } catch (submitError) {
      console.error("[Social] failed to create comment", submitError);
      setError(submitError.message || t("socialCommentFailed"));
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
      setError(deleteError.message || t("socialDeleteError"));
    } finally {
      setDeletingComment(false);
    }
  };

  const beginReply = (comment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
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
    <div className="social-comments-backdrop">
      <button type="button" className="social-comments-dismiss" aria-label={t("socialCloseComments")} onClick={close} />
      <section ref={sheetRef} className="social-comments" role="dialog" aria-modal="true" aria-labelledby={`social-comments-title-${post.id}`}>
        <header className="social-comments__header">
          <div>
            <h2 id={`social-comments-title-${post.id}`}>{t("socialComments")}</h2>
            <span>{new Intl.NumberFormat(lang === "ur" ? "ur" : "en").format(comments.length)}</span>
          </div>
          <button type="button" className="social-comments__close" onClick={close} aria-label={t("socialCloseComments")}>
            <AppIcon name="close" />
          </button>
        </header>
        <div className="social-comments__list" aria-live="polite">
          {loading && <p className="social-comments__empty">{t("socialLoading")}</p>}
          {!loading && !comments.length && <p className="social-comments__empty">{t("socialFirstComment")}</p>}
          {[...(childComments.get(null) || [])].map((comment) => renderComment(comment))}
        </div>
        {error && <p className="social-comments__error" role="alert">{error}</p>}
        <form className="social-comments__form" onSubmit={submit}>
          {replyTo && (
            <div className="social-comments__replying">
              <span>{t("socialReplyingTo")} {replyTo.author_display_name}</span>
              <button type="button" onClick={() => setReplyTo(null)}>{t("socialCancelReply")}</button>
            </div>
          )}
          <label className="sr-only" htmlFor={`social-comment-${post.id}`}>{t("socialCommentLabel")}</label>
          <input
            ref={inputRef}
            id={`social-comment-${post.id}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("socialCommentPlaceholder")}
            maxLength={1000}
            disabled={busy}
          />
          <button type="submit" disabled={!body.trim() || busy}>{busy ? t("socialPosting") : t("socialSendComment")}</button>
        </form>
      </section>
      <Modal
        open={!!commentToDelete}
        onClose={() => !deletingComment && setCommentToDelete(null)}
        labelledBy={`social-comment-delete-title-${post.id}`}
        disableClose={deletingComment}
        className="ui-auth-dialog"
      >
        <h2 className="ui-dialog-title" id={`social-comment-delete-title-${post.id}`}>
          {t("socialDeleteCommentConfirm")}
        </h2>
        <div className="ui-dialog-actions">
          <Button type="button" variant="secondary" disabled={deletingComment} onClick={() => setCommentToDelete(null)}>
            {t("socialDeleteNo")}
          </Button>
          <Button type="button" variant="destructive" busy={deletingComment} onClick={removeComment}>
            {t("socialDeleteYes")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
