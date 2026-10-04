/**
 * SettingsDashboard.jsx
 * Central settings/account page — language, theme, and auth
 * (anonymous backup-upgrade / sign-in) live here instead of buried
 * in the sidebar.
 */

import { useEffect, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/shadcn/button";
import { Field } from "../../components/shadcn/field";
import { Input } from "../../components/shadcn/input";
import { Label } from "../../components/shadcn/label";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../components/shadcn/alert-dialog";
import { MediaValidationError, uploadPostMedia, validateMediaFile } from "../../lib/cloudinaryUpload";
import { friendlyError } from "../../lib/supabaseClient.js";
import { updateSocialProfile } from "../social/postsApi";
import { getDisplayName } from "../auth/authSession";
import {
  SettingsAccountSection,
  SettingsPreferencesSection,
  SettingsProfileForm,
} from "./SettingsSections";
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
      <SettingsProfileForm
        user={user}
        t={t}
        profile={{
          displayName,
          setDisplayName,
          profileBusy,
          profileDirty,
          profileError,
          profileSuccess,
          avatarUrl,
          avatarPreview,
          avatarFile,
          removeAvatar,
          avatarInputRef,
          handleAvatarChange,
          handleProfileSave,
          setAvatarFile,
          setRemoveAvatar,
          setProfileError,
          setProfileSuccess,
        }}
      />

      <SettingsAccountSection
        user={user}
        isAnonymous={isAnonymous}
        ready={ready}
        accountBusy={accountBusy}
        onSignOut={handleSignOut}
        t={t}
      />
      <SettingsPreferencesSection
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
        lang={lang}
        chooseLang={chooseLang}
        t={t}
      />
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