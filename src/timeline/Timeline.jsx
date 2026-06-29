import { useState, useEffect } from 'react';
import { timelineEvents, PERIOD_LABELS } from './timelineData';
import './timeline.css';

export default function Timeline() {
  const [selected, setSelected] = useState(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  const closeModal = () => setSelected(null);

  return (
    <div className="tl-container">
      <div className="tl-hero">
        <h1 className="tl-hero__title">Timeline</h1>
        <p className="tl-hero__name">Imam Mahdi A.S</p>
        <p className="tl-hero__span">847 AH — 910 AH</p>
      </div>

      {/* ── Vertical track ── */}
      <div className="tl-track">
        {timelineEvents.map(ev => (
          <button
            key={ev.id}
            className={`tl-event tl-event--${ev.period}`}
            onClick={() => setSelected(ev)}
            aria-label={`View details: ${ev.title}`}
          >
            {/* Dot on the line */}
            <span className="tl-dot" aria-hidden="true" />

            {/* Card */}
            <div className="tl-card">
              <span className="tl-card__badge">
                {PERIOD_LABELS[ev.period] ?? ev.period}
              </span>
              <span className="tl-card__year">{ev.year}</span>
              <h3 className="tl-card__title">{ev.title}</h3>
              <p className="tl-card__summary">{ev.summary}</p>
              <span className="tl-card__cta" aria-hidden="true">Details →</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Modal bottom-sheet ── */}
      {selected && (
        <div
          className="tl-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tl-modal-title"
        >
          <div
            className={`tl-modal tl-event--${selected.period}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle — visual hint */}
            <div className="tl-modal__handle" aria-hidden="true" />

            <div className="tl-modal__header">
              <div>
                <span className="tl-card__badge tl-modal__badge">
                  {PERIOD_LABELS[selected.period] ?? selected.period}
                </span>
                <p className="tl-modal__year">{selected.year}</p>
              </div>
              <button
                className="tl-modal__close"
                onClick={closeModal}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <h2 className="tl-modal__title" id="tl-modal-title">
              {selected.title}
            </h2>

            <div className="tl-modal__body">
              {selected.detail}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
