import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { uploadPostMedia } from "../../lib/cloudinaryUpload";

export default function PostComposer({ onCreate }) {
  const { user } = useAuth();
  const { t } = useLang();
  const fileInputRef = useRef(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim() && !file) return;

    setBusy(true);
    setError("");
    try {
      const media = file ? await uploadPostMedia(file) : null;
      await onCreate({ body, media, user });
      setBody("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (uploadError) {
      console.error("[SocialFeed] failed to create post", uploadError);
      setError(uploadError.message || t("socialPostFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="social-composer" onSubmit={submit}>
      <label className="social-composer__label" htmlFor="social-post-body">{t("socialSharePrompt")}</label>
      <textarea
        id="social-post-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("socialPostPlaceholder")}
        rows={3}
        maxLength={2000}
      />
      <div className="social-composer__controls">
        <label className="social-composer__file">
          <span>{t("socialAddMedia")}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <span className="social-composer__filename">
            {file.name}
            <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
              {t("socialRemoveMedia")}
            </button>
          </span>
        )}
        <button type="submit" disabled={busy || (!body.trim() && !file)}>
          {busy ? t("socialPosting") : t("socialPost")}
        </button>
      </div>
      {error && <p className="social-error" role="alert">{error}</p>}
    </form>
  );
}
