import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { friendlyError } from "@/lib/supabaseClient.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Progress } from "@/components/shadcn/progress";
import { Textarea } from "@/components/shadcn/textarea";
import FormError from "@/components/FormError";
import { cloudinaryImageUrl, MediaValidationError, uploadPostMedia, validateMediaFile } from "@/lib/cloudinaryUpload";
import { ImagePlus, X } from "lucide-react";

export default function PostComposer({ onCreate, onStateChange }) {
  const { user } = useAuth();
  const { t } = useLang();
  const inputRef = useRef(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = Boolean(body.trim() || file);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    onStateChange?.({ canSubmit, busy });
  }, [busy, canSubmit, onStateChange]);

  const chooseImage = (event) => {
    const selected = event.target.files?.[0];
    setError("");
    if (!selected) return;
    try {
      validateMediaFile(selected);
      if (!selected.type.startsWith("image/")) throw new MediaValidationError("unsupportedType");
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setMediaAlt("");
    } catch (validationError) {
      const message = validationError instanceof MediaValidationError
        ? validationError.message === "imageTooLarge" ? "socialImageTooLarge" : "socialPostImagesOnly"
        : "socialPostFailed";
      setError(t(message));
      event.target.value = "";
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreview("");
    setMediaAlt("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!canSubmit || busy) return;

    setBusy(true);
    setError("");
    setProgress(0);
    try {
      const media = file
        ? await uploadPostMedia(file, {
          userId: user.id,
          onProgress: setProgress,
        })
        : null;
      await onCreate({
        body: text,
        media,
        mediaAlt,
        user,
        fallbackDisplayName: t("socialUnknownAuthor"),
      });
      setBody("");
      removeImage();
    } catch (submitError) {
      console.error("[SocialFeed] failed to create post", submitError);
      setError(friendlyError(submitError, t, "socialPostFailed"));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const avatar = user?.user_metadata?.avatar_url;
  const initial = (user?.user_metadata?.display_name || user?.email || "?").slice(0, 1).toUpperCase();

  return (
    <form id="social-post-compose-form" className="grid gap-3 p-4" onSubmit={submit}>
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarImage src={cloudinaryImageUrl(avatar, "c_fill,w_96,h_96,f_auto,q_auto") || undefined} alt="" />
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
        />
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={chooseImage}
        disabled={busy}
        aria-label={t("socialAddImage")}
      />
      {preview && (
        <div className="relative max-w-full overflow-hidden rounded-[var(--radius-md)] bg-muted">
          <img className="max-h-72 w-full object-contain" src={preview} alt={mediaAlt || t("socialImagePreview")} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-2 top-2 bg-background/90"
            onClick={removeImage}
            disabled={busy}
            aria-label={t("socialRemoveMedia")}
          >
            <X />
          </Button>
        </div>
      )}
      {file && (
        <Input
          value={mediaAlt}
          onChange={(event) => setMediaAlt(event.target.value)}
          placeholder={t("socialImageAltPlaceholder")}
          maxLength={300}
          disabled={busy}
          aria-label={t("socialImageAltLabel")}
        />
      )}
      <p className="m-0 text-xs text-muted-foreground">{t("socialVisibilityNotice")}</p>
      <div className="flex min-h-11 items-center justify-between text-sm text-muted-foreground">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          <ImagePlus />{t("socialAddImage")}
        </Button>
        <span aria-live="polite">{body.length}/2000</span>
      </div>
      {busy && file && <Progress value={progress * 100} aria-label={t("socialUploadProgress")} />}
      <FormError message={error} />
    </form>
  );
}
