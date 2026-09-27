/**
 * App.jsx
 * Main application shell for the SES PWA.
 */

import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import "./App.css";
import AppIcon from "./components/icons/AppIcon";
import Sidebar from "./components/sidebar";
import IconButton from "./components/ui/IconButton";
import Onboarding from "./components/Onboarding";
import AuthGate from "./features/auth/AuthGate";
import { useLang } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import { initNaqlNotificationLifecycle } from "./notifications/naqlNotifications";

const NaqlDashboard = lazy(() => import("./features/nuqool/en/naqlDashboard"));
const Timeline = lazy(() => import("./features/timeline/timeline"));
const Quran = lazy(() => import("./features/quran/Quran"));
const Murshid = lazy(() => import("./features/murshid/Murshid"));
const SettingsDashboard = lazy(() => import("./features/settings/SettingsDashboard"));
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const SocialFeed = lazy(() => import("./features/social/SocialFeed"));
const ReelUpload = lazy(() => import("./features/social/ReelUpload"));

const MurshidIcon = () => <AppIcon name="murshid" size={20} />;

const HomeIcon = () => <AppIcon name="home" size={20} />;

const BookIcon = () => <AppIcon name="quran" size={20} />;

const ScrollIcon = () => <AppIcon name="nuqool" size={20} />;

const ClockIcon = () => <AppIcon name="timeline" size={20} />;

const MoreIcon = () => <AppIcon name="settings" size={20} />;

const SocialIcon = () => <AppIcon name="social" size={20} />;

function BottomNav({ items, activePage, onNavigate, label, inert = false }) {
  const renderItem = (it) => (
    <button
      type="button"
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
    <nav className="bottom-nav" aria-label={label} inert={inert}>
      {items.map(renderItem)}
    </nav>
  );
}

function DesktopNav({ items, activePage, onNavigate, label }) {
  return (
    <nav className="desktop-nav" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={`desktop-nav__item${activePage === item.id ? " desktop-nav__item--active" : ""}`}
          onClick={() => onNavigate(item.id)}
          aria-current={activePage === item.id ? "page" : undefined}
        >
          <span className="desktop-nav__icon">{item.icon}</span>
          <span className="desktop-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Small wrapper so QuranReader's initialSurah comes from the URL param ── */
function QuranRoute() {
  const { surahNumber, ayahNumber } = useParams();
  const navigate = useNavigate();
  const n = parseInt(surahNumber, 10);
  const ayah = parseInt(ayahNumber, 10);
  const selectedSurah = !isNaN(n) && n >= 1 && n <= 114 ? n : null;
  const selectedAyah = Number.isInteger(ayah) && ayah > 0 ? ayah : null;

  return (
    <Quran
      selectedSurah={selectedSurah}
      selectedAyah={selectedAyah}
      onSelectSurah={(s) => navigate(s == null ? "/quran" : `/quran/${s}`)}
    />
  );
}

/* ── Small wrapper so NaqlDashboard's openNaqlRequest comes from the URL ── */
function NuqoolRoute({ openNaqlRequest }) {
  const { naqlNumber } = useParams();
  const n = parseInt(naqlNumber, 10);
  const requestFromUrl = !isNaN(n) ? { number: n, ts: 0 } : null;
  // openNaqlRequest (from a notification tap) takes priority when fresher
  const effective = openNaqlRequest?.ts > 0 ? openNaqlRequest : requestFromUrl;
  return <NaqlDashboard openNaqlRequest={effective} />;
}

export default function App() {
  const { lang, t } = useLang();
  const { user, isAnonymous, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("ses-theme-v2") === "dark");
  const [openNaqlRequest, setOpenNaqlRequest] = useState(null);

  // top-level "section" for nav highlighting, derived from the URL
  const currentPage = location.pathname.split("/")[1] || "dashboard";
  const canGoBack = currentPage === "quran" && /^\/quran\/\d+/.test(location.pathname);
  const pageTitles = {
    dashboard: t("titleDashboard"),
    nuqool: t("titleNuqool"),
    quran: t("titleQuran"),
    timeline: t("titleTimeline"),
    murshid: t("titleMurshid"),
    social: t("titleSocial"),
    reels: t("navReels"),
    settings: t("titleSettings"),
  };

  const sidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => { sidebarOpenRef.current = sidebarOpen; }, [sidebarOpen]);

  // Android hardware back button: close sidebar, then let the router's own
  // history stack handle "back" (HashRouter uses the browser history API,
  // so navigate(-1) pops correctly), then exit if there's nowhere to go.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let handle;
    CapApp.addListener("backButton", () => {
      if (sidebarOpenRef.current) {
        setSidebarOpen(false);
        return;
      }
      if (window.history.length > 1 && location.pathname !== "/quran") {
        navigate(-1);
        return;
      }
      CapApp.exitApp();
    }).then((h) => { handle = h; });
    return () => handle?.remove();
  }, [navigate, location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "";
    localStorage.setItem("ses-theme-v2", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const cleanup = initNaqlNotificationLifecycle((naqlNumber) => {
      navigate(`/nuqool/${naqlNumber}`);
      setOpenNaqlRequest({ number: naqlNumber, ts: Date.now() });
    });
    return cleanup;
  }, [navigate]);

  useEffect(() => {
    const title = !lang ? t("appTitle") : pageTitles[currentPage] ?? t("appTitle");
    document.title = title === t("appTitle") ? title : `${title} · ${t("appTitle")}`;
  }, [currentPage, lang, t]);

  if (!lang) return <Onboarding />;
  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center bg-bg text-sm text-muted">{t("settingsLoading")}</div>;
  }
  if (!user || isAnonymous) return <AuthGate />;

  const navItems = [
    { id: "dashboard", label: t("navDashboard"), icon: <HomeIcon /> },
    { id: "quran", label: t("navQuran"), icon: <BookIcon /> },
    { id: "nuqool", label: t("navNuqool"), icon: <ScrollIcon /> },
    { id: "murshid", label: t("navMurshid"), icon: <MurshidIcon /> },
    { id: "social", label: t("navSocial"), icon: <SocialIcon /> },
    { id: "timeline", label: t("navTimeline"), icon: <ClockIcon /> },
    { id: "settings", label: t("titleSettings"), icon: <MoreIcon /> },
  ];

  const primaryNavItems = navItems.filter((it) => ["dashboard", "quran", "nuqool", "murshid", "social"].includes(it.id));
  const secondaryNavItems = navItems.filter((it) => ["timeline", "settings"].includes(it.id));

  return (
    <div className="app-root">
      <a className="app-skip-link" href="#main-content">{t("skipToContent")}</a>
      <header className="app-header" inert={sidebarOpen}>
        {canGoBack ? (
          <IconButton className="app-header__btn" icon="back" size={18} onClick={() => navigate("/quran")} label={t("goBack")} />
        ) : (
          <IconButton
            className="app-header__btn app-header__menu-btn"
            icon="menu"
            size={18}
            onClick={() => setSidebarOpen(true)}
            label={t("openMenu")}
            aria-controls="app-navigation-drawer"
            aria-expanded={sidebarOpen}
          />
        )}

        <span className="app-header__title">{pageTitles[currentPage] ?? t("appTitle")}</span>

        <IconButton
          className="app-header__btn"
          icon={darkMode ? "sun" : "moon"}
          size={18}
          onClick={() => setDarkMode((d) => !d)}
          label={darkMode ? t("toLightMode") : t("toDarkMode")}
          title={darkMode ? t("toLightMode") : t("toDarkMode")}
        />
      </header>

      <Sidebar
        items={secondaryNavItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        darkMode={darkMode}
        onThemeToggle={() => setDarkMode((d) => !d)}
        activePage={currentPage === "reels" ? "social" : currentPage}
        onNavigate={(id) => {
          navigate(`/${id}`);
          setSidebarOpen(false);
        }}
      />

      <main id="main-content" className="app-main" inert={sidebarOpen}>
        <Suspense fallback={<div className="app-loading" role="status">{t("settingsLoading")}</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/nuqool" element={<NuqoolRoute openNaqlRequest={openNaqlRequest} />} />
            <Route path="/nuqool/:naqlNumber" element={<NuqoolRoute openNaqlRequest={openNaqlRequest} />} />
            <Route path="/quran" element={<QuranRoute />} />
            <Route path="/quran/:surahNumber/:ayahNumber" element={<QuranRoute />} />
            <Route path="/quran/:surahNumber" element={<QuranRoute />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/murshid" element={<Murshid />} />
            <Route path="/social" element={<SocialFeed />} />
            <Route path="/reels" element={<SocialFeed mode="reels" />} />
            <Route path="/reels/create" element={<ReelUpload />} />
            <Route
              path="/settings"
              element={<SettingsDashboard darkMode={darkMode} onThemeToggle={() => setDarkMode((d) => !d)} />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>

      <BottomNav
        items={primaryNavItems}
        activePage={currentPage === "reels" ? "social" : currentPage}
        onNavigate={(id) => navigate(`/${id}`)}
        label={t("primaryNavigation")}
        inert={sidebarOpen}
      />
      <DesktopNav
        items={navItems}
        activePage={currentPage === "reels" ? "social" : currentPage}
        onNavigate={(id) => navigate(`/${id}`)}
        label={t("primaryNavigation")}
      />
    </div>
  );
}