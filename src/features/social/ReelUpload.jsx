import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import AppIcon from "@/components/icons/AppIcon";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";
import { Textarea } from "@/components/shadcn/textarea";
import FormError from "@/components/FormError";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { MediaValidationError, uploadPostMedia, validateMediaFile } from "@/lib/cloudinaryUpload";
import { friendlyError } from "@/lib/supabaseClient.js";
import { createPost } from "@/features/social/postsApi";
import { REEL_TAGS } from "@/features/social/reelRanking";
import "@/features/social/reel-upload.css";

export default function ReelUpload() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const uploadAbortControllerRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
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
      const controller = new AbortController();
      uploadAbortControllerRef.current = controller;
      setUploading(true);
      const media = await uploadPostMedia(file, {
        onProgress: setProgress,
        userId: user.id,
        signal: controller.signal,
      });
      setUploading(false);
      uploadAbortControllerRef.current = null;
      await createPost({
        body: caption.trim(),
        media,
        topics: selectedTags,
        user,
        fallbackDisplayName: t("socialUnknownAuthor"),
      });
      navigate("/reels", { replace: true });
    } catch (uploadError) {
      if (uploadError?.name === "AbortError") return;
      console.error("[Reels] failed to publish reel", uploadError);
      setError(friendlyError(uploadError, t, "reelsUploadFailed"));
    } finally {
      uploadAbortControllerRef.current = null;
      setUploading(false);
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <main className="reel-upload-page">
      <form className="reel-upload" onSubmit={submit}>
        <div className="reel-upload__split">
          <div className="reel-upload__preview-pane">
            {preview ? (
              <>
                <div className="reel-upload__preview">
                  <video src={preview} controls playsInline aria-label={t("reelsVideoPreview")} />
                  <button type="button" className="reel-upload__remove" onClick={removeVideo} disabled={busy} aria-label={t("socialRemoveMedia")}>
                    <AppIcon name="close" size={19} />
                  </button>
                </div>
                <button
                  type="button"
                  className="reel-upload__picker reel-upload__picker--selected"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                >
                  <AppIcon name="play" size={20} />
                  <strong>{t("reelsChooseVideo")}</strong>
                </button>
              </>
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
                spacing={2}
                variant="outline"
                value={selectedTags}
                disabled={busy}
                onValueChange={(values) => {
                  if (values.length <= 3) setSelectedTags(values);
                }}
                className="flex w-full flex-wrap gap-2"
                aria-label={t("reelsTopicsLabel")}
              >
                {REEL_TAGS.map(({ topic, label }) => (
                  <ToggleGroupItem key={topic} value={topic} className="min-h-11">
                    #{t(label)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </fieldset>
            <p className="reel-upload__guideline"><AppIcon name="sparkle" size={16} />{t("reelsCommunityGuideline")}</p>
          </div>
        </div>
        <input ref={inputRef} className="reel-upload__file-input" type="file" accept="video/*" onChange={chooseVideo} disabled={busy} aria-label={t("reelsChooseVideo")} />
        {uploading && (
          <Progress value={progress * 100} aria-label={t("socialUploadProgress")} />
        )}
        <FormError message={error} />
        <div className="reel-upload__actions">
          {uploading && (
            <Button
              type="button"
              variant="outline"
              onClick={() => uploadAbortControllerRef.current?.abort(new DOMException("Upload cancelled.", "AbortError"))}
            >
              {t("socialCancelUpload")}
            </Button>
          )}
          <Button type="submit" disabled={!file || busy}>
            {busy ? t("socialPosting") : t("reelsPublish")}
          </Button>
        </div>
      </form>
    </main>
  );
}
