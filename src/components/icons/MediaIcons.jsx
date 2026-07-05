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
    fill="#000000" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M12.71,6.29a1,1,0,0,0-.33-.21,1,1,0,0,0-.76,0,1,1,0,0,0-.33.21l-4,4a1,1,0,1,0,1.42,1.42L11,9.41V21a1,1,0,0,0,2,0V9.41l2.29,2.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42ZM19,2H5A1,1,0,0,0,5,4H19a1,1,0,0,0,0-2Z"></path></g></svg>);
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
