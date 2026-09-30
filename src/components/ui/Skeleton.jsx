import { motion } from "framer-motion";
import "./ui.css";

export default function Skeleton({ variant = "line", count = 1, label, className = "" }) {
  const shapes = Array.from({ length: count }, (_, index) => (
    <motion.span
      key={index}
      className={`ui-skeleton ui-skeleton--${variant}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.16) }}
    />
  ));

  return (
    <div
      className="ui-skeleton-group"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {shapes}
    </div>
  );
}
