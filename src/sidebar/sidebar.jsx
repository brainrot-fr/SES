import React from "react";
import "./sidebar.css";

export default function Sidebar({ items, isOpen, onClose, darkMode, onThemeToggle }) {
  return (
    <>
      {isOpen && <div className="backdrop" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* ── Header ── */}
        <div className="sidebar__header">
          <span>Menu</span>
          <button className="sidebar__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* ── Nav links ── */}
        <nav className="sidebar__nav">
          {items.map((it) => (
            <a key={it.id} href={it.href} className="sidebar__link">
              {it.label}
            </a>
          ))}
        </nav>

        {/* ── Footer: theme toggle ── */}
        <div className="sidebar__footer">
          <button className="sidebar__theme-btn" onClick={onThemeToggle}>
            <span>{darkMode ? '🔆' : '🌙'}</span>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>
    </>
  );
}
