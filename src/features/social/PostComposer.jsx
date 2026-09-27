import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import {
  MediaValidationError,
  uploadPostMedia,
  validateMediaFile,
} from "../../lib/cloudinaryUpload";

const VALIDATION_ERROR_KEYS = {
  unsupportedType: "socialMediaUnsupportedType",
  imageTooLarge: "socialImageTooLarge",
  videoTooLarge: "socialVideoTooLarge",
};

export default function PostComposer({ onCreate }) {
  const { user } = useAuth();
  const { t } = useLang();
  const fileInputRef = useRef(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearMedia = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    setError("");
    if (!selected) {
      clearMedia();
      return;
    }

    try {
      validateMediaFile(selected);
    } catch (validationError) {
      clearMedia();
      setError(
        validationError instanceof MediaValidationError
          ? t(VALIDATION_ERROR_KEYS[validationError.message])
          : t("socialPostFailed"),
      );
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const canSubmit = !busy && (body.trim().length > 0 || file);

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const media = file
        ? await uploadPostMedia(file, { onProgress: setProgress })
        : null;
      await onCreate({ body, media, user });
      setBody("");
      clearMedia();
    } catch (uploadError) {
      console.error("[SocialFeed] failed to create post", uploadError);
      setError(uploadError.message || t("socialPostFailed"));
    } finally {
      setBusy(false);
      setProgress(0);
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
        disabled={busy}
      />
      {previewUrl && (
        <div className="social-composer__preview">
          {file?.type.startsWith("video/") ? (
            <video src={previewUrl} className="social-composer__preview-media" controls muted />
          ) : (
            <img src={previewUrl} className="social-composer__preview-media" alt="" />
          )}
          <button
            type="button"
            className="social-composer__remove"
            onClick={clearMedia}
            disabled={busy}
            aria-label={t("socialRemoveMedia")}
          >
            ✕
          </button>
        </div>
      )}
      <p className="social-composer__notice">{t("socialVisibilityNotice")}</p>
      {busy && file && (
        <div
          className="social-composer__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={t("socialUploadProgress")}
        >
          <div className="social-composer__progress-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      <div className="social-composer__controls">
        <label className="social-composer__file">
          <span>{t("socialAddMedia")}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={busy}
          />
        </label>
        {file && (
          <span className="social-composer__filename">{file.name}</span>
        )}
        <button type="submit" disabled={!canSubmit}>
          {busy ? t("socialPosting") : t("socialPost")}
        </button>
      </div>
      {error && <p className="social-error" role="alert">{error}</p>}
    </form>
  );
}
