/**
 * SettingsDashboard.jsx
 * Central settings/account page — language, theme, and auth
 * (anonymous backup-upgrade / sign-in) live here instead of buried
 * in the sidebar.
 */

import { useState } from "react";
import { Dialog } from "@mui/material";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import './settingsdashboard.css'

export default function SettingsDashboard({ darkMode, onThemeToggle }) {
  const { t, lang, resetLang } = useLang();
  const { user, ready, signOut, deleteAccount } = useAuth();

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
    <div className="max-w-[520px] mx-auto p-4 pb-24">
      {/* ── Account ── */}
      <section className="mb-8">
        <h2 className="text-[1.05rem] font-bold text-heading mb-3 pb-2 border-b border-hairline">
          {t("settingsAccount")}
        </h2>

        {!ready ? (
          <p className="text-sm text-muted">{t("settingsLoading")}</p>
        ) : (
          <div className="bg-surface-2 border border-hairline rounded-md p-4">
            <p className="text-sm text-muted m-0 mb-1">{t("settingsSignedInAs")}</p>
            <p className="text-sm font-semibold text-heading m-0 break-all">{user?.email}</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={accountBusy}
                className="w-full rounded-md border border-hairline bg-surface-1 px-4 py-3 text-left text-sm font-semibold text-body disabled:opacity-60"
                onClick={handleSignOut}
              >
                {t("settingsLogout")}
              </button>
              <button
                type="button"
                disabled={accountBusy}
                className="w-full rounded-md border border-hairline bg-surface-1 px-4 py-3 text-left text-sm font-semibold text-danger disabled:opacity-60"
                onClick={() => { setAccountError(""); setDeleteDialogOpen(true); }}
              >
                {t("settingsDeleteAccount")}
              </button>
            </div>
            {accountError && <p className="mb-0 mt-3 text-sm text-danger" role="alert">{accountError}</p>}
          </div>
        )}
      </section>

      {/* ── Preferences ── */}
      <section className="mb-8">
        <h2 className="text-[1.05rem] font-bold text-heading mb-3 pb-2 border-b border-hairline">
          {t("settingsPreferences")}
        </h2>

        <div className="flex flex-col gap-2">
          <button
            className="flex items-center justify-between w-full px-4 py-3 bg-surface-1 border border-hairline rounded-md text-body cursor-pointer text-sm"
            onClick={onThemeToggle}
          >
            <span>{darkMode ? t("toLightMode") : t("toDarkMode")}</span>
            <span aria-hidden="true">{darkMode ? "☀️" : "🌙"}</span>
          </button>

          <button
            className="flex items-center justify-between w-full px-4 py-3 bg-surface-1 border border-hairline rounded-md text-body cursor-pointer text-sm"
            onClick={resetLang}
          >
            <span>{t("changeLang")}</span>
            <span aria-hidden="true">🌐 {lang === "ur" ? "اردو" : "EN"}</span>
          </button>
        </div>
      </section>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !accountBusy && setDeleteDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: "var(--panel)",
            color: "var(--text-small)",
            borderRadius: "12px",
            p: 3,
          },
        }}
      >
        <h2 className="m-0 text-lg font-bold text-heading">{t("settingsDeleteConfirmTitle")}</h2>
        <p className="mb-5 mt-3 text-sm leading-relaxed text-muted">{t("settingsDeleteWarning")}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={accountBusy}
            className="rounded-md border border-hairline bg-surface-2 px-4 py-2.5 text-sm font-semibold text-body"
            onClick={() => setDeleteDialogOpen(false)}
          >
            {t("settingsDeleteCancel")}
          </button>
          <button
            type="button"
            disabled={accountBusy}
            className="rounded-md border-0 bg-danger px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            onClick={handleDeleteAccount}
          >
            {t("settingsDeleteConfirm")}
          </button>
        </div>
      </Dialog>
    </div>
  );
}