/**
 * naqlDashboard.jsx
 * The Naql browsing user interface.
 *
 * - Shows the current Naql text block with navigation and quick jump controls.
 * - Persists the current Naql number to localStorage.
 * - Responds to notification requests to open a specific Naql.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './naqlDashboard.css';
import { nuqoolObject } from './nuqool.jsx';
import { nuqoolKhulasaObject } from './nuqoolKhulasa.jsx';
import { useLang } from '../../../context/LanguageContext.jsx';
import { PrevIcon, NextIcon } from '../../../components/icons/MediaIcons.jsx';
import Page from '../../../components/layout/Page.jsx';
import Split from '../../../components/layout/Split.jsx';
import RowList from '../../../components/layout/RowList.jsx';
import {
  Button,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../components/shadcn/primitives.jsx';

/*
 * When you have Urdu naql content ready:
 * import { nuqoolObject as nuqoolUr } from '../ur/nuqool.jsx';
 */

const TOTAL = Object.keys(nuqoolObject).length;
const STORAGE_KEY = 'ses-current-naql';

export default function NaqlDashboard({ openNaqlRequest }) {
  const { t } = useLang();
  const shouldReduceMotion = useReducedMotion();

  /*
   * When Urdu content exists, swap here:
   * const naqlContent = lang === 'ur' ? nuqoolUr : nuqoolObject;
   * Use the current language's Naql content.
   */

  const naqlContent = nuqoolObject;

  const [currentNaql, setCurrentNaql] = useState(() => {
    const n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= TOTAL ? n : 1;
  });
  const [numberPickerOpen, setNumberPickerOpen] = useState(false);
  const topRef = useRef(null);
  const touchStartX = useRef(null);
  const readingTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: 'easeOut' };

  const goTo = useCallback(
    /* Keep the selected Naql number within the valid range. */
    (n) => setCurrentNaql(Math.max(1, Math.min(TOTAL, n))),
    []
  );

  useEffect(() => {
    /* Persist the selected Naql number so it is restored on the next visit. */
    localStorage.setItem(STORAGE_KEY, String(currentNaql));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentNaql]);

  useEffect(() => {
    /* If a notification tap requests a specific Naql, jump there. */
    if (openNaqlRequest?.number) goTo(openNaqlRequest.number);
  }, [openNaqlRequest, goTo]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current == null) return;
    const delta = event.changedTouches[0]?.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 60) return;
    const isRtl = document.documentElement.dir === 'rtl';
    goTo(currentNaql + ((delta < 0) !== isRtl ? 1 : -1));
  };

  const indexRail = (
    <nav className="naql-index" aria-label={t('naqlNumberPicker')}>
      <RowList className="naql-index__list">
        {Array.from({ length: TOTAL }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            className={`naql-index__item${currentNaql === number ? ' naql-index__item--active' : ''}`}
            onClick={() => goTo(number)}
            aria-current={currentNaql === number ? 'page' : undefined}
          >
            {number}
          </button>
        ))}
      </RowList>
    </nav>
  );

  return (
    <Page as="section" className="naql-container" aria-labelledby="naql-title">
      <div ref={topRef} className="naql-scroll-anchor" />
      <Split className="naql-layout" rail={indexRail}>
        <article className="naql-reading-column" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <h1 className="bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentNaql}
              className="naql-reading"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
              transition={readingTransition}
            >
              <h2 id="naql-title" className="naql-title" aria-live="polite">
                {currentNaql}
              </h2>
              <div className="naql-content">
                {naqlContent[currentNaql]}
                {nuqoolKhulasaObject[currentNaql] ?? null}
              </div>
            </motion.div>
          </AnimatePresence>
        </article>
      </Split>

      <nav className="naql-nav" aria-label={t('naqlQuickJump')}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goTo(currentNaql - 1)}
          disabled={currentNaql === 1}
          aria-label={t('prevNaql')}
        >
          <PrevIcon className="naql-nav__icon" title={t('prevNaql')} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="min-w-0 flex-1 tabular-nums text-lg font-bold"
          onClick={() => setNumberPickerOpen(true)}
          aria-haspopup="dialog"
          aria-label={t('naqlNumberPicker')}
        >
          <span>{currentNaql}</span><span className="text-sm font-medium text-muted-foreground">/ {TOTAL}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goTo(currentNaql + 1)}
          disabled={currentNaql === TOTAL}
          aria-label={t('nextNaql')}
        >
          <NextIcon className="naql-nav__icon" title={t('nextNaql')} />
        </Button>
      </nav>

      <Sheet
        open={numberPickerOpen}
        onOpenChange={setNumberPickerOpen}
      >
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{t('naqlNumberPicker')}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="max-h-[min(65dvh,34rem)]">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1">
              {Array.from({ length: TOTAL }, (_, index) => index + 1).map((number) => (
                <Button
                  key={number}
                  variant={currentNaql === number ? 'secondary' : 'ghost'}
                  size="icon"
                  className="tabular-nums"
                  aria-current={currentNaql === number ? 'true' : undefined}
                  onClick={() => {
                    goTo(number);
                    setNumberPickerOpen(false);
                  }}
                >
                  {number}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </Page>
  );
}