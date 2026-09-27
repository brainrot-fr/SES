import "./ui.css";

export default function Skeleton({ variant = "line", count = 1, label, className = "" }) {
  const shapes = Array.from({ length: count }, (_, index) => (
    <span
      key={index}
      className={`ui-skeleton ui-skeleton--${variant}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
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
