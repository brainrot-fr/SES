import AppIcon from "../icons/AppIcon";
import Button from "./Button";
import "./ui.css";

export default function EmptyState({
  icon = "sparkle",
  eyebrow,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}) {
  return (
    <section className={`ui-empty-state${className ? ` ${className}` : ""}`}>
      <span className="ui-empty-state__icon" aria-hidden="true"><AppIcon name={icon} size={25} /></span>
      {eyebrow && <p className="ui-empty-state__eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {(action || secondaryAction) && (
        <div className="ui-empty-state__actions">
          {[action, secondaryAction].filter(Boolean).map((item, index) => (
            <Button
              key={item.label}
              type="button"
              variant={item.variant ?? (index === 0 ? "secondary" : "ghost")}
              onClick={item.onClick}
            >
              {item.icon && <AppIcon name={item.icon} size={18} />}
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}
