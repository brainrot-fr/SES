import {
  House, BookOpen, ScrollText, Clapperboard, MessagesSquare, MessageCircle, Waypoints, History,
  Settings, Sun, Moon, User, Menu, X, Globe, Bell, Heart, Share2, Bookmark, Volume2, VolumeX, Play, Pause,
  ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, SkipBack, SkipForward, Sparkles, RotateCcw, ZoomIn, ZoomOut,
  Search, Check, Camera, Trash2, TriangleAlert, Pencil, Ellipsis, Plus, SlidersHorizontal, Eye, Image, Flag,
} from "lucide-react";

function GoogleMark({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.4 12.2c0-.6-.1-1.2-.2-1.8h-8v3.2h4.6a4 4 0 0 1-1.7 2.6v2.1h2.8c1.6-1.5 2.5-3.7 2.5-6.1Z" />
      <path d="M12.2 20.5c2.3 0 4.2-.8 5.7-2.2l-2.8-2.1c-.8.5-1.8.8-2.9.8-2.2 0-4-1.5-4.7-3.5H4.6v2.2a8.5 8.5 0 0 0 7.6 4.8Z" />
      <path d="M7.5 13.5a5 5 0 0 1 0-3.1V8.2H4.6a8.5 8.5 0 0 0 0 7.5l2.9-2.2Z" />
      <path d="M12.2 6.9c1.3 0 2.4.5 3.2 1.3l2.5-2.5a8.2 8.2 0 0 0-5.7-2.2 8.5 8.5 0 0 0-7.6 4.7l2.9 2.2c.7-2 2.5-3.5 4.7-3.5Z" />
    </svg>
  );
}

const icons = {
  home: House, quran: BookOpen, nuqool: ScrollText, reels: Clapperboard, social: MessagesSquare,
  murshid: Waypoints, timeline: History, settings: Settings, sun: Sun, moon: Moon, user: User, menu: Menu,
  close: X, globe: Globe, bell: Bell, heart: Heart, comment: MessageCircle, share: Share2, bookmark: Bookmark,
  volume: Volume2, volumeOff: VolumeX, play: Play, pause: Pause, arrowRight: ArrowRight, back: ArrowLeft,
  chevronLeft: ChevronLeft, chevronRight: ChevronRight, skipBack: SkipBack, skipForward: SkipForward,
  sparkle: Sparkles, retry: RotateCcw, zoomIn: ZoomIn, zoomOut: ZoomOut, search: Search, check: Check,
  camera: Camera, trash: Trash2, warning: TriangleAlert, edit: Pencil, more: Ellipsis, plus: Plus,
  display: SlidersHorizontal, views: Eye, image: Image, report: Flag, book: BookOpen,
};

const SOLID = new Set(["heart", "play", "pause", "bookmark"]);

export default function AppIcon({ name, size = 22, strokeWidth = 1.75, className = "", filled = false }) {
  if (name === "google") return <GoogleMark size={size} className={className} />;
  const Glyph = icons[name];
  if (!Glyph) return null;
  const solid = filled && SOLID.has(name);
  return (
    <Glyph
      size={size}
      strokeWidth={filled && !solid ? 2.25 : strokeWidth}
      fill={solid ? "currentColor" : "none"}
      className={`app-icon app-icon--${name}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
      focusable="false"
    />
  );
}
