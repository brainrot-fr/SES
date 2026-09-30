import { motion } from "framer-motion";
import "./ui.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  busy = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth && "ui-button--full",
    className,
  ].filter(Boolean).join(" ");

  return (
    <motion.button
      {...props}
      className={classes}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      whileHover={!disabled && !busy ? { y: -1 } : undefined}
      whileTap={!disabled && !busy ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.14 }}
    >
      {busy && <span className="ui-button__spinner" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}
