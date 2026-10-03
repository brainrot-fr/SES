import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./ui.css";

const cssDurationCache = new Map();

export function getCssDurationSeconds(tokenName) {
  if (cssDurationCache.has(tokenName)) return cssDurationCache.get(tokenName);
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  const duration = Number.parseFloat(value);
  const seconds = !Number.isFinite(duration) ? 0 : value.endsWith("ms") ? duration / 1000 : duration;
  cssDurationCache.set(tokenName, seconds);
  return seconds;
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
  const [fastDuration, setFastDuration] = useState(0);
  useEffect(() => {
    setFastDuration(getCssDurationSeconds("--duration-fast"));
  }, []);
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
      transition={{ duration: prefersReducedMotion ? 0 : fastDuration }}
    >
      {busy && <span className="ui-button__spinner" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}
