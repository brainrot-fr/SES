import { useEffect, useRef, useState } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { Dialog } from '@mui/material';
import { timelineEvents } from './timelineData';
import { useLang } from '../../context/LanguageContext';
import './timeline.css';

const LAST_INDEX = timelineEvents.length - 1;

export default function timeline() {
  const { t } = useLang();

  // `openEvent` holds the content to render; `isOpen` only controls visibility.
  // Keeping them separate means the dialog still shows the right event while
  // it animates closed, instead of blanking out mid-transition.
  const [openEvent, setOpenEvent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) closeBtnRef.current?.focus();
  }, [isOpen]);

  const openDetails = (ev) => {
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

      {/* position="right" is MUI's own "everything on one side" mode — no
          TimelineOppositeContent, no alternating, no manual left/right math. */}
      <Timeline position="right" sx={{ m: 0, p: 0 }}>
        {timelineEvents.map((ev, i) => (
          <TimelineItem
            key={ev.id}
            sx={{ minHeight: 0, '&::before': { display: 'none' } }}
          >
            <TimelineSeparator aria-hidden="true">
              {/* A connector above AND below the dot, each with the default
                  flexGrow:1, is what centers the dot on the card: the
                  separator stretches to the content's height and the two
                  connectors split the leftover space evenly. */}
              <TimelineConnector
                sx={{ width: '2px', bgcolor: 'var(--primary)', opacity: i === 0 ? 0 : 1 }}
              />
              <TimelineDot
                sx={{
                  width: 14,
                  height: 14,
                  m: 0,
                  p: 0,
                  bgcolor: 'var(--primary)',
                  border: '2.5px solid var(--bg)',
                  boxShadow: '0 0 0 2px var(--primary)',
                }}
              />
              <TimelineConnector
                sx={{ width: '2px', bgcolor: 'var(--primary)', opacity: i === LAST_INDEX ? 0 : 1 }}
              />
            </TimelineSeparator>

            <TimelineContent sx={{ py: 1.5, px: 2 }}>
              <button type="button" className="tl-card" onClick={() => openDetails(ev)}>
                <span className="tl-card__year">{ev.year}</span>
                <h3 className="tl-card__title">{ev.title}</h3>
                <p className="tl-card__summary">{ev.summary}</p>
                <span className="tl-card__cta">{t('tlDetails')}</span>
              </button>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>

      {/* Escape-to-close, focus trapping, focus restoration, and body
          scroll-locking all come from Dialog itself — no need to reimplement
          any of that by hand. */}
      <Dialog
        open={isOpen}
        onClose={closeDetails}
        fullWidth
        maxWidth="sm"
        aria-labelledby="tl-dialog-title"
        sx={{
          '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } },
          '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.52)' },
          '& .MuiDialog-paper': {
            bgcolor: 'var(--panel)',
            color: 'var(--text-small)',
            borderRadius: { xs: '20px 20px 0 0', sm: '16px' },
            m: { xs: 0, sm: 4 },
            width: '100%',
            maxHeight: { xs: '82vh', sm: '88vh' },
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          },
        }}
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
            {t('tlClose')}
          </button>
        </div>

        <h2 className="tl-dialog__title" id="tl-dialog-title">
          {openEvent?.title}
        </h2>

        <div className="tl-dialog__body">
          {openEvent?.detail}
        </div>
      </Dialog>
    </div>
  );
}