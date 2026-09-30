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
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { MediaValidationError, uploadPostMedia, validateMediaFile } from "../../lib/cloudinaryUpload";
import { updateSocialProfile } from "../social/postsApi";
import "./settingsdashboard.css";

export default function SettingsDashboard({ darkMode, onThemeToggle }) {
  const { t, lang, chooseLang } = useLang();
  const { user, isAnonymous, ready, signOut, deleteAccount } = useAuth();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const metadata = user?.user_metadata || {};
    setDisplayName(metadata.display_name || metadata.full_name || metadata.name || metadata.username || "");
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

  const handleSignOut = async () => {
    setAccountBusy(true);
    setAccountError("");
    try {
      await signOut();
    } catch (error) {
      setAccountError(error.message || t("settingsActionError"));
    } finally {
      setAccountBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    setAccountBusy(true);
    setAccountError("");
    try {
      await deleteAccount();
    } catch (error) {
      setAccountError(error.message || t("settingsActionError"));
      setDeleteDialogOpen(false);
    } finally {
      setAccountBusy(false);
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileError("");
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
      setAvatarFile(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setRemoveAvatar(false);
      setProfileSuccess(t("settingsProfileSaved"));
    } catch (error) {
      setProfileError(error.message || t("settingsProfileSaveError"));
    } finally {
      setProfileBusy(false);
    }
  };

  return (
    <div className="settings-dashboard">
      {/* ── Account ── */}
      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">
          <span className="settings-dashboard__heading-icon" aria-hidden="true">
            <AppIcon name="user" size={19} />
          </span>
          <span>{t("settingsAccount")}</span>
        </h2>

        {!ready ? (
          <p className="settings-dashboard__muted">{t("settingsLoading")}</p>
        ) : (
          <div className="settings-dashboard__account">
            {isAnonymous ? (
              <p className="settings-dashboard__muted">{t("settingsAnonymousDesc")}</p>
            ) : (
              <>
                <p className="settings-dashboard__muted">{t("settingsSignedInAs")}</p>
                <p className="settings-dashboard__email">{user?.email}</p>
              </>
            )}
            {user && (
              <form className="settings-profile" onSubmit={handleProfileSave}>
                <h3>{t("settingsProfileTitle")}</h3>
                <label htmlFor="settings-display-name">{t("settingsDisplayName")}</label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t("settingsDisplayNamePlaceholder")}
                  maxLength={40}
                  autoComplete="name"
                  disabled={profileBusy}
                  required
                />
                <div className="settings-profile__avatar-row">
                  {(avatarPreview || (!removeAvatar && avatarUrl)) ? (
                    <img src={avatarPreview || avatarUrl} alt="" className="settings-profile__avatar" />
                  ) : (
                    <span className="settings-profile__avatar settings-profile__avatar--empty" aria-hidden="true">
                      {displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="settings-profile__avatar-actions">
                    <input
                      ref={avatarInputRef}
                      className="settings-profile__file"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={profileBusy}
                      aria-label={t("settingsAvatar")}
                    />
                    <Button type="button" variant="secondary" disabled={profileBusy} onClick={() => avatarInputRef.current?.click()}>
                      {t("settingsChooseAvatar")}
                    </Button>
                    {(avatarUrl || avatarFile) && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={profileBusy}
                        onClick={() => {
                          setAvatarFile(null);
                          if (avatarInputRef.current) avatarInputRef.current.value = "";
                          setRemoveAvatar(true);
                        }}
                      >
                        {t("settingsRemoveAvatar")}
                      </Button>
                    )}
                  </div>
                </div>
                {profileError && <p className="settings-dashboard__error" role="alert">{profileError}</p>}
                {profileSuccess && <p className="settings-profile__success" role="status">{profileSuccess}</p>}
                <Button type="submit" busy={profileBusy} fullWidth>{t("settingsSaveProfile")}</Button>
              </form>
            )}
            <div className="settings-dashboard__actions">
              <Button
                type="button"
                busy={accountBusy}
                variant="secondary"
                fullWidth
                onClick={handleSignOut}
              >
                {t("settingsLogout")}
              </Button>
              <Button
                type="button"
                disabled={accountBusy}
                variant="ghost"
                fullWidth
                className="settings-dashboard__delete"
                onClick={() => { setAccountError(""); setDeleteDialogOpen(true); }}
              >
                {t("settingsDeleteAccount")}
              </Button>
            </div>
            {accountError && <p className="settings-dashboard__error" role="alert">{accountError}</p>}
          </div>
        )}
      </section>

      {/* ── Preferences ── */}
      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">
          <span className="settings-dashboard__heading-icon" aria-hidden="true">
            <AppIcon name="settings" size={19} />
          </span>
          <span>{t("settingsPreferences")}</span>
        </h2>

        <div className="settings-dashboard__preferences">
          <Button
            variant="secondary"
            fullWidth
            className="settings-dashboard__preference"
            onClick={onThemeToggle}
          >
            <span className="settings-dashboard__preference-label">
              <AppIcon name={darkMode ? "sun" : "moon"} size={19} />
              {darkMode ? t("toLightMode") : t("toDarkMode")}
            </span>
          </Button>

          <Button
            variant="secondary"
            fullWidth
            className="settings-dashboard__preference"
            onClick={() => chooseLang(lang === "ur" ? "en" : "ur")}
          >
            <span className="settings-dashboard__preference-label">
              <AppIcon name="globe" size={18} />
              {t("changeLang")}
            </span>
            <span className="settings-dashboard__preference-value">
              {lang === "ur" ? "EN" : "اردو"}
            </span>
          </Button>
        </div>
      </section>

      <Modal
        open={deleteDialogOpen}
        onClose={() => !accountBusy && setDeleteDialogOpen(false)}
        labelledBy="settings-delete-title"
        describedBy="settings-delete-warning"
        disableClose={accountBusy}
        className="ui-auth-dialog"
      >
        <h2 className="ui-dialog-title" id="settings-delete-title">{t("settingsDeleteConfirmTitle")}</h2>
        <p className="ui-dialog-copy" id="settings-delete-warning">{t("settingsDeleteWarning")}</p>
        <div className="ui-dialog-actions">
          <Button
            type="button"
            disabled={accountBusy}
            variant="secondary"
            onClick={() => setDeleteDialogOpen(false)}
          >
            {t("settingsDeleteCancel")}
          </Button>
          <Button
            type="button"
            disabled={accountBusy}
            variant="danger"
            busy={accountBusy}
            onClick={handleDeleteAccount}
          >
            {t("settingsDeleteConfirm")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}