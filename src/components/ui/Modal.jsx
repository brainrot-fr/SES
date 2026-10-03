import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "./ui.css";

function getCssDurationSeconds(tokenName) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  const duration = Number.parseFloat(value);
  if (!Number.isFinite(duration)) return 0;
  return value.endsWith("ms") ? duration / 1000 : duration;
}

export default function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  disableClose = false,
  className = "",
  children,
}) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const openRef = useRef(open);
  const prefersReducedMotion = useReducedMotion();
  openRef.current = open;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    if (!dialog.open) {
      returnFocusRef.current = document.activeElement;
      dialog.showModal();
    }
  }, [open]);

  useEffect(() => () => {
    if (dialogRef.current?.open) dialogRef.current.close();
  }, []);

  const handleCancel = (event) => {
    event.preventDefault();
    if (!disableClose) onClose();
  };

  const handleBackdropClick = (event) => {
    if (event.target === dialogRef.current && !disableClose) onClose();
  };

  const handleAnimationComplete = () => {
    const dialog = dialogRef.current;
    if (openRef.current || !dialog?.open) return;
    dialog.close();
    const target = returnFocusRef.current;
    if (target instanceof HTMLElement && target.isConnected) {
      window.requestAnimationFrame(() => target.focus());
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`ui-modal${className ? ` ${className}` : ""}`}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-modal="true"
      aria-busy={disableClose || undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <motion.div
        className="ui-modal__content"
        initial={open ? { opacity: 0, y: 8 } : false}
        animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: prefersReducedMotion ? 0 : getCssDurationSeconds("--duration-base"), ease: "easeOut" }}
        onAnimationComplete={handleAnimationComplete}
      >
        {children}
      </motion.div>
    </dialog>
  );
}
