/**
 * SettingsDashboard.jsx
 * Central settings/account page — language, theme, and auth
 * (anonymous backup-upgrade / sign-in) live here instead of buried
 * in the sidebar.
 */

import { useState } from "react";
import { useLang } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import AuthUpgradeDialog from "../auth/AuthUpgradeDialog";
import SignInDialog from "../auth/SignInDialog";

export default function SettingsDashboard({ darkMode, onThemeToggle }) {
  const { t, lang, resetLang } = useLang();
  const { user, isAnonymous, ready } = useAuth();

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);

  return (
    <div className="max-w-[520px] mx-auto p-4 pb-24">
      {/* ── Account ── */}
      <section className="mb-8">
        <h2 className="text-[1.05rem] font-bold text-heading mb-3 pb-2 border-b border-hairline">
          {t("settingsAccount")}
        </h2>

        {!ready ? (
          <p className="text-sm text-muted">{t("settingsLoading")}</p>
        ) : isAnonymous ? (
          <div className="bg-surface-1 border border-hairline rounded-md p-4">
            <p className="text-sm text-body m-0 mb-3">
              {t("settingsAnonymousDesc")}
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 px-4 rounded-md text-sm font-semibold bg-primary text-on-primary cursor-pointer"
                onClick={() => setAuthDialogOpen(true)}
              >
                {t("authBackupData")}
              </button>
              <button
                className="flex-1 py-2.5 px-4 rounded-md text-sm font-semibold bg-surface-3 text-body cursor-pointer"
                onClick={() => setSignInDialogOpen(true)}
              >
                {t("signInMenuLabel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-1 border border-hairline rounded-md p-4">
            <p className="text-sm text-muted m-0 mb-1">{t("settingsSignedInAs")}</p>
            <p className="text-sm font-semibold text-heading m-0">{user?.email}</p>
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

      <AuthUpgradeDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
      <SignInDialog
        open={signInDialogOpen}
        onClose={() => setSignInDialogOpen(false)}
      />
    </div>
  );
}