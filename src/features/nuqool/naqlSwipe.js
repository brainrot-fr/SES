export function getNaqlSwipeDirection(dx, dy, isRtl) {
  if (Math.abs(dx) < 60 || Math.abs(dx) <= 1.5 * Math.abs(dy)) return 0;
  return (dx < 0) !== isRtl ? 1 : -1;
}
