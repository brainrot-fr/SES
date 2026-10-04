/**
 * SettingsDashboard.jsx
 * Central settings/account page — language, theme, and auth
 * (anonymous backup-upgrade / sign-in) live here instead of buried
 * in the sidebar.
 */

import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import AppIcon from "../../components/icons/AppIcon";
import { Button } from "../../components/shadcn/button";
import { Field } from "../../components/shadcn/field";
import { Input } from "../../components/shadcn/input";
import { Label } from "../../components/shadcn/label";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/shadcn/avatar";
import { Toggle } from "../../components/shadcn/toggle";
import { ToggleGroup, ToggleGroupItem } from "../../components/shadcn/toggle-group";
import { Item, ItemContent, ItemGroup, ItemSeparator } from "../../components/shadcn/item";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../components/shadcn/alert-dialog";
import { MediaValidationError, uploadPostMedia, validateMediaFile } from "../../lib/cloudinaryUpload";
import { friendlyError } from "../../lib/supabaseClient.js";
import { updateSocialProfile } from "../social/postsApi";
import { getDisplayName } from "../auth/authSession";
import "./settingsdashboard.css";

export default function SettingsDashboard({ darkMode, onThemeToggle }) {
  const { t, lang, chooseLang } = useLang();
  const { user, isAnonymous, ready, signOut, deleteAccount } = useAuth();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savedDisplayName, setSavedDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const metadata = user?.user_metadata || {};
    const name = getDisplayName(user);
    setDisplayName(name);
    setSavedDisplayName(name.trim());
    setAvatarUrl(metadata.avatar_url || "");
  }, [user?.id, user?.user_metadata]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }
    const preview = URL.createObjectURL(avatarFile);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatarFile]);

  const profileDirty = Boolean(user) && (
    displayName.trim() !== savedDisplayName
    || Boolean(avatarFile)
    || (removeAvatar && Boolean(avatarUrl))
  );
  const normalizedDeleteConfirmation = deleteConfirmation.trim();
  const accountEmail = (user?.email || "").trim().toLowerCase();
  const canConfirmDelete = accountEmail
    ? normalizedDeleteConfirmation.toLowerCase() === accountEmail
    : normalizedDeleteConfirmation.toUpperCase() === "DELETE";

  const handleSignOut = async () => {
    setAccountBusy(true);
    setAccountError("");
    try {
      await signOut();
    } catch (error) {
      setAccountError(friendlyError(error, t, "settingsActionError"));
    } finally {
      setAccountBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canConfirmDelete || accountBusy) return;
    setAccountBusy(true);
    setAccountError("");
    try {
      await deleteAccount();
    } catch (error) {
      setAccountError(friendlyError(error, t, "settingsActionError"));
      setDeleteDialogOpen(false);
    } finally {
      setAccountBusy(false);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileError("");
    setProfileSuccess("");
    try {
      validateMediaFile(file);
      if (!file.type.startsWith("image/")) throw new MediaValidationError("unsupportedType");
      setAvatarFile(file);
      setRemoveAvatar(false);
    } catch (error) {
      setAvatarFile(null);
      setProfileError(error.message === "imageTooLarge" ? t("socialImageTooLarge") : t("settingsAvatarInvalid"));
      event.target.value = "";
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!profileDirty || profileBusy) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 40) {
      setProfileError(t("settingsNameValidation"));
      return;
    }
    setProfileBusy(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const uploadedAvatar = avatarFile ? await uploadPostMedia(avatarFile) : null;
      const nextAvatarUrl = removeAvatar ? null : uploadedAvatar?.url || avatarUrl || null;
      await updateSocialProfile({ user, displayName: name, avatarUrl: nextAvatarUrl });
      setAvatarUrl(nextAvatarUrl || "");
      setSavedDisplayName(name);
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setRemoveAvatar(false);
      setProfileSuccess(t("settingsProfileSaved"));
    } catch (error) {
      setProfileError(friendlyError(error, t, "settingsProfileSaveError"));
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <div className="settings-dashboard">
      {user && (
        <form className="settings-profile" onSubmit={handleProfileSave}>
          <div className="settings-profile__avatar-wrap relative mx-auto size-24">
            <button
              type="button"
              className="settings-profile__avatar-button size-24 rounded-full"
              disabled={profileBusy}
              onClick={() => avatarInputRef.current?.click()}
              aria-label={t("settingsChangePhoto")}
            >
              <Avatar className="size-24">
                <AvatarImage src={avatarPreview || (!removeAvatar ? avatarUrl : "") || undefined} alt="" />
                <AvatarFallback>{displayName.trim().slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
            <Button type="button" variant="secondary" size="icon" className="absolute bottom-0 end-0 rounded-full" onClick={() => avatarInputRef.current?.click()} disabled={profileBusy} aria-label={t("settingsChangePhoto")}><AppIcon name="camera" size={20} /></Button>
            <input
              ref={avatarInputRef}
              className="settings-profile__file"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={profileBusy}
              aria-label={t("settingsAvatar")}
            />
          </div>
          <Label className="settings-profile__name-label" htmlFor="settings-display-name">{t("settingsDisplayName")}</Label>
          <Input
            id="settings-display-name"
            type="text"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setProfileError("");
              setProfileSuccess("");
            }}
            placeholder={t("settingsDisplayNamePlaceholder")}
            maxLength={40}
            autoComplete="name"
            disabled={profileBusy}
            required
          />
          {(profileError || profileSuccess) && (
            <div className="settings-profile__feedback">
              {profileError && <p className="settings-dashboard__error" role="alert">{profileError}</p>}
              {profileSuccess && <p className="settings-profile__success" role="status">{profileSuccess}</p>}
            </div>
          )}
          <div className="settings-profile__actions">
            <Button type="submit" busy={profileBusy} disabled={!profileDirty}>{t("settingsSaveProfile")}</Button>
            {(avatarUrl || avatarFile) && !removeAvatar && (
              <Button
                type="button"
                disabled={profileBusy}
                variant="ghost"
                onClick={() => {
                  setAvatarFile(null);
                  if (avatarInputRef.current) avatarInputRef.current.value = "";
                  setRemoveAvatar(Boolean(avatarUrl));
                  setProfileError("");
                  setProfileSuccess("");
                }}
              >
                {t("settingsRemoveAvatar")}
              </Button>
            )}
          </div>
        </form>
      )}

      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsAccount")}</h2>
        <ItemGroup className="settings-dashboard__group">
          {!ready ? (
            <Item role="listitem" className="settings-dashboard__row"><ItemContent><span className="settings-dashboard__muted">{t("settingsLoading")}</span></ItemContent></Item>
          ) : (
            <>
              <Item role="listitem" className="settings-dashboard__row"><ItemContent>{isAnonymous
                ? <span className="settings-dashboard__muted">{t("settingsAnonymousDesc")}</span>
                : <span className="settings-dashboard__email">{user?.email}</span>}</ItemContent></Item>
              <ItemSeparator />
              <Item asChild role="listitem" className="settings-dashboard__row settings-dashboard__row-action">
                <button type="button" onClick={handleSignOut} disabled={accountBusy}>
                  <ItemContent>{t("settingsLogout")}</ItemContent>
                  {accountBusy && <span>{t("settingsLoading")}</span>}
                </button>
              </Item>
            </>
          )}
        </ItemGroup>
      </section>

      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsPreferences")}</h2>
        <ItemGroup className="settings-dashboard__group">
          <Item role="listitem" className="settings-dashboard__preference">
            <ItemContent className="settings-dashboard__preference-label">{darkMode ? t("toLightMode") : t("toDarkMode")}</ItemContent>
            <Toggle
              type="button"
              pressed={darkMode}
              onPressedChange={onThemeToggle}
              aria-label={darkMode ? t("toLightMode") : t("toDarkMode")}
              className="h-11 w-11 shrink-0 p-0"
            >
              <AppIcon name={darkMode ? "sun" : "moon"} size={19} />
            </Toggle>
          </Item>
          <ItemSeparator />
          <Item role="listitem" className="settings-dashboard__preference">
            <ItemContent className="settings-dashboard__preference-label"><span className="inline-flex items-center gap-3"><AppIcon name="globe" size={19} />{t("changeLang")}</span></ItemContent>
            <ToggleGroup type="single" value={lang} onValueChange={(value) => value && chooseLang(value)} aria-label={t("changeLang")} className="settings-dashboard__language">
              <ToggleGroupItem value="en" variant="outline" size="sm" className="min-h-11 min-w-11" aria-label={t("settingsLanguageEnglish")}>EN</ToggleGroupItem>
              <ToggleGroupItem value="ur" variant="outline" size="sm" className="min-h-11 min-w-11" aria-label={t("settingsLanguageUrdu")}>اردو</ToggleGroupItem>
            </ToggleGroup>
          </Item>
        </ItemGroup>
      </section>
      <section className="settings-dashboard__danger">
        <h2 className="settings-dashboard__danger-heading">{t("settingsDangerZone")}</h2>
        <div className="settings-dashboard__danger-row">
          <div className="settings-dashboard__danger-copy">
            <h3>{t("settingsDangerTitle")}</h3>
            <p>{t("settingsDangerDescription")}</p>
          </div>
          <Button
            type="button"
            disabled={accountBusy}
            variant="destructive-outline"
            onClick={() => {
              setAccountError("");
              setDeleteConfirmation("");
              setDeleteDialogOpen(true);
            }}
          >
            {t("settingsDeleteAccount")}
          </Button>
        </div>
      </section>
      {accountError && <p className="settings-dashboard__error" role="alert">{accountError}</p>}

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (open) setDeleteDialogOpen(true);
        else {
          if (!accountBusy) {
            setDeleteDialogOpen(false);
            setDeleteConfirmation("");
          }
        }
      }}
      >
        <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settingsDeleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("settingsDeleteWarning")}</AlertDialogDescription>
        </AlertDialogHeader>
        <Field className="settings-delete__field">
          <Label htmlFor="settings-delete-confirmation" className="text-foreground">{t("settingsDeleteConfirmLabel")}</Label>
          <Input
            id="settings-delete-confirmation"
            type="text"
            autoComplete="off"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={accountEmail
              ? t("settingsDeleteEmailPlaceholder")
              : t("settingsDeleteWordPlaceholder")}
            aria-describedby="settings-delete-confirmation-hint"
            disabled={accountBusy}
          />
          <p id="settings-delete-confirmation-hint" className="text-sm text-muted-foreground">
            {accountEmail
              ? t("settingsDeleteConfirmHintEmail")
              : t("settingsDeleteConfirmHintWord")}
          </p>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={accountBusy} onClick={() => setDeleteConfirmation("")}>
            {t("settingsDeleteCancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={accountBusy || !canConfirmDelete}
            variant="destructive-outline"
            busy={accountBusy}
            onClick={handleDeleteAccount}
          >
            {t("settingsDeleteConfirm")}
          </Button>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}