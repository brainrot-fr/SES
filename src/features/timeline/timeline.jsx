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
import Sheet from '../../components/layout/Sheet';
import AppIcon from '../../components/icons/AppIcon';
import Page from '../../components/layout/Page';
import Split from '../../components/layout/Split';
import './timeline.css';

export default function Timeline() {
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
    <Page className="tl-root">
      <Split
        className="tl-split"
        rail={(
          <header className="tl-hero">
            <h1 className="tl-hero__name">{t('tlName')}</h1>
            <p className="tl-hero__span">{t('tlSpan')}</p>
          </header>
        )}
      >
        <ol className="tl-list">
          {timelineEvents.map((ev) => (
            <li className="tl-item" key={ev.id}>
              <div className="tl-item__rail" aria-hidden="true">
                <span className="tl-item__year">{ev.year}</span>
                <span className="tl-item__marker" />
              </div>
              <button type="button" className="tl-item__content" onClick={() => openDetails(ev)}>
                <h2 className="tl-item__title">{ev.title}</h2>
                <p className="tl-item__summary">{ev.summary}</p>
                <span className="tl-item__cta">{t('tlDetails')} <AppIcon name="arrowRight" size={16} /></span>
              </button>
            </li>
          ))}
        </ol>
      </Split>

      <Sheet
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
      </Sheet>
    </Page>
  );
}