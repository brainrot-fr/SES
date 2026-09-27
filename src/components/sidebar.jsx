import { useLang } from '../context/LanguageContext';

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

export default function Sidebar({
  items, isOpen, onClose, darkMode, onThemeToggle, activePage, onNavigate, onTestNotification,
}) {
  const { t, resetLang } = useLang();

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[900]" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-screen w-[260px] flex flex-col bg-surface-2 text-body shadow-lg border-r border-hairline transition-transform duration-200 ease-in-out z-[1000] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-hairline font-semibold text-heading">
          <span>{t('menu')}</span>
          <button className="bg-transparent border-0 text-body text-lg cursor-pointer px-2 py-1 rounded-md leading-none hover:bg-surface-3" onClick={onClose} aria-label="Close menu">✕</button>
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col gap-1 p-3" aria-label="Main navigation">
          {items.map(it => (
            <button
              key={it.id}
              className={`text-left w-full cursor-pointer text-sm px-4 py-3 rounded-md transition-all duration-150 ${
                activePage === it.id
                  ? 'bg-primary-soft text-primary border-1'
                  : 'text-body hover:bg-primary-soft hover:translate-x-0.5'
              }`}
              onClick={() => onNavigate(it.id)}
              aria-current={activePage === it.id ? 'page' : undefined}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-hairline">
          <button
            className="flex items-center gap-2.5 w-full px-4 py-3 bg-surface-3 border-0 rounded-md text-body cursor-pointer text-sm shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px"
            onClick={onThemeToggle}
          >
            <span aria-hidden="true">{darkMode ? <SunIcon /> : <MoonIcon />}</span>
            {darkMode ? t('toLightMode') : t('toDarkMode')}
          </button>
          <button
            className="flex items-center gap-2.5 w-full mt-2 px-4 py-2.5 bg-surface-3 border-0 rounded-md text-body cursor-pointer text-sm shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px"
            onClick={resetLang}
          >
            🌐 {t('changeLang')}
          </button>
          <button
            className="flex items-center gap-2.5 w-full mt-2 px-4 py-2.5 bg-surface-3 border-0 rounded-md text-primary cursor-pointer text-sm shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px"
            onClick={onTestNotification}
          >
            🔔 {t('testNotification')}
          </button>
        </div>
      </aside>
    </>
  );
}