import { ArrowUp, Pause, Play, SkipBack, SkipForward } from "lucide-react";

export function PrevIcon({ size = 20, className }) {
  return <SkipBack size={size} className={className} aria-hidden="true" focusable="false" />;
}

export function NextIcon({ size = 20, className }) {
  return <SkipForward size={size} className={className} aria-hidden="true" focusable="false" />;
}

export function TopArrowIcon({ size = 20, className }) {
  return <ArrowUp size={size} className={className} aria-hidden="true" focusable="false" />;
}

export function PlayIcon({ size = 20, className }) {
  return <Play size={size} fill="currentColor" className={className} aria-hidden="true" focusable="false" />;
}

export function PauseIcon({ size = 20, className }) {
  return <Pause size={size} fill="currentColor" className={className} aria-hidden="true" focusable="false" />;
}

export default { PrevIcon, NextIcon, PlayIcon, PauseIcon, TopArrowIcon };
