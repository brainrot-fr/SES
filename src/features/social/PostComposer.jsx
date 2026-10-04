import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { friendlyError } from "../../lib/supabaseClient.js";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";
import { Textarea } from "../../components/shadcn/textarea";

export default function PostComposer({ onCreate }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || busy) return;

    setBusy(true);
    setError("");
    try {
      await onCreate({ body: text, user });
      setBody("");
    } catch (submitError) {
      console.error("[SocialFeed] failed to create post", submitError);
      setError(friendlyError(submitError, t, "socialPostFailed"));
    } finally {
      setBusy(false);
    }
  };

  const avatar = user?.user_metadata?.avatar_url;
  const initial = (user?.user_metadata?.display_name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <form id="social-post-compose-form" className="grid gap-3 p-4" onSubmit={submit}>
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={avatar || undefined} alt="" />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <Textarea
          id="social-post-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("socialPostPlaceholder")}
          rows={5}
          maxLength={2000}
          disabled={busy}
          required
        />
      </div>
      <p className="m-0 text-xs text-muted-foreground">{t("socialVisibilityNotice")}</p>
      <div className="flex min-h-11 items-center justify-end text-sm text-muted-foreground">
        <span aria-live="polite">{body.length}/2000</span>
      </div>
      {error && <p className="social-error" role="alert">{error}</p>}
    </form>
  );
}
