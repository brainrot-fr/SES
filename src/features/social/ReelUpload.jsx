import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import { Button } from "../../components/shadcn/button";
import { Progress } from "../../components/shadcn/progress";
import { Textarea } from "../../components/shadcn/textarea";
import { ToggleGroup, ToggleGroupItem } from "../../components/shadcn/toggle-group";
import { MediaValidationError, uploadPostMedia, validateMediaFile } from "../../lib/cloudinaryUpload";
import { friendlyError } from "../../lib/supabaseClient.js";
import { createPost } from "./postsApi";
import { REEL_TAGS } from "./reelRanking";
import "./socialFeed.css";

export default function ReelUpload() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const chooseVideo = (event) => {
    const selected = event.target.files?.[0];
    setError("");
    if (!selected) return;
    if (!selected.type.startsWith("video/")) {
      setError(t("reelsVideoOnly"));
      event.target.value = "";
      return;
    }
    try {
      validateMediaFile(selected);
      if (preview) URL.revokeObjectURL(preview);
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    } catch (validationError) {
      setError(validationError instanceof MediaValidationError && validationError.message === "videoTooLarge"
        ? t("socialVideoTooLarge")
        : t("reelsVideoOnly"));
      event.target.value = "";
    }
  };

  const removeVideo = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const media = await uploadPostMedia(file, { onProgress: setProgress });
      const taggedCaption = [
        caption.trim(),
        selectedTags.map((topic) => `#${topic}`).join(" "),
      ].filter(Boolean).join("\n\n");
      await createPost({ body: taggedCaption, media, user });
      navigate("/reels", { replace: true });
    } catch (uploadError) {
      console.error("[Reels] failed to publish reel", uploadError);
      setError(friendlyError(uploadError, t, "reelsUploadFailed"));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <main className="reel-upload-page">
      <header className="reel-upload-page__header">
        <Button asChild variant="ghost" size="icon" className="social-reels__top-action" aria-label={t("goBack")}><Link to="/reels"><AppIcon name="back" /></Link></Button>
        <h1>{t("reelsCreate")}</h1>
        <span className="reel-upload-page__spacer" />
      </header>
      <form className="reel-upload" onSubmit={submit}>
        <div className="reel-upload__split">
          <div className="reel-upload__preview-pane">
            {preview ? (
              <div className="reel-upload__preview">
                <video src={preview} controls playsInline muted aria-label={t("reelsVideoPreview")} />
                <button type="button" className="reel-upload__remove" onClick={removeVideo} disabled={busy} aria-label={t("socialRemoveMedia")}>
                  <AppIcon name="close" size={19} />
                </button>
              </div>
            ) : (
              <button type="button" className="reel-upload__picker" onClick={() => inputRef.current?.click()}>
                <span><AppIcon name="play" size={27} /></span>
                <strong>{t("reelsChooseVideo")}</strong>
                <small>{t("reelsVideoRequirements")}</small>
              </button>
            )}
          </div>
          <div className="reel-upload__fields">
            <label className="reel-upload__caption-label" htmlFor="reel-caption">{t("reelsCaptionLabel")}</label>
            <Textarea
              id="reel-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder={t("reelsCaptionPlaceholder")}
              className="min-h-24 w-full resize-y"
              maxLength={2000}
              rows={3}
              disabled={busy}
            />
            <fieldset className="reel-upload__topics">
              <legend>{t("reelsTopicsLabel")}</legend>
              <p aria-live="polite">
                {selectedTags.length >= 3 ? t("reelsTopicsLimit") : t("reelsTopicsHint")}
              </p>
              <ToggleGroup
                type="multiple"
                value={selectedTags}
                disabled={busy}
                onValueChange={(values) => {
                  if (values.length <= 3) setSelectedTags(values);
                }}
                className="flex w-full flex-wrap gap-2"
                aria-label={t("reelsTopicsLabel")}
              >
                {REEL_TAGS.map(({ topic, slug, label }) => (
                  <ToggleGroupItem key={topic} value={slug} variant="outline" className="min-h-11 rounded-full">
                    #{t(label)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>
            <p className="reel-upload__guideline"><AppIcon name="sparkle" size={16} />{t("reelsCommunityGuideline")}</p>
          </div>
        </div>
        <input ref={inputRef} className="reel-upload__file-input" type="file" accept="video/*" onChange={chooseVideo} disabled={busy} aria-label={t("reelsChooseVideo")} />
        {busy && (
          <Progress value={progress * 100} aria-label={t("socialUploadProgress")} />
        )}
        {error && <p className="social-error" role="alert">{error}</p>}
        <div className="reel-upload__actions">
          <Button type="submit" disabled={!file || busy}>
            {busy ? t("socialPosting") : t("reelsPublish")}
          </Button>
        </div>
      </form>
    </main>
  );
}
