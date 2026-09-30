import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";

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
      setError(submitError.message || t("socialPostFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="social-composer" onSubmit={submit}>
      <label className="social-composer__label" htmlFor="social-post-body">
        {t("socialSharePrompt")}
      </label>
      <textarea
        id="social-post-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("socialPostPlaceholder")}
        rows={5}
        maxLength={2000}
        disabled={busy}
      />
      <p className="social-composer__notice">{t("socialVisibilityNotice")}</p>
      <div className="social-composer__controls">
        <button type="submit" disabled={!body.trim() || busy}>
          {busy ? t("socialPosting") : t("socialPost")}
        </button>
      </div>
      {error && <p className="social-error" role="alert">{error}</p>}
    </form>
  );
}
