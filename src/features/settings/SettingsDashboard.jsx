/**
 * SettingsDashboard.jsx
 * Central settings/account page — language, theme, and auth
 * (anonymous backup-upgrade / sign-in) live here instead of buried
 * in the sidebar.
 */

import { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import AppIcon from "../../components/icons/AppIcon";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import "./settingsdashboard.css";

export default function SettingsDashboard({ darkMode, onThemeToggle }) {
  const { t, lang, chooseLang } = useLang();
  const { user, isAnonymous, ready, signOut, deleteAccount } = useAuth();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");

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