import AppIcon from "../icons/AppIcon";
import "./ui.css";

export default function IconButton({ as: Component = "button", icon, label, size = 22, className = "", type, ...props }) {
  return (
    <Component
      {...props}
      {...(Component === "button" ? { type: type ?? "button" } : {})}
      className={`ui-icon-button ui-icon-button--${icon}${className ? ` ${className}` : ""}`}
      aria-label={label}
    >
      <AppIcon name={icon} size={size} />
    </Component>
  );
}
