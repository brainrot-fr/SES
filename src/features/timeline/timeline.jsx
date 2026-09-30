/**
 * timeline.jsx
 * Timeline feature page showing major events and details.
 *
 * - Renders a semantic vertical timeline using shared design tokens.
 * - Opens event detail dialogs with accessible keyboard support.
 */

import { useEffect, useRef, useState } from 'react';
import { timelineEvents } from './timelineData';
import { useLang } from '../../context/LanguageContext';
import Modal from '../../components/ui/Modal';
import AppIcon from '../../components/icons/AppIcon';
import './timeline.css';

export default function timeline() {
  const { t } = useLang();

  /*
   * `openEvent` holds the content to render; `isOpen` only controls visibility.
   * Keeping them separate means the dialog still shows the right event while
   * it animates closed, instead of blanking out mid-transition.
   */

  const [openEvent, setOpenEvent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeBtnRef = useRef(null);

  /* When the dialog opens, move focus to the close button for accessibility. */
  useEffect(() => {
    if (isOpen) closeBtnRef.current?.focus();
  }, [isOpen]);

  const openDetails = (ev) => {
    /* Store the selected event and make the dialog visible. */
    setOpenEvent(ev);
    setIsOpen(true);
  };
  const closeDetails = () => setIsOpen(false);

  return (
    <div className="tl-root">
      <div className="tl-hero">
        <p className="tl-hero__name">{t('tlName')}</p>
        <p className="tl-hero__span">{t('tlSpan')}</p>
      </div>

      <ol className="tl-list">
        {timelineEvents.map((ev) => (
          <li className="tl-item" key={ev.id}>
            <span className="tl-item__marker" aria-hidden="true" />
            <div className="tl-item__content">
              <button type="button" className="tl-card" onClick={() => openDetails(ev)}>
                <span className="tl-card__year">{ev.year}</span>
                <h3 className="tl-card__title">{ev.title}</h3>
                <p className="tl-card__summary">{ev.summary}</p>
                <span className="tl-card__cta">{t('tlDetails')} <AppIcon name="arrowRight" size={16} /></span>
              </button>
            </div>
          </li>
        ))}
      </ol>

      <Modal
        open={isOpen}
        onClose={closeDetails}
        labelledBy="tl-dialog-title"
        className="tl-dialog"
      >
        <div className="tl-dialog__header">
          <span className="tl-dialog__year">{openEvent?.year}</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="tl-dialog__close"
            onClick={closeDetails}
            aria-label={t('tlCloseLabel')}
          >
            <AppIcon name="close" />
          </button>
        </div>

        <h2 className="tl-dialog__title" id="tl-dialog-title">
          {openEvent?.title}
        </h2>

        <div className="tl-dialog__body">
          {openEvent?.detail}
        </div>
      </Modal>
    </div>
  );
}