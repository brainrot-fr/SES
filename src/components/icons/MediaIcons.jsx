/**
 * MediaIcons.jsx
 * Reusable SVG components for audio playback controls.
 *
 * - Exports Prev, Next, Play, and Pause icons.
 * - Each icon supports accessible titles and customizable size.
 */

import React from 'react';

export function PrevIcon({ size = 20, className = '', title }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? 'false' : 'true'}
      role="img"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M15 6L8 12L15 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NextIcon({ size = 20, className = '', title }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? 'false' : 'true'}
      role="img"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M9 6L16 12L9 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TopArrowIcon({ size = 20, className = '', title }) {
  return (
  <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? 'false' : 'true'}
      role="img"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M12 19V5M6 11l6-6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>);
}

export function PlayIcon({ size = 20, className = '', title }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? 'false' : 'true'}
      role="img"
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M6 4l14 8-14 8V4z" />
    </svg>
  );
}

export function PauseIcon({ size = 20, className = '', title }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={title ? 'false' : 'true'}
      role="img"
    >
      {title ? <title>{title}</title> : null}
      <rect x="5" y="4" width="4" height="16" fill="currentColor" />
      <rect x="15" y="4" width="4" height="16" fill="currentColor" />
    </svg>
  );
}

export default { PrevIcon, NextIcon, PlayIcon, PauseIcon, TopArrowIcon };
