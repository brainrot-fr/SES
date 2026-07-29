/**
 * App.jsx
 * Main application shell for the SES PWA.
 *
 * - Imports the shared context, top-level features, and notification lifecycle.
 * - Manages page state, theme mode, sidebar visibility, toast notifications,
 *   and handling of notification taps.
 * - Renders the sticky header, sidebar, bottom nav, and current page view.
 */

import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import "./App.css";
import Sidebar from "./components/sidebar";
import NaqlDashboard from "./features/nuqool/en/naqlDashboard";
import Timeline from "./features/timeline/timeline";
import Quran from "./features/quran/Quran";
import Murshid from "./features/murshid/Murshid";
import Onboarding from "./components/Onboarding";
import { useLang } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import AuthUpgradeDialog from "./features/auth/AuthUpgradeDialog";
import SignInDialog from "./features/auth/SignInDialog";
import {
  initNaqlNotificationLifecycle,
  scheduleTestNotification,
} from "./notifications/naqlNotifications";
import SettingsDashboard from "./features/settings/SettingsDashboard";
``;

/* ── Icons ──────────────────────────────────────────────────── */
const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z" />
  </svg>
);

const MurshidIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    <path
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
    />
  </svg>
);

const HamburgerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z" />
    <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z" />
  </svg>
);

const BookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
    />
  </svg>
);

const ScrollIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 3H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2m0-5h10a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2M8 3v18M6 8h2m8 0a2 2 0 1 1-4 0m4 0V3m-4 5V3m0 18h10a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H8"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7v5l3 3"
    />
  </svg>
);

const MoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 12H5m6 7-7-7 7-7"
    />
  </svg>
);

function BottomNav({ items, activePage, onNavigate, onMore, moreLabel }) {
  const mid = Math.ceil(items.length / 2);
  const before = items.slice(0, mid);
  const after = items.slice(mid);

  const renderItem = (it) => (
    <button
      key={it.id}
      className={`bottom-nav__item ${activePage === it.id ? "bottom-nav__item--active" : ""}`}
      onClick={() => onNavigate(it.id)}
      aria-current={activePage === it.id ? "page" : undefined}
    >
      <span className="bottom-nav__icon">{it.icon}</span>
      <span className="bottom-nav__label">{it.label}</span>
    </button>
  );

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {before.map(renderItem)}
      <button
        className="bottom-nav__item bottom-nav__item--center"
        onClick={onMore}
        aria-label={moreLabel}
      >
        <span className="bottom-nav__icon bottom-nav__icon--center">
          <MoreIcon />
        </span>
      </button>
      {after.map(renderItem)}
    </nav>
  );
}

/* ── Component ──────────────────────────────────────────────── */
export default function App() {
  const { lang, t } = useLang();
  const { isAnonymous } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("quran");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("ses-theme-v2") === "dark",
  );
  const [toastMessage, setToastMessage] = useState(null);
  const [openNaqlRequest, setOpenNaqlRequest] = useState(null);
  const QURAN_STORAGE_KEY = "ses-current-surah";
  const [quranSurah, setQuranSurah] = useState(() => {
    const n = parseInt(localStorage.getItem(QURAN_STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= 114 ? n : null;
  });

  const canGoBack = currentPage === "quran" && quranSurah != null;
  const canGoBackRef = useRef(canGoBack);
  const sidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => {
    canGoBackRef.current = canGoBack;
  }, [canGoBack]);
  useEffect(() => {
    sidebarOpenRef.current = sidebarOpen;
  }, [sidebarOpen]);

  // Android hardware back button: close the sidebar, then step out of the
  // Quran reader, then exit — same priority order the header back arrow uses.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let handle;
    CapApp.addListener("backButton", () => {
      if (sidebarOpenRef.current) {
        setSidebarOpen(false);
        return;
      }
      if (canGoBackRef.current) {
        setQuranSurah(null);
        return;
      }
      CapApp.exitApp();
    }).then((h) => {
      handle = h;
    });
    return () => handle?.remove();
  }, []);

  /* Keep the theme preference in sync with <html> and localStorage. */
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "";
    localStorage.setItem("ses-theme-v2", darkMode ? "dark" : "light");
  }, [darkMode]);

  /* Show toast messages for a short duration and then clear them. */
  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  /*
   * Initialize the Naql notification lifecycle once on mount.
   * This schedules notifications and listens for taps from the native OS.
   */

  useEffect(() => {
    const cleanup = initNaqlNotificationLifecycle((naqlNumber) => {
      setCurrentPage("nuqool");
      setOpenNaqlRequest({ number: naqlNumber, ts: Date.now() });
    });
    return cleanup;
  }, []);

  /*
   * Gate the whole app behind language selection. The onboarding
   * screen is shown only until the user picks a language.
   */

  if (!lang) return <Onboarding />;

  /* Navigation items shown both in the sidebar and bottom tab bar. */
  const navItems = [
    { id: "nuqool", label: t("navNuqool"), icon: <ScrollIcon /> },
    { id: "quran", label: t("navQuran"), icon: <BookIcon /> },
    { id: "timeline", label: t("navTimeline"), icon: <ClockIcon /> },
    { id: "murshid", label: t("navMurshid"), icon: <MurshidIcon /> },
    { id: "settings", label: t("Settings"), icon: <MoreIcon /> },
  ];

  /* Curated subset — shown in the bottom tab bar. Keep this short;
  everything else lives behind the center "More" button. */
  const primaryNavItems = navItems.filter((it) =>
    ["nuqool", "quran"].includes(it.id),
  );

  /* Localized page titles for the current route. */
  const pageTitles = {
    nuqool: t("titleNuqool"),
    quran: t("titleQuran"),
    timeline: t("titleTimeline"),
    murshid: t("titleMurshid"),
  };

  /* Trigger a short test notification and surface success/failure as a toast. */
  const handleTestNotification = async () => {
    /*
     * Attempt a near-term local notification for testing purposes.
     * Any failure is shown to the user rather than crashing the app.
     */

    try {
      await scheduleTestNotification(10);
      setToastMessage(t("notificationScheduled"));
    } catch (err) {
      console.error("[App] test notification failed", err);
      setToastMessage(t("notificationScheduleFailed"));
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "timeline":
        return <Timeline />;
      case "nuqool":
        return <NaqlDashboard openNaqlRequest={openNaqlRequest} />;
      case "murshid":
        return <Murshid />;
      case "settings":
        return (
          <SettingsDashboard
            darkMode={darkMode}
            onThemeToggle={() => setDarkMode((d) => !d)}
          />
        );
      default:
        return (
          <Quran selectedSurah={quranSurah} onSelectSurah={setQuranSurah} />
        );
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        {canGoBack ? (
          <button
            className="app-header__btn"
            onClick={() => setQuranSurah(null)}
            aria-label={t("goBack")}
          >
            <BackIcon />
          </button>
        ) : (
          <span
            className="app-header__btn app-header__btn--placeholder"
            aria-hidden="true"
          />
        )}

        <span className="app-header__title">
          {pageTitles[currentPage] ?? t("appTitle")}
        </span>

        <button
          className="app-header__btn"
          onClick={() => setDarkMode((d) => !d)}
          aria-label={darkMode ? t("toLightMode") : t("toDarkMode")}
          title={darkMode ? t("toLightMode") : t("toDarkMode")}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <Sidebar
        items={navItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        darkMode={darkMode}
        onThemeToggle={() => setDarkMode((d) => !d)}
        activePage={currentPage}
        onNavigate={(id) => {
          setCurrentPage(id);
          setSidebarOpen(false);
        }}
        onTestNotification={handleTestNotification}
        isAnonymous={isAnonymous}
        onBackupData={() => {
          setAuthDialogOpen(true);
          setSidebarOpen(false);
        }}
        onSignIn={() => {
          setSignInDialogOpen(true);
          setSidebarOpen(false);
        }}
      />

      <AuthUpgradeDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />

      <SignInDialog
        open={signInDialogOpen}
        onClose={() => setSignInDialogOpen(false)}
      />

      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <main className="app-main">{renderPage()}</main>
      <BottomNav
        items={primaryNavItems}
        activePage={currentPage}
        onNavigate={(id) => setCurrentPage(id)}
        onMore={() => setSidebarOpen(true)}
        moreLabel={t("menu")}
      />
    </div>
  );
}
