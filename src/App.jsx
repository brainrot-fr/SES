/**
 * App.jsx
 * Main application shell for the SES PWA.
 */

import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
import homeNavIcon from "./assets/icons/home.svg";
import quranNavIcon from "./assets/icons/quran.svg";
import nuqoolNavIcon from "./assets/icons/nuqool.svg";
import reelsNavIcon from "./assets/icons/reels.svg";
import socialNavIcon from "./assets/icons/social.svg";
import murshidNavIcon from "./assets/icons/murshid.svg";
import timelineNavIcon from "./assets/icons/timeline.svg";
import settingsNavIcon from "./assets/icons/settings.svg";

const NaqlDashboard = lazy(() => import("./features/nuqool/en/naqlDashboard"));
const Timeline = lazy(() => import("./features/timeline/timeline"));
const Quran = lazy(() => import("./features/quran/Quran"));
const Murshid = lazy(() => import("./features/murshid/Murshid"));
const SettingsDashboard = lazy(() => import("./features/settings/SettingsDashboard"));
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const SocialFeed = lazy(() => import("./features/social/SocialFeed"));
const ReelUpload = lazy(() => import("./features/social/ReelUpload"));
const PostCreate = lazy(() => import("./features/social/PostCreate"));

function BottomNav({ items, activePage, onNavigate, label, inert = false }) {
  const renderItem = (it) => {
    const active = activePage === it.id;
    return (
    <motion.button
      type="button"
      key={it.id}
      className={`bottom-nav__item${active ? " bottom-nav__item--active" : ""}`}
      onClick={() => onNavigate(it.id)}
      aria-current={active ? "page" : undefined}
      aria-label={it.label}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.14 }}
    >
      <span className="bottom-nav__icon"><AppIcon name={it.iconName} size={22} filled={active} /></span>
      <span className="bottom-nav__label">{it.label}</span>
    </motion.button>
    );
  };

  return (
    <nav className="bottom-nav" aria-label={label} inert={inert}>
      {items.map(renderItem)}
    </nav>
  );
}

function DesktopNav({ items, activePage, onNavigate, label }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.nav
      className="desktop-nav"
      aria-label={label}
      initial={false}
      animate={{ width: expanded ? 236 : 64 }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
      }}
    >
      <motion.button
        type="button"
        className="desktop-nav__brand"
        aria-label={items.find((item) => item.id === "dashboard")?.label}
        onClick={() => onNavigate("dashboard")}
        whileTap={{ scale: 0.95 }}
      >
        <img src="/app-mark.png" alt="" className="desktop-nav__brand-mark" />
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.span
              className="desktop-nav__brand-name"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.14 }}
            >
              SES
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <div className="desktop-nav__items">
        {items.map((item) => (
          <motion.button
            type="button"
            key={item.id}
            className={`desktop-nav__item${activePage === item.id ? " desktop-nav__item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={activePage === item.id ? "page" : undefined}
            title={!expanded ? item.label : undefined}
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.14 }}
          >
            <span
              aria-hidden="true"
              className="desktop-nav__icon"
              style={{ "--nav-icon": `url("${item.navIcon}")` }}
            />
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.span
                  className="desktop-nav__label"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.14 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </motion.nav>
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
    { id: "dashboard", label: t("navDashboard"), iconName: "home", navIcon: homeNavIcon },
    { id: "quran", label: t("navQuran"), iconName: "quran", navIcon: quranNavIcon },
    { id: "nuqool", label: t("navNuqool"), iconName: "nuqool", navIcon: nuqoolNavIcon },
    { id: "reels", label: t("navReels"), iconName: "reels", navIcon: reelsNavIcon },
    { id: "social", label: t("navSocial"), iconName: "social", navIcon: socialNavIcon },
    { id: "murshid", label: t("navMurshid"), iconName: "murshid", navIcon: murshidNavIcon },
    { id: "timeline", label: t("navTimeline"), iconName: "timeline", navIcon: timelineNavIcon },
    { id: "settings", label: t("titleSettings"), iconName: "settings", navIcon: settingsNavIcon },
  ];

  const primaryNavItems = navItems.filter((it) => ["dashboard", "quran", "nuqool", "reels", "social"].includes(it.id));
  const secondaryNavItems = navItems.filter((it) => ["murshid", "timeline", "settings"].includes(it.id));

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="route-transition"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Suspense fallback={<motion.div className="app-loading" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{t("settingsLoading")}</motion.div>}>
              <Routes location={location}>
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
                <Route path="/social/create" element={<PostCreate />} />
                <Route path="/reels" element={<SocialFeed mode="reels" />} />
                <Route path="/reels/create" element={<ReelUpload />} />
                <Route
                  path="/settings"
                  element={<SettingsDashboard darkMode={darkMode} onThemeToggle={() => setDarkMode((d) => !d)} />}
                />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav
        items={primaryNavItems}
        activePage={currentPage}
        onNavigate={(id) => navigate(`/${id}`)}
        label={t("primaryNavigation")}
        inert={sidebarOpen}
      />
      <DesktopNav
        items={navItems}
        activePage={currentPage}
        onNavigate={(id) => navigate(`/${id}`)}
        label={t("primaryNavigation")}
      />
    </div>
  );
}