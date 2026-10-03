import { motion, useReducedMotion } from "framer-motion";
import "./ui.css";

function getCssDurationSeconds(tokenName) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  const duration = Number.parseFloat(value);
  if (!Number.isFinite(duration)) return 0;
  return value.endsWith("ms") ? duration / 1000 : duration;
}

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
  const prefersReducedMotion = useReducedMotion();
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
      whileHover={!disabled && !busy && !prefersReducedMotion ? { y: -1 } : undefined}
      whileTap={!disabled && !busy && !prefersReducedMotion ? { scale: 0.98 } : undefined}
      transition={{ duration: prefersReducedMotion ? 0 : getCssDurationSeconds("--duration-fast") }}
    >
      {busy && <span className="ui-button__spinner" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}
