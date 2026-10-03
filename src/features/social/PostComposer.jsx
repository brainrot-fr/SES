import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { friendlyError } from "../../lib/supabaseClient.js";

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
    <form id="social-post-compose-form" className="social-composer" onSubmit={submit}>
      <div className="social-composer__entry">
        {avatar
          ? <img className="social-composer__avatar" src={avatar} alt="" />
          : <span className="social-composer__avatar social-composer__avatar--initial" aria-hidden="true">{initial}</span>}
      <textarea
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
      <div className="social-composer__meta">
        <p className="social-composer__notice">{t("socialVisibilityNotice")}</p>
        <span className="social-composer__count" aria-live="polite">{body.length}/2000</span>
      </div>
      {error && <p className="social-error" role="alert">{error}</p>}
    </form>
  );
}
