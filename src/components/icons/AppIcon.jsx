const paths = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  moon: <path d="M20.2 15.3A8.6 8.6 0 0 1 8.7 3.8a8.8 8.8 0 1 0 11.5 11.5Z" />,
  user: <><circle cx="12" cy="8" r="3.4" /><path d="M4.5 20c.3-3.4 3.3-5.4 7.5-5.4s7.2 2 7.5 5.4" /></>,
  book: <><path d="M4 5.8A2.8 2.8 0 0 1 6.8 3H20v17H6.8A2.8 2.8 0 0 0 4 22.8V5.8Z" /><path d="M4 6h12M8.5 10h7M8.5 13h7" /></>,
  nuqool: <><path d="M6 3.5h12a2 2 0 0 1 2 2v14H8a4 4 0 0 0-4 2V5.5a2 2 0 0 1 2-2Z" /><path d="M8 8h8m-8 4h8m-8 4h5" /></>,
  timeline: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.3 2M5.6 6.6l1.3 1" /></>,
  social: <><path d="M20.4 11.3a7.5 7.5 0 0 1-7.6 7.4 8.3 8.3 0 0 1-3.3-.7L4 20l1.7-4.1a7.2 7.2 0 0 1-1-3.6 7.8 7.8 0 0 1 7.8-7.5c4.4 0 7.9 2.9 7.9 6.5Z" /><path d="M8.7 11.5h.1m3.2 0h.1m3.2 0h.1" /></>,
  reels: <><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="m10 9 5 3-5 3V9ZM4 8h16M8 4l3 4m2-4 3 4" /></>,
  more: <><circle cx="5" cy="12" r="1.1" /><circle cx="12" cy="12" r="1.1" /><circle cx="19" cy="12" r="1.1" /></>,
  plus: <path d="M12 5v14m-7-7h14" />,
  back: <><path d="M19 12H5m7 7-7-7 7-7" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3.5 12h17M12 3c2.3 2.5 3.4 5.5 3.4 9s-1.1 6.5-3.4 9c-2.3-2.5-3.4-5.5-3.4-9S9.7 5.5 12 3Z" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  heart: <path d="M20.8 8.8c0 4.2-8.8 10-8.8 10s-8.8-5.8-8.8-10a4.6 4.6 0 0 1 8.8-1.7 4.6 4.6 0 0 1 8.8 1.7Z" />,
  comment: <><path d="M20 11.3a7.3 7.3 0 0 1-7.5 7.2 8.3 8.3 0 0 1-3.2-.7L4 20l1.6-4.1a7.2 7.2 0 0 1-1-3.6 7.7 7.7 0 0 1 7.8-7.5c4.2 0 7.6 2.9 7.6 6.5Z" /><path d="M8.5 11.5h.1m3.4 0h.1m3.4 0h.1" /></>,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5m-7.6 6.9 7.6 4.5" /></>,
  bookmark: <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" />,
  volume: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M16 9a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12" /></>,
  volumeOff: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="m17 9 5 6m0-6-5 6" /></>,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  pause: <><path d="M8 5h3v14H8zM15 5h3v14h-3z" /></>,
  arrowRight: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
  retry: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.7 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.3-3" /></>,
  settings: <><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.5-.5a7.7 7.7 0 0 1-1.5.9l-.3 1.5h-2.4l-.3-1.5a7.7 7.7 0 0 1-1.5-.9l-1.5.5-1.2-2.1 1.2-.9a7.7 7.7 0 0 1 0-1.8l-1.2-.9 1.2-2.1 1.5.5a7.7 7.7 0 0 1 1.5-.9l.3-1.5h2.4l.3 1.5a7.7 7.7 0 0 1 1.5.9l1.5-.5 1.2 2.1-1.2.9a7.7 7.7 0 0 1 0 1.7Z" /></>,
};

export default function AppIcon({ name, size = 22, strokeWidth = 1.8, className = "", filled = false }) {
  return (
    <svg
      className={className}
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
      {paths[name]}
    </svg>
  );
}
