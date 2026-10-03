import { useLang } from "../context/LanguageContext";
import AppIcon from "./icons/AppIcon";
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "./shadcn/primitives";

export default function Sidebar({
  items,
  isOpen,
  onClose,
  activePage,
  onNavigate,
}) {
  const { t, isRTL } = useLang();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        id="app-navigation-drawer"
        side={isRTL ? "right" : "left"}
        className="z-[1000] border-border bg-card pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between">
          <SheetTitle>{t("menu")}</SheetTitle>
          <SheetClose aria-label={t("closeMenu")}>
            <AppIcon name="close" size={18} />
          </SheetClose>
        </div>
        <nav className="flex flex-col gap-1" aria-label={t("mainNavigation")}>
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start gap-3 rounded-sm px-4 text-start"
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
