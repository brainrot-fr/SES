import React from "react";

// Lucide icons © Lucide Contributors, ISC license: https://lucide.dev/license
// Google, Quran-book, Nuqool-book, and SES-specific symbols are custom paths.
const paths = {
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9" />
      <path d="M9 21v-6h6v6" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </>
  ),
  moon: <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.804a6.5 6.5 0 0 0 8.268 8.268c.344-.215.826-.003.803.4Z" />,
  user: (
    <>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="5" />
    </>
  ),
  book: (
    <>
      <path d="M12 7v14" />
      <path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1h-4a4 4 0 0 0-4 2 4 4 0 0 0-4-2H4a1 1 0 0 1-1-1Z" />
    </>
  ),
  quran: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5v-17Z" />
      <path d="M8 7h8m-8 4h8m-8 4h5" />
    </>
  ),
  murshid: (
    <>
      <circle cx="12" cy="5" r="2.3" />
      <circle cx="7" cy="12" r="2.3" />
      <circle cx="17" cy="12" r="2.3" />
      <circle cx="12" cy="19" r="2.3" />
      <path d="m10.6 6.8-2.2 3.4m7.2 0-2.2-3.4m-3.7 5h4.6m-5 1.8 2.2 3.4m2.8-3.4-2.2 3.4" />
    </>
  ),
  google: (
    <>
      <path d="M20.4 12.2c0-.6-.1-1.2-.2-1.8h-8v3.2h4.6a4 4 0 0 1-1.7 2.6v2.1h2.8c1.6-1.5 2.5-3.7 2.5-6.1Z" />
      <path d="M12.2 20.5c2.3 0 4.2-.8 5.7-2.2l-2.8-2.1c-.8.5-1.8.8-2.9.8-2.2 0-4-1.5-4.7-3.5H4.6v2.2a8.5 8.5 0 0 0 7.6 4.8Z" />
      <path d="M7.5 13.5a5 5 0 0 1 0-3.1V8.2H4.6a8.5 8.5 0 0 0 0 7.5l2.9-2.2Z" />
      <path d="M12.2 6.9c1.3 0 2.4.5 3.2 1.3l2.5-2.5a8.2 8.2 0 0 0-5.7-2.2 8.5 8.5 0 0 0-7.6 4.7l2.9 2.2c.7-2 2.5-3.5 4.7-3.5Z" />
    </>
  ),
  nuqool: (
    <>
      <path d="M6 3.5h12a2 2 0 0 1 2 2v14H8a4 4 0 0 0-4 2V5.5a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8m-8 4h8m-8 4h5" />
    </>
  ),
  timeline: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  social: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  reels: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 3v4m5-4v4m5-4v4M3 7h18M10 11l5 3-5 3v-6Z" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </>
  ),
  plus: <path d="M12 5v14m-7-7h14" />,
  back: (
    <>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </>
  ),
  menu: <path d="M4 5h16M4 12h16M4 19h16" />,
  close: <path d="m18 6-12 12M6 6l12 12" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />,
  comment: (
    <>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4" />
    </>
  ),
  bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" />,
  volume: (
    <>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="m17 9 5 6m0-6-5 6" />
    </>
  ),
  play: <path d="m7 4 14 8-14 8V4Z" />,
  pause: (
    <>
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
    </>
  ),
  retry: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3M11 8v6m-3-3h6" />
    </>
  ),
  zoomOut: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3M8 11h6" />
    </>
  ),
  settings: (
    <>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 1.9Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  display: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  skipBack: (
    <>
      <path d="M19 20 9 12l10-8v16Z" />
      <path d="M5 19V5" />
    </>
  ),
  skipForward: (
    <>
      <path d="m5 4 10 8-10 8V4Z" />
      <path d="M19 5v14" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L8 7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-1.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  trash: (
    <>
      <path d="M10 11v6m4-6v6" />
      <path d="M5 7h14m-1 0-.9 13H6.9L6 7" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  warning: (
    <>
      <path d="m10.29 3.86-8.36 14.5A2 2 0 0 0 3.66 21h16.68a2 2 0 0 0 1.73-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4m0 4h.01" />
    </>
  ),
  edit: (
    <>
      <path d="m16 5 3 3M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z" />
    </>
  ),
};

const filledPaths = {
  home: <path fillRule="evenodd" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Zm7 10.5h4v-5h-4v5Z" />,
  book: <path fillRule="evenodd" d="M3 4.5A1.5 1.5 0 0 1 4.5 3H9a3 3 0 0 1 3 3v15a4 4 0 0 0-4-2H4.5A1.5 1.5 0 0 1 3 17.5v-13Zm18 0A1.5 1.5 0 0 0 19.5 3H15a3 3 0 0 0-3 3v15a4 4 0 0 1 4-2h3.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" />,
  quran: (
    <>
      <path fillRule="evenodd" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5v-17Z" />
      <path d="M8 7h8m-8 4h8m-8 4h5" />
    </>
  ),
  murshid: (
    <>
      <circle cx="12" cy="5" r="2.3" fill="currentColor" />
      <circle cx="7" cy="12" r="2.3" fill="currentColor" />
      <circle cx="17" cy="12" r="2.3" fill="currentColor" />
      <circle cx="12" cy="19" r="2.3" fill="currentColor" />
      <path d="m10.6 6.8-2.2 3.4m7.2 0-2.2-3.4m-3.7 5h4.6m-5 1.8 2.2 3.4m2.8-3.4-2.2 3.4" />
    </>
  ),
  nuqool: (
    <>
      <path fillRule="evenodd" d="M6 3.5h12a2 2 0 0 1 2 2v14H8a4 4 0 0 0-4 2V5.5a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8m-8 4h8m-8 4h5" />
    </>
  ),
  timeline: (
    <>
      <path fillRule="evenodd" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  settings: <path fillRule="evenodd" d="M19.4 15l.1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 1.9ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />,
  social: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" fill="currentColor" />,
  reels: (
    <>
      <path fillRule="evenodd" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm5 8v6l5-3-5-3Z" />
      <path d="M7 3v4m5-4v4m5-4v4M3 7h18" />
    </>
  ),
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" fill="currentColor" />,
  bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" fill="currentColor" />,
  play: <path d="m7 4 14 8-14 8V4Z" fill="currentColor" />,
  pause: (
    <>
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
    </>
  ),
  camera: (
    <>
      <path fillRule="evenodd" d="M9.5 4h5l1.5 3h3A2 2 0 0 1 21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3ZM12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    </>
  ),
  trash: (
    <path fillRule="evenodd" d="M5 7h14l-1 14H6L5 7Zm4-3h6v3H9V4Zm1 6v8h1v-8h-1Zm3 0v8h1v-8h-1Z" />
  ),
  warning: (
    <path fillRule="evenodd" d="m10.29 3.86-8.36 14.5A2 2 0 0 0 3.66 21h16.68a2 2 0 0 0 1.73-3L13.71 3.86a2 2 0 0 0-3.42 0ZM11 9h2v5h-2V9Zm0 7h2v2h-2v-2Z" />
  ),
  edit: (
    <>
      <path d="m16 5 3 3M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z" fill="currentColor" />
    </>
  ),
};

export default function AppIcon({ name, size = 22, strokeWidth = 1.8, className = "", filled = false }) {
  return (
    <svg
      className={`app-icon app-icon--${name}${className ? ` ${className}` : ""}`}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {filled ? filledPaths[name] || paths[name] : paths[name]}
    </svg>
  );
}
