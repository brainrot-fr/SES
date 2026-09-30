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
import Group from "../../components/layout/Group";
import Row from "../../components/layout/Row";
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
      {user && (
        <form className="settings-profile" onSubmit={handleProfileSave}>
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
              <button type="button" className="settings-profile__link" disabled={profileBusy} onClick={() => avatarInputRef.current?.click()}>
                {t("settingsChangePhoto")}
              </button>
              {(avatarUrl || avatarFile) && (
                <button
                  type="button"
                  className="settings-profile__link"
                  disabled={profileBusy}
                  onClick={() => {
                    setAvatarFile(null);
                    if (avatarInputRef.current) avatarInputRef.current.value = "";
                    setRemoveAvatar(true);
                  }}
                >
                  {t("settingsRemoveAvatar")}
                </button>
              )}
            </div>
          </div>
          <label className="settings-profile__name-label" htmlFor="settings-display-name">{t("settingsDisplayName")}</label>
          <input
            id="settings-display-name"
            className="settings-profile__name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t("settingsDisplayNamePlaceholder")}
            maxLength={40}
            autoComplete="name"
            disabled={profileBusy}
            required
          />
          {profileError && <p className="settings-dashboard__error" role="alert">{profileError}</p>}
          {profileSuccess && <p className="settings-profile__success" role="status">{profileSuccess}</p>}
          <Button type="submit" busy={profileBusy} variant="ghost">{t("settingsSaveProfile")}</Button>
        </form>
      )}

      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsAccount")}</h2>
        <Group className="settings-dashboard__group">
          {!ready ? (
            <Row content={<span className="settings-dashboard__muted">{t("settingsLoading")}</span>} />
          ) : (
            <>
              <Row content={isAnonymous
                ? <span className="settings-dashboard__muted">{t("settingsAnonymousDesc")}</span>
                : <span className="settings-dashboard__email">{user?.email}</span>} />
              <Row
                as="button"
                type="button"
                className="settings-dashboard__row-action"
                content={t("settingsLogout")}
                trailing={accountBusy ? <span>{t("settingsLoading")}</span> : null}
                onClick={handleSignOut}
                disabled={accountBusy}
              />
            </>
          )}
        </Group>
      </section>

      <section className="settings-dashboard__section">
        <h2 className="settings-dashboard__heading">{t("settingsPreferences")}</h2>
        <Group className="settings-dashboard__group">
          <Row
            as="label"
            className="settings-dashboard__preference"
            content={(
              <span className="settings-dashboard__preference-label">
                <AppIcon name={darkMode ? "sun" : "moon"} size={19} />
                {darkMode ? t("toLightMode") : t("toDarkMode")}
              </span>
            )}
            trailing={(
              <span className="settings-dashboard__switch">
                <input type="checkbox" checked={darkMode} onChange={onThemeToggle} aria-label={darkMode ? t("toLightMode") : t("toDarkMode")} />
                <span aria-hidden="true" />
              </span>
            )}
          />
          <Row
            className="settings-dashboard__preference"
            content={<span className="settings-dashboard__preference-label"><AppIcon name="globe" size={19} />{t("changeLang")}</span>}
            trailing={(
              <div className="settings-dashboard__language" role="group" aria-label={t("changeLang")}>
                <button type="button" aria-label={t("settingsLanguageEnglish")} aria-pressed={lang === "en"} onClick={() => chooseLang("en")}>EN</button>
                <button type="button" aria-label={t("settingsLanguageUrdu")} aria-pressed={lang === "ur"} onClick={() => chooseLang("ur")}>اردو</button>
              </div>
            )}
          />
        </Group>
      </section>
      <button
        type="button"
        disabled={accountBusy}
        className="settings-dashboard__delete"
        onClick={() => { setAccountError(""); setDeleteDialogOpen(true); }}
      >
        {t("settingsDeleteAccount")}
      </button>
      {accountError && <p className="settings-dashboard__error" role="alert">{accountError}</p>}

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