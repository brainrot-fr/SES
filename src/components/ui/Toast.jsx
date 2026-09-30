import { useEffect, useState } from "react";
import "./ui.css";

export default function Toast({ children, variant = "info", className = "", duration = 4000, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className={`ui-toast ui-toast--${variant}${className ? ` ${className}` : ""}`} role="status" aria-live="polite">
      {children}
    </div>
  );
}
