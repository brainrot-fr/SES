import { useState, useEffect } from 'react';
import { timelineEvents } from './timelineData';
import { useLang } from '../../context/LanguageContext';
import './timeline.css';

export default function Timeline() {
  const { t } = useLang();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  const close = () => setSelected(null);

  return (
    <div className="tl-container">
      <div className="tl-hero">
        <p className="tl-hero__name">{t('tlName')}</p>
        <p className="tl-hero__span">{t('tlSpan')}</p>
      </div>

      <div className="tl-track">
        {timelineEvents.map((ev, i) => (
          <button
            key={ev.id}
            className="tl-event"
            onClick={() => setSelected(ev)}
            aria-label={`View details: ${ev.title}`}
          >
            <span className="tl-dot" aria-hidden="true" />
            {/* Connector line between dots — hide on last item */}
            {i < timelineEvents.length - 1 && (
              <span className="tl-connector" aria-hidden="true" />
            )}
            <div className="tl-card">
              <span className="tl-card__year">{ev.year}</span>
              <h3 className="tl-card__title">{ev.title}</h3>
              <p className="tl-card__summary">{ev.summary}</p>
              <span className="tl-card__cta">{t('tlDetails')}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="tl-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tl-modal-title"
        >
          <div className="tl-modal" onClick={e => e.stopPropagation()}>
            <div className="tl-modal__handle" aria-hidden="true" />

            <div className="tl-modal__header">
              <p className="tl-modal__year">{selected.year}</p>
              <button
                className="tl-modal__close"
                onClick={close}
                aria-label={t('tlCloseLabel')}
              >
                {t('tlClose')}
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