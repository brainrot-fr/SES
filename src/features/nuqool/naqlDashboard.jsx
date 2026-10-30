/**
 * naqlDashboard.jsx
 * The Naql browsing user interface.
 *
 * - Shows the current Naql text block with navigation and quick jump controls.
 * - Persists the current Naql number to localStorage.
 * - Responds to notification requests to open a specific Naql.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import '@/features/nuqool/naqlDashboard.css';
import '@/features/nuqool/nuqool.css';
import { nuqoolData } from '@/features/nuqool/nuqool.data.js';
import NaqlBody from '@/features/nuqool/NaqlBody.jsx';
import { useLang } from '@/context/LanguageContext.jsx';
import { getNaqlSwipeDirection } from '@/features/nuqool/naqlSwipe.js';
import DirectionalIcon from '@/components/icons/DirectionalIcon.jsx';
import { Button } from '@/components/shadcn/button.jsx';
import BottomSheet from '@/components/BottomSheet.jsx';
import { ScrollArea } from '@/components/shadcn/scroll-area.jsx';
import Page from '@/components/layout/Page.jsx';
import Split from '@/components/layout/Split.jsx';
import RowList from '@/components/layout/RowList.jsx';

const TOTAL = nuqoolData.length;
const STORAGE_KEY = 'ses-current-naql';

export default function NaqlDashboard({ initialNaql = null }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [currentNaql, setCurrentNaql] = useState(() => {
    if (Number.isInteger(initialNaql) && initialNaql >= 1 && initialNaql <= TOTAL) {
      return initialNaql;
    }
    const n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= TOTAL ? n : 1;
  });
  const [numberPickerOpen, setNumberPickerOpen] = useState(false);
  const topRef = useRef(null);
  const touchStart = useRef(null);
  const readingTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: 'easeOut' };

  const goTo = useCallback(
    /* Keep the selected Naql number within the valid range. */
    (n) => {
      const nextNaql = Math.max(1, Math.min(TOTAL, n));
      setCurrentNaql(nextNaql);
      navigate(`/nuqool/${nextNaql}`, { replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    /* Persist the selected Naql number so it is restored on the next visit. */
    localStorage.setItem(STORAGE_KEY, String(currentNaql));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentNaql]);

  useEffect(() => {
    if (Number.isInteger(initialNaql) && initialNaql >= 1 && initialNaql <= TOTAL) {
      setCurrentNaql(initialNaql);
    }
  }, [initialNaql]);

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    let element = event.target;
    let startedInHorizontalScroller = false;
    while (element instanceof Element && element !== event.currentTarget) {
      const style = window.getComputedStyle(element);
      if (
        element.scrollWidth > element.clientWidth
        && ['auto', 'scroll'].includes(style.overflowX)
      ) {
        startedInHorizontalScroller = true;
        break;
      }
      element = element.parentElement;
    }
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      ignored: startedInHorizontalScroller,
    };
  };

  const handleTouchEnd = (event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || start.ignored) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const isRtl = document.documentElement.dir === 'rtl';
    const direction = getNaqlSwipeDirection(dx, dy, isRtl);
    if (direction) goTo(currentNaql + direction);
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
      <div ref={topRef} className="naql-scroll-anchor" aria-hidden="true" />
      <Split className="naql-layout" rail={indexRail}>
        <article className="naql-reading-column" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <p className="bismillah" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentNaql}
              className="naql-reading"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
              transition={readingTransition}
            >
              <h1 id="naql-title" className="naql-title" aria-live="polite">
                {currentNaql}
              </h1>
              <NaqlBody entry={nuqoolData[currentNaql - 1]} />
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
          <DirectionalIcon name="chevronLeft" />
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
          <DirectionalIcon name="chevronRight" />
        </Button>
      </nav>

      <BottomSheet
        open={numberPickerOpen}
        onOpenChange={setNumberPickerOpen}
        title={t('naqlNumberPicker')}
        description={t('naqlNumberPickerDescription')}
        closeLabel={t('closeSheet')}
        className="gap-4 border-border bg-card p-4"
      >
          <h2 className="font-semibold text-foreground">{t('naqlNumberPicker')}</h2>
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
      </BottomSheet>
    </Page>
  );
}