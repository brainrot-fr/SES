import AppIcon from "@/components/icons/AppIcon";

export default function DesktopNav({ items, activePage, onNavigate, onPreload, label }) {
  return (
    <nav className="desktop-nav" aria-label={label}>
      <button
        type="button"
        className="desktop-nav__brand"
        aria-label={items.find((item) => item.id === "dashboard")?.label}
        onClick={() => onNavigate("dashboard")}
        onMouseEnter={() => onPreload("dashboard")}
        onFocus={() => onPreload("dashboard")}
      >
        <AppIcon name="home" size={28} className="desktop-nav__brand-mark" />
        <span className="desktop-nav__brand-name">SES</span>
      </button>
      <div className="desktop-nav__items">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            data-group={item.id === "murshid" ? "secondary" : undefined}
            className={`desktop-nav__item${activePage === item.id ? " desktop-nav__item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
            onMouseEnter={() => onPreload(item.id)}
            onFocus={() => onPreload(item.id)}
            aria-label={item.label}
            aria-current={activePage === item.id ? "page" : undefined}
          >
            <span className="desktop-nav__icon"><AppIcon name={item.iconName} size={24} filled={activePage === item.id} /></span>
            <span className="desktop-nav__label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
