export function Skeleton({ as: Element = "div", className = "" }) {
  return (
    <Element
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-surface-2 ${className}`}
    />
  );
}
