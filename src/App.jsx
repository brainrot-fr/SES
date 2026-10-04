/**
 * App.jsx
 * Main application shell for the SES PWA.
 */

import { lazy, Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import "./App.css";
import AppIcon from "./components/icons/AppIcon";
import Sidebar from "./components/sidebar";
import IconButton from "./components/layout/IconButton";
import { AppShellSkeleton } from "./components/layout/Page";
import { Toaster } from "./components/shadcn/sonner";
import Onboarding from "./components/Onboarding";
import AuthGate from "./features/auth/AuthGate";
import { useLang } from "./context/LanguageContext";
import { useAuth } from "./context/AuthContext";
import { getCssDurationSeconds } from "./lib/utils";

const loadNaqlDashboard = () => import("./features/nuqool/en/naqlDashboard");
const loadTimeline = () => import("./features/timeline/timeline");
const loadQuran = () => import("./features/quran/Quran");
const loadMurshid = () => import("./features/murshid/Murshid");
const loadSettingsDashboard = () => import("./features/settings/SettingsDashboard");
const loadDashboard = () => import("./features/dashboard/Dashboard");
const loadSocialFeed = () => import("./features/social/SocialFeed");
const loadReelUpload = () => import("./features/social/ReelUpload");
const loadPostCreate = () => import("./features/social/PostCreate");

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

function BottomNav({ items, activePage, onNavigate, label, inert = false }) {
  return (
    <nav
      aria-label={label}
      inert={inert}
      className="bottom-nav fixed inset-x-0 bottom-[var(--bottom-nav-gap)] z-[100] mx-auto flex w-[min(30rem,calc(100vw-24px))] rounded-[var(--radius-md)] border border-border bg-card/95 p-1 shadow-lg supports-[backdrop-filter]:bg-card/75 supports-[backdrop-filter]:backdrop-blur-md lg:hidden"
    >
      {items.map((it) => {
        const active = activePage === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onNavigate(it.id)}
            onMouseEnter={() => preloadRoute(it.id)}
            onFocus={() => preloadRoute(it.id)}
            aria-current={active ? "page" : undefined}
            aria-label={it.label}
            className="group flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] text-xs font-medium text-muted-foreground transition-colors active:scale-[0.98] aria-[current=page]:text-primary motion-reduce:active:scale-100"
          >
            <span className="grid h-7 w-14 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-primary/15">
              <AppIcon name={it.iconName} size={22} filled={active} />
            </span>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}

function DesktopNav({ items, activePage, onNavigate, label }) {
  return (
    <nav className="desktop-nav" aria-label={label}>
      <button
        type="button"
        className="desktop-nav__brand"
        aria-label={items.find((item) => item.id === "dashboard")?.label}
        onClick={() => onNavigate("dashboard")}
        onMouseEnter={() => preloadRoute("dashboard")}
        onFocus={() => preloadRoute("dashboard")}
      >
        <AppIcon name="home" size={28} className="desktop-nav__brand-mark" />
        <span className="desktop-nav__brand-name">SES</span>
      </button>
      <div className="desktop-nav__items">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`desktop-nav__item${activePage === item.id ? " desktop-nav__item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
            onMouseEnter={() => preloadRoute(item.id)}
            onFocus={() => preloadRoute(item.id)}
            aria-label={item.label}
            aria-current={activePage === item.id ? "page" : undefined}
            title={item.label}
          >
            <span className="desktop-nav__icon"><AppIcon name={item.iconName} size={24} filled={activePage === item.id} /></span>
            <span className="desktop-nav__label">{item.label}</span>
          </button>
        ))}
      </div>
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
  const requestFromUrl = useMemo(() => {
    const number = parseInt(naqlNumber, 10);
    return !isNaN(number) ? { number, ts: 0 } : null;
  }, [naqlNumber]);
  // openNaqlRequest (from a notification tap) takes priority when fresher
  const effective = openNaqlRequest?.ts > 0 ? openNaqlRequest : requestFromUrl;
  return <NaqlDashboard openNaqlRequest={effective} />;
}

export default function App() {
  const { lang, t } = useLang();
  const { user, isAnonymous, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("ses-theme-v2") === "dark");
  const [openNaqlRequest, setOpenNaqlRequest] = useState(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const headerSentinelRef = useRef(null);
  const previousDarkModeRef = useRef(darkMode);
  const [readyLocation, setReadyLocation] = useState(location);
  const [baseDuration, setBaseDuration] = useState(0);
  const openNaql = useCallback((naqlNumber) => {
    navigate(`/nuqool/${naqlNumber}`);
    setOpenNaqlRequest({ number: naqlNumber, ts: Date.now() });
  }, [navigate]);

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
    root.dataset.theme = darkMode ? "dark" : "";
    localStorage.setItem("ses-theme-v2", darkMode ? "dark" : "light");
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
    let cancelled = false;
    let cleanup;
    import("./notifications/naqlNotifications").then(({ initNaqlNotificationLifecycle }) => {
      if (cancelled) return;
      cleanup = initNaqlNotificationLifecycle(openNaql);
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [openNaql]);

  useEffect(() => {
    if (!user || isAnonymous) return undefined;
    let cancelled = false;
    let cleanup;
    import("./notifications/naqlNotifications").then(({ initNaqlPush }) => {
      if (!cancelled) cleanup = initNaqlPush({ lang, onOpenNaql: openNaql });
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [user?.id, isAnonymous, lang, openNaql]);

  useEffect(() => {
    const title = !lang ? t("appTitle") : pageTitles[currentPage] ?? t("appTitle");
    document.title = title === t("appTitle") ? title : `${title} · ${t("appTitle")}`;
  }, [currentPage, lang, t]);

  if (!lang) return <Onboarding />;
  if (!ready) {
    return <AppShellSkeleton label={t("settingsLoading")} />;
  }
  if (!user || isAnonymous) return <AuthGate socialWriteGate={isAnonymous} />;

  const navItems = [
    { id: "dashboard", label: t("navDashboard"), iconName: "home" },
    { id: "quran", label: t("navQuran"), iconName: "quran" },
    { id: "nuqool", label: t("navNuqool"), iconName: "nuqool" },
    { id: "reels", label: t("navReels"), iconName: "reels" },
    { id: "social", label: t("navSocial"), iconName: "social" },
    { id: "murshid", label: t("navMurshid"), iconName: "murshid" },
    { id: "timeline", label: t("navTimeline"), iconName: "timeline" },
    { id: "settings", label: t("titleSettings"), iconName: "settings" },
  ];

  const primaryNavItems = navItems.filter((it) => ["dashboard", "quran", "nuqool", "reels", "social"].includes(it.id));
  const secondaryNavItems = navItems.filter((it) => ["murshid", "timeline", "settings"].includes(it.id));

  return (
    <div className="app-root">
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
        activePage={currentPage === "reels" ? "social" : currentPage}
        onNavigate={(id) => {
          void preloadRoute(id).then(() => {
            navigate(`/${id}`);
            setSidebarOpen(false);
          });
        }}
      />

      <main id="main-content" className="app-main" inert={sidebarOpen}>
        <motion.div
          key={location.pathname}
          className="route-transition"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : baseDuration, ease: "easeOut" }}
        >
          <Suspense fallback={<AppShellSkeleton label={t("settingsLoading")} bodyOnly />}>
            <Routes location={renderedLocation}>
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
      </main>

      <BottomNav
        items={primaryNavItems}
        activePage={currentPage}
        onNavigate={(id) => {
          void preloadRoute(id).then(() => navigate(`/${id}`));
        }}
        label={t("primaryNavigation")}
        inert={sidebarOpen}
      />
      <DesktopNav
        items={navItems}
        activePage={currentPage}
        onNavigate={(id) => {
          void preloadRoute(id).then(() => navigate(`/${id}`));
        }}
        label={t("primaryNavigation")}
      />
      <Toaster position="top-center" />
    </div>
  );
}