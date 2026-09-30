import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      const target = returnFocusRef.current;
      if (target instanceof HTMLElement && target.isConnected) {
        window.requestAnimationFrame(() => target.focus());
      }
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
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </dialog>
  );
}
