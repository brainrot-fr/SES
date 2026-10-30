/**
 * App.jsx
 * Main application shell for the SES PWA.
 */

import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import "@/App.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/nav/BottomNav";
import DesktopNav from "@/components/nav/DesktopNav";
import IconButton from "@/components/layout/IconButton";
import { AppShellSkeleton } from "@/components/layout/Page";
import { Progress } from "@/components/shadcn/progress";
import { Toaster } from "@/components/shadcn/sonner";
import Onboarding from "@/components/Onboarding";
import AuthGate from "@/features/auth/AuthGate";
import RecoveryGate from "@/features/auth/RecoveryGate";
import { useLang } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getCssDurationSeconds } from "@/lib/utils";
import { hasPublishedMurshidLineage } from "@/features/murshid/murshidData";
import { QURAN_SURAH_COUNT } from "@/features/quran/count";
import { NAQL_COUNT } from "@/features/nuqool/count";

const loadNaqlDashboard = () => import("@/features/nuqool/naqlDashboard");
const loadTimeline = () => import("@/features/timeline/timeline");
const loadQuran = () => import("@/features/quran/Quran");
const loadMurshid = () => import("@/features/murshid/Murshid");
const loadSettingsDashboard = () => import("@/features/settings/SettingsDashboard");
const loadDashboard = () => import("@/features/dashboard/Dashboard");
const loadSocialFeed = () => import("@/features/social/SocialFeed");
const loadReelUpload = () => import("@/features/social/ReelUpload");
const loadPostCreate = () => import("@/features/social/PostCreate");

const NaqlDashboard = lazy(loadNaqlDashboard);
const Timeline = lazy(loadTimeline);
const Quran = lazy(loadQuran);
const Murshid = lazy(loadMurshid);
const SettingsDashboard = lazy(loadSettingsDashboard);
const Dashboard = lazy(loadDashboard);
const SocialFeed = lazy(loadSocialFeed);
const ReelUpload = lazy(loadReelUpload);
const PostCreate = lazy(loadPostCreate);

const routePreloaders = {
  dashboard: loadDashboard,
  nuqool: loadNaqlDashboard,
  quran: loadQuran,
  timeline: loadTimeline,
  murshid: loadMurshid,
  settings: loadSettingsDashboard,
  social: loadSocialFeed,
  reels: loadSocialFeed,
};

function preloadRoute(routeId) {
  const preload = routePreloaders[routeId];
  return preload ? preload().catch(() => undefined) : Promise.resolve();
}

function preloadPath(pathname) {
  if (pathname.startsWith("/social/create")) return loadPostCreate().catch(() => undefined);
  if (pathname.startsWith("/reels/create")) return loadReelUpload().catch(() => undefined);
  return preloadRoute(pathname.split("/")[1] || "dashboard");
}

function getInitialDarkMode() {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  try {
    const savedTheme = localStorage.getItem("ses-theme-v2");
    return savedTheme === "dark" || (savedTheme === null && prefersDark);
  } catch {
    return prefersDark;
  }
}

/* ── Small wrapper so QuranReader's initialSurah comes from the URL param ── */
function QuranRoute() {
  const { surahNumber, ayahNumber } = useParams();
  const navigate = useNavigate();
  const n = parseInt(surahNumber, 10);
  const ayah = parseInt(ayahNumber, 10);
  const selectedSurah = !isNaN(n) && n >= 1 && n <= QURAN_SURAH_COUNT ? n : null;
  const selectedAyah = Number.isInteger(ayah) && ayah > 0 ? ayah : null;

  return (
    <Quran
      selectedSurah={selectedSurah}
      selectedAyah={selectedAyah}
      onNavigate={(surah) => navigate(`/quran/${surah}`, { replace: true })}
    />
  );
}

/* ── Naql selection is sourced from the URL; the reader handles saved progress. ── */
function NuqoolRoute() {
  const { naqlNumber } = useParams();
  const number = Number.parseInt(naqlNumber, 10);
  const initialNaql = Number.isInteger(number) && number >= 1 && number <= NAQL_COUNT ? number : null;
  return <NaqlDashboard initialNaql={initialNaql} />;
}

function NotificationBootstrap({ lang, user, onOpenNaql }) {
  useEffect(() => {
    let cancelled = false;
    let cleanup;
    import("@/notifications/naqlNotifications").then(({ initNaqlNotificationLifecycle }) => {
      if (!cancelled) cleanup = initNaqlNotificationLifecycle(onOpenNaql);
    }).catch((error) => console.error("[naqlNotifications] lifecycle initialization failed", error));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [onOpenNaql]);

  useEffect(() => {
    let cancelled = false;
    let cleanup;
    import("@/notifications/naqlNotifications").then(({ initNaqlPush }) => {
      if (!cancelled) cleanup = initNaqlPush({ lang, onOpenNaql });
    }).catch((error) => console.error("[push] initialization failed", error));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user.id, lang, onOpenNaql]);

  return null;
}

export default function App() {
  const { lang, t } = useLang();
  const { user, isAnonymous, ready, passwordRecovery } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const headerSentinelRef = useRef(null);
  const previousDarkModeRef = useRef(darkMode);
  const [readyLocation, setReadyLocation] = useState(location);
  const [baseDuration, setBaseDuration] = useState(0);
  const openNaql = useCallback((naqlNumber) => navigate(`/nuqool/${naqlNumber}`), [navigate]);

  useEffect(() => {
    setBaseDuration(getCssDurationSeconds("--duration-base"));
  }, []);

  // top-level "section" for nav highlighting, derived from the URL
  const currentPage = location.pathname.split("/")[1] || "dashboard";
  const canGoBack = location.pathname !== "/dashboard" && window.history.state?.idx > 0;
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
      if (location.pathname === "/dashboard" || !(window.history.state?.idx > 0)) {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    }).then((h) => { handle = h; });
    return () => handle?.remove();
  }, [navigate, location.pathname]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("ses-theme-v2", darkMode ? "dark" : "light");
    const themeColor = getComputedStyle(root).getPropertyValue("--bg").trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
    const themeChanged = previousDarkModeRef.current !== darkMode;
    previousDarkModeRef.current = darkMode;
    if (themeChanged) {
      root.classList.add("theme-transition");
      const transitionMs = getCssDurationSeconds("--duration-slow") * 1000;
      const timeoutId = window.setTimeout(() => root.classList.remove("theme-transition"), transitionMs);
      return () => window.clearTimeout(timeoutId);
    }
  }, [darkMode]);

  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setHeaderScrolled(!entry.isIntersecting);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isCurrentLocation = true;
    preloadPath(location.pathname).then(() => {
      if (isCurrentLocation) setReadyLocation(location);
    });
    return () => {
      isCurrentLocation = false;
    };
  }, [location]);
  const renderedLocation = readyLocation.key === location.key ? location : readyLocation;

  useEffect(() => {
    const title = !lang ? t("appTitle") : pageTitles[currentPage] ?? t("appTitle");
    document.title = title === t("appTitle") ? title : `${title} · ${t("appTitle")}`;
  }, [currentPage, lang, t]);

  if (!lang) return <Onboarding />;
  if (!ready) {
    return <AppShellSkeleton label={t("settingsLoading")} />;
  }
  if (passwordRecovery) return <RecoveryGate />;
  if (!user || isAnonymous) return <AuthGate />;

  const navItems = [
    { id: "dashboard", label: t("navDashboard"), iconName: "home" },
    { id: "quran", label: t("navQuran"), iconName: "quran" },
    { id: "nuqool", label: t("navNuqool"), iconName: "nuqool" },
    { id: "reels", label: t("navReels"), iconName: "reels" },
    { id: "social", label: t("navSocial"), iconName: "social" },
    { id: "murshid", label: t("navMurshid"), iconName: "murshid" },
    { id: "timeline", label: t("navTimeline"), iconName: "timeline" },
    { id: "settings", label: t("titleSettings"), iconName: "settings" },
  ].filter((item) => item.id !== "murshid" || hasPublishedMurshidLineage);

  const primaryNavItems = navItems.filter((it) => ["dashboard", "quran", "nuqool", "reels", "social"].includes(it.id));
  const secondaryNavItems = navItems.filter((it) => ["murshid", "timeline", "settings"].includes(it.id));
  const pageTitle = location.pathname === "/social/create"
    ? t("titleCreatePost")
    : pageTitles[currentPage] ?? t("appTitle");

  return (
    <div className="app-root">
      <NotificationBootstrap lang={lang} user={user} onOpenNaql={openNaql} />
      <a className="app-skip-link" href="#main-content">{t("skipToContent")}</a>
      <div ref={headerSentinelRef} className="app-header-sentinel" aria-hidden="true" />
      <header className={`app-header${headerScrolled ? " app-header--scrolled bg-background/95 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-md border-b border-border" : ""}`} inert={sidebarOpen}>
        {canGoBack ? (
          <IconButton className="app-header__btn" icon="back" size={18} onClick={() => navigate(-1)} label={t("goBack")} />
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

        <span className="app-header__title">{pageTitle}</span>

        <IconButton
          className="app-header__btn"
          icon="settings"
          size={18}
          onClick={() => navigate("/settings")}
          label={t("titleSettings")}
        />
      </header>

      <Sidebar
        items={secondaryNavItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={currentPage === "reels" ? "social" : currentPage}
        onNavigate={(id) => {
          void preloadRoute(id).then(() => {
            navigate(`/${id}`);
            setSidebarOpen(false);
          });
        }}
      />

      <main id="main-content" className="app-main" inert={sidebarOpen}>
        {readyLocation.key !== location.key && (
          <Progress
            aria-label={t("routeLoading")}
            value={65}
            className="fixed inset-x-0 top-0 z-[120] h-0.5 rounded-none"
          />
        )}
        <motion.div
          key={renderedLocation.pathname}
          className="route-transition"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : baseDuration, ease: "easeOut" }}
        >
          <Suspense fallback={<AppShellSkeleton label={t("settingsLoading")} bodyOnly />}>
            <Routes location={renderedLocation}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/nuqool" element={<NuqoolRoute />} />
              <Route path="/nuqool/:naqlNumber" element={<NuqoolRoute />} />
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
      </main>

      <BottomNav
        items={primaryNavItems}
        activePage={currentPage}
        onNavigate={(id) => {
          void preloadRoute(id).then(() => navigate(`/${id}`));
        }}
        onPreload={preloadRoute}
        label={t("primaryNavigation")}
        inert={sidebarOpen}
      />
      <DesktopNav
        items={navItems}
        activePage={currentPage}
        onNavigate={(id) => {
          void preloadRoute(id).then(() => navigate(`/${id}`));
        }}
        onPreload={preloadRoute}
        label={t("primaryNavigation")}
      />
      <Toaster position="top-center" theme={darkMode ? "dark" : "light"} />
    </div>
  );
}