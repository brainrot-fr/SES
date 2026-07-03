// import { useState, useEffect, useRef } from 'react';
// import { timelineEvents } from './timelineData';
// import { useLang } from '../../context/LanguageContext';
// import './timeline.css';

// export default function Timeline() {
//   const { t } = useLang();
//   const [selected, setSelected] = useState(null);
//   const closeBtnRef = useRef(null);

//   useEffect(() => {
//     document.body.style.overflow = selected ? 'hidden' : '';
//     return () => { document.body.style.overflow = ''; };
//   }, [selected]);

//   // Escape closes the modal; focus moves to the close button on open
//   useEffect(() => {
//     if (!selected) return;
//     closeBtnRef.current?.focus();

//     const onKeyDown = (e) => {
//       if (e.key === 'Escape') setSelected(null);
//     };
//     document.addEventListener('keydown', onKeyDown);
//     return () => document.removeEventListener('keydown', onKeyDown);
//   }, [selected]);

//   const close = () => setSelected(null);

//   return (
//     <div className="tl-container">
//       <div className="tl-hero">
//         <p className="tl-hero__name">{t('tlName')}</p>
//         <p className="tl-hero__span">{t('tlSpan')}</p>
//       </div>

//       <div className="tl-track">
//         {timelineEvents.map((ev, i) => (
//           <button
//             key={ev.id}
//             className="tl-event"
//             onClick={() => setSelected(ev)}
//             aria-label={`View details: ${ev.title}`}
//           >
//             <span className="tl-dot" aria-hidden="true" />
//             {/* Connector line between dots — hide on last item */}
//             {i < timelineEvents.length - 1 && (
//               <span className="tl-connector" aria-hidden="true" />
//             )}
//             <div className="tl-card">
//               <span className="tl-card__year">{ev.year}</span>
//               <h3 className="tl-card__title">{ev.title}</h3>
//               <p className="tl-card__summary">{ev.summary}</p>
//               <span className="tl-card__cta">{t('tlDetails')}</span>
//             </div>
//           </button>
//         ))}
//       </div>

//       {selected && (
//         <div
//           className="tl-overlay"
//           onClick={close}
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="tl-modal-title"
//         >
//           <div className="tl-modal" onClick={e => e.stopPropagation()}>
//             <div className="tl-modal__handle" aria-hidden="true" />

//             <div className="tl-modal__header">
//               <p className="tl-modal__year">{selected.year}</p>
//               <button
//                 className="tl-modal__close"
//                 onClick={close}
//                 aria-label={t('tlCloseLabel')}
//               >
//                 {t('tlClose')}
//               </button>
//             </div>

//             <h2 className="tl-modal__title" id="tl-modal-title">
//               {selected.title}
//             </h2>

//             <div className="tl-modal__body">
//               {selected.detail}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import { useState, useEffect, useRef } from 'react';
import {
  Timeline as MuiTimeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { timelineEvents } from './timelineData';
import { useLang } from '../../context/LanguageContext';
import './timeline.css';

export default function Timeline() {
  const { t } = useLang();
  const isMobile = useMediaQuery('(max-width: 899px)');
  const [selected, setSelected] = useState(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  // Escape closes the modal; focus moves to the close button on open
  useEffect(() => {
    if (!selected) return;
    closeBtnRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const close = () => setSelected(null);

  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        maxWidth: 640,
        mx: 'auto',
        pb: '120px',
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          pb: 2,
          mb: 4,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Typography
          variant="h5"
          component="p"
          sx={{
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          {t('tlName')}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            letterSpacing: 0.12,
          }}
        >
          {t('tlSpan')}
        </Typography>
      </Box>

      {/* Timeline */}
      <MuiTimeline
        position={isMobile ? 'right' : 'alternate'}
      >
        {timelineEvents.map((ev, i) => (
          <TimelineItem key={ev.id}>
            {!isMobile ? (
              <TimelineOppositeContent sx={{ m: 0, py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {ev.year}
                </Typography>
              </TimelineOppositeContent>
            ) : null}

            <TimelineSeparator>
              <TimelineDot
                onClick={() => setSelected(ev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(ev);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details: ${ev.title}`}
              />
              {i < timelineEvents.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
              <Paper
                elevation={0}
                onClick={() => setSelected(ev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(ev);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details: ${ev.title}`}
                sx={{
                  p: 1,
                  cursor: 'pointer',
                }}
              >
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ display: isMobile ? 'block' : 'none' }}
                >
                  {ev.year}
                </Typography>

                <Typography variant="subtitle2">
                  {ev.title}
                </Typography>

                <Typography variant="body2">
                  {ev.summary}
                </Typography>

                <Typography variant="caption">
                  {t('tlDetails')}
                </Typography>
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </MuiTimeline>

      {/* Modal Dialog */}
      <Dialog
        open={Boolean(selected)}
        onClose={close}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? '20px 20px 0 0' : 2,
            mt: isMobile ? 'auto' : 0,
            mb: isMobile ? 0 : 'auto',
          },
        }}
      >
        <DialogTitle>
          <Box>
            <Typography variant="caption" display="block">
              {selected?.year}
            </Typography>
            <Typography
              variant="h6"
              id="tl-modal-title"
            >
              {selected?.title}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selected?.detail}
        </DialogContent>

        <DialogActions>
          <Button
            ref={closeBtnRef}
            onClick={close}
            aria-label={t('tlCloseLabel')}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: '50%',
              minWidth: 32,
              width: 32,
              height: 32,
              p: 0,
            }}
          >
            <CloseIcon />
          </Button>
          <Button
            onClick={close}
            variant="contained"
            size="small"
          >
            {t('tlClose')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}