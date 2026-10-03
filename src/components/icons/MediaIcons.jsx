import React from "react";

// Lucide path data is ISC licensed: https://lucide.dev/license
function MediaIcon({ size = 20, className = "", title, children }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function PrevIcon(props) {
  return (
    <MediaIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </MediaIcon>
  );
}

export function NextIcon(props) {
  return (
    <MediaIcon {...props}>
      <path d="m9 18 6-6-6-6" />
    </MediaIcon>
  );
}

export function TopArrowIcon(props) {
  return (
    <MediaIcon {...props}>
      <path d="M12 17V3" />
      <path d="m5 10 7-7 7 7" />
      <path d="M5 21h14" />
    </MediaIcon>
  );
}

export function PlayIcon(props) {
  return (
    <MediaIcon {...props}>
      <path d="m7 4 14 8-14 8V4Z" fill="currentColor" stroke="none" />
    </MediaIcon>
  );
}

export function PauseIcon(props) {
  return (
    <MediaIcon {...props}>
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" stroke="none" />
    </MediaIcon>
  );
}

export default { PrevIcon, NextIcon, PlayIcon, PauseIcon, TopArrowIcon };
