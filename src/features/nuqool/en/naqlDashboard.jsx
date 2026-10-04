/**
 * naqlDashboard.jsx
 * Glossary: a Naql is a transmitted account; Khulasa means its summary.
 * The Naql browsing user interface.
 *
 * - Shows the current Naql text block with navigation and quick jump controls.
 * - Persists the current Naql number to localStorage.
 * - Responds to notification requests to open a specific Naql.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './naqlDashboard.css';
import { nuqoolObject } from './nuqoolData.jsx';
import { nuqoolKhulasaObject } from './nuqoolKhulasa.jsx';
import { useLang } from '../../../context/LanguageContext.jsx';
import AppIcon from '../../../components/icons/AppIcon.jsx';
import { Button } from '../../../components/shadcn/button.jsx';
import { ScrollArea } from '../../../components/shadcn/scroll-area.jsx';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '../../../components/shadcn/sheet.jsx';
import Page from '../../../components/layout/Page.jsx';
import Split from '../../../components/layout/Split.jsx';
import RowList from '../../../components/layout/RowList.jsx';
import NaqlEntry from './NaqlEntry.jsx';

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
                <NaqlEntry
                  content={naqlContent[currentNaql]}
                  summary={nuqoolKhulasaObject[currentNaql]}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </article>
      </Split>

      <nav
        className="naql-nav fixed inset-x-0 bottom-[var(--dock-offset)] z-[90] mx-auto flex w-[min(26rem,calc(100vw-24px))] items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-card p-1 shadow-lg"
        aria-label={t('naqlQuickJump')}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => goTo(currentNaql - 1)}
          disabled={currentNaql === 1}
          aria-label={t('prevNaql')}
        >
          <AppIcon name="chevronLeft" className="rtl:rotate-180" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-w-0 flex-1 gap-1 text-base font-semibold tabular-nums"
          onClick={() => setNumberPickerOpen(true)}
          aria-haspopup="dialog"
          aria-label={t('naqlNumberPicker')}
        >
          {currentNaql} / {TOTAL}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => goTo(currentNaql + 1)}
          disabled={currentNaql === TOTAL}
          aria-label={t('nextNaql')}
        >
          <AppIcon name="chevronRight" className="rtl:rotate-180" />
        </Button>
      </nav>

      <Sheet open={numberPickerOpen} onOpenChange={setNumberPickerOpen}>
        <SheetContent side="bottom" closeLabel={t('closeSheet')} className="max-h-[85dvh] gap-4 rounded-t-[var(--radius-md)] border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetTitle>{t('naqlNumberPicker')}</SheetTitle>
          <ScrollArea className="max-h-[65dvh]">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1">
              {Array.from({ length: TOTAL }, (_, index) => index + 1).map((number) => (
                <Button
                  key={number}
                  type="button"
                  variant={currentNaql === number ? 'secondary' : 'ghost'}
                  className="min-h-11 min-w-11 px-1 tabular-nums"
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