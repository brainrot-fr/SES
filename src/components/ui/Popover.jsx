import { useEffect, useRef, useState } from "react";
import "./ui.css";

const POPOVER_WIDTH = 224;

export default function Popover({ open, anchorEl, onClose, label, children }) {
  const popoverRef = useRef(null);
  const lastAnchorRef = useRef(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current && lastAnchorRef.current?.isConnected) {
        window.requestAnimationFrame(() => lastAnchorRef.current?.focus());
      }
      wasOpenRef.current = false;
      return undefined;
    }
    if (!anchorEl) return undefined;
    lastAnchorRef.current = anchorEl;

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const halfWidth = Math.min(POPOVER_WIDTH, window.innerWidth - 16) / 2;
      const left = Math.min(
        window.innerWidth - halfWidth - 8,
        Math.max(halfWidth + 8, rect.left + rect.width / 2),
      );
      setPosition({ top: Math.min(rect.bottom + 6, window.innerHeight - 140), left });
    };

    updatePosition();
    const firstItem = popoverRef.current?.querySelector("[role='menuitem']");
    firstItem?.focus();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const handlePointerDown = (event) => {
      if (!popoverRef.current?.contains(event.target) && !anchorEl.contains(event.target)) onCloseRef.current();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    wasOpenRef.current = true;

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, anchorEl]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className="ui-popover"
      role="menu"
      aria-label={label}
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>
  );
}
