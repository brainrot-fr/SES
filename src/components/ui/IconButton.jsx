import { motion } from "framer-motion";
import AppIcon from "../icons/AppIcon";
import "./ui.css";

export default function IconButton({ as: Component = "button", icon, label, size = 22, className = "", type, ...props }) {
  const ButtonComponent = Component === "button" ? motion.button : Component;
  return (
    <ButtonComponent
      {...props}
      {...(Component === "button" ? {
        type: type ?? "button",
        whileHover: { scale: 1.04 },
        whileTap: { scale: 0.94 },
        transition: { duration: 0.14 },
      } : {})}
      className={`ui-icon-button ui-icon-button--${icon}${className ? ` ${className}` : ""}`}
      aria-label={label}
    >
      <AppIcon name={icon} size={size} />
    </ButtonComponent>
  );
}
