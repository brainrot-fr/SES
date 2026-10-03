import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getCssDurationSeconds } from "@/lib/utils";
import "./ui.css";

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
  const [baseDuration, setBaseDuration] = useState(0);
  openRef.current = open;

  useEffect(() => {
    setBaseDuration(getCssDurationSeconds("--duration-base"));
  }, []);

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
        transition={{ duration: prefersReducedMotion ? 0 : baseDuration, ease: "easeOut" }}
        onAnimationComplete={handleAnimationComplete}
      >
        {children}
      </motion.div>
    </dialog>
  );
}
