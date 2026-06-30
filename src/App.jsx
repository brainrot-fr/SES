import { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/sidebar';
import NaqlDashboard from './features/nuqool/en/naqlDashboard';
import Timeline from './features/timeline/Timeline';
import Onboarding from './components/Onboarding';
import { useLang } from './context/LanguageContext';

// ── Icons ────────────────────────────────────────────────────
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z"/>
  </svg>
);

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M14 2a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12zM2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2z"/>
    <path d="M3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4z"/>
  </svg>
);

// ── Component ────────────────────────────────────────────────
export default function App() {
  const { lang, t } = useLang();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage]  = useState('nuqool');
  const [darkMode, setDarkMode]        = useState(
    () => localStorage.getItem('ses-theme') === 'dark'
  );
  // Notification tap → open a specific naql
  const [openNaqlRequest, setOpenNaqlRequest] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : '';
    localStorage.setItem('ses-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Gate the whole app behind language selection
  if (!lang) return <Onboarding />;

  const navItems = [
    { id: 'nuqool',   label: t('navNuqool') },
    { id: 'timeline', label: t('navTimeline') },
  ];

  const pageTitles = {
    nuqool:   t('titleNuqool'),
    timeline: t('titleTimeline'),
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'timeline': return <Timeline />;
      default:         return <NaqlDashboard openNaqlRequest={openNaqlRequest} />;
    }
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <button
          className="app-header__btn"
          onClick={() => setSidebarOpen(true)}
          aria-label={t('openMenu')}
        >
          <HamburgerIcon />
        </button>

        <span className="app-header__title">
          {pageTitles[currentPage] ?? t('appTitle')}
        </span>

        <button
          className="app-header__btn"
          onClick={() => setDarkMode(d => !d)}
          aria-label={darkMode ? t('toLightMode') : t('toDarkMode')}
          title={darkMode ? t('toLightMode') : t('toDarkMode')}
        >
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <Sidebar
        items={navItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        darkMode={darkMode}
        onThemeToggle={() => setDarkMode(d => !d)}
        activePage={currentPage}
        onNavigate={(id) => { setCurrentPage(id); setSidebarOpen(false); }}
      />

      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
}