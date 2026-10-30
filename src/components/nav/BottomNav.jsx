import AppIcon from "@/components/icons/AppIcon";

export default function BottomNav({
  items,
  activePage,
  onNavigate,
  onPreload,
  label,
  inert = false,
}) {
  return (
    <nav
      aria-label={label}
      inert={inert}
      className="bottom-nav fixed inset-x-0 bottom-[var(--bottom-nav-gap)] z-[100] mx-auto flex w-[min(30rem,calc(100vw-24px))] rounded-[var(--radius-md)] border border-border bg-card/95 p-1 shadow-lg supports-[backdrop-filter]:bg-card/75 supports-[backdrop-filter]:backdrop-blur-md lg:hidden"
    >
      {items.map((item) => {
        const active = activePage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            onMouseEnter={() => onPreload(item.id)}
            onFocus={() => onPreload(item.id)}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className="group flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] text-xs font-medium text-muted-foreground transition-colors active:scale-[0.98] aria-[current=page]:text-primary motion-reduce:active:scale-100"
          >
            <span className="grid h-7 w-14 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-primary/15">
              <AppIcon name={item.iconName} size={22} filled={active} />
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
