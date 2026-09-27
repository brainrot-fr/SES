import { useLang } from "../context/LanguageContext";
import AppIcon from "./icons/AppIcon";

export default function Sidebar({
  items,
  isOpen,
  onClose,
  darkMode,
  onThemeToggle,
  activePage,
  onNavigate,
  onTestNotification,
}) {
  const { t, resetLang, isRTL } = useLang();
  const drawerPosition = isRTL ? "right-0 left-auto" : "left-0";
  const drawerClosedPosition = isRTL ? "translate-x-full" : "-translate-x-full";

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[900] cursor-pointer border-0 bg-black/45 p-0 backdrop-blur-[2px]"
          onClick={onClose}
          aria-label={t("closeMenu")}
        />
      )}
      <aside
        id="app-navigation-drawer"
        aria-label={t("menu")}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed top-0 ${drawerPosition} z-[1000] flex h-dvh w-[280px] max-w-[85vw] flex-col border-hairline bg-surface-2 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-body shadow-lg transition-transform duration-200 ease-in-out ${isRTL ? "border-l" : "border-r"} ${isOpen ? "translate-x-0" : drawerClosedPosition}`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-hairline px-4 py-3 font-semibold text-heading">
          <span>{t("menu")}</span>
          <button
            type="button"
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-body transition-colors hover:bg-surface-3"
            onClick={onClose}
            aria-label={t("closeMenu")}
          >
            <AppIcon name="close" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t("mainNavigation")}>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-start text-sm transition-colors ${
                activePage === item.id
                  ? "border-primary/15 bg-primary-soft font-semibold text-primary"
                  : "text-body hover:bg-surface-3"
              }`}
              onClick={() => onNavigate(item.id)}
              aria-current={activePage === item.id ? "page" : undefined}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-hairline p-4">
          <button
            type="button"
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-surface-3 px-4 py-3 text-start text-sm text-body shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md"
            onClick={onThemeToggle}
          >
            <AppIcon name={darkMode ? "sun" : "moon"} size={19} />
            {darkMode ? t("toLightMode") : t("toDarkMode")}
          </button>
          <button
            type="button"
            className="mt-2 flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-surface-3 px-4 py-3 text-start text-sm text-body shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md"
            onClick={resetLang}
          >
            <AppIcon name="globe" size={19} />
            {t("changeLang")}
          </button>
          <button
            type="button"
            className="mt-2 flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-surface-3 px-4 py-3 text-start text-sm text-primary shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md"
            onClick={onTestNotification}
          >
            <AppIcon name="bell" size={19} />
            {t("testNotification")}
          </button>
        </div>
      </aside>
    </>
  );
}
