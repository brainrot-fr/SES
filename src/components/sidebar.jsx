import AppIcon from "./icons/AppIcon";
import { Button } from "./shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "./shadcn/sheet";
import { useLang } from "../context/LanguageContext";

export default function Sidebar({
  items,
  isOpen,
  onClose,
  activePage,
  onNavigate,
}) {
  const { t, isRTL } = useLang();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        id="app-navigation-drawer"
        side={isRTL ? "right" : "left"}
        showCloseButton={false}
        className="w-[280px] max-w-[85vw] gap-0 border-border bg-card pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <SheetTitle>{t("menu")}</SheetTitle>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={t("closeMenu")}>
            <AppIcon name="close" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label={t("mainNavigation")}>
          {items.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              className="min-h-12 w-full justify-start gap-3 rounded-md px-4 text-start aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold aria-[current=page]:text-primary"
              onClick={() => onNavigate(item.id)}
              aria-current={activePage === item.id ? "page" : undefined}
            >
              <AppIcon name={item.iconName} size={20} />
              <span>{item.label}</span>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
