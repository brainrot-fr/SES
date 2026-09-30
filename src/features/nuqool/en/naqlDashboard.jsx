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
  const [inputVal, setInputVal] = useState(String(currentNaql));
  const topRef = useRef(null);
  const actionMotion = shouldReduceMotion
    ? {}
    : { whileHover: { y: -1 }, whileTap: { scale: 0.96 } };
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
    setInputVal(String(currentNaql));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentNaql]);

  useEffect(() => {
    /* If a notification tap requests a specific Naql, jump there. */
    if (openNaqlRequest?.number) goTo(openNaqlRequest.number);
  }, [openNaqlRequest, goTo]);

  const commitInput = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n)) goTo(n);
    else setInputVal(String(currentNaql));
  };

  return (
    <section className="naql-container" aria-labelledby="naql-title">
      <div ref={topRef} className="naql-scroll-anchor" />

      <article className="naql-body">
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
              {t('naql')} {currentNaql}
            </h2>
            <div className="naql-content">
              {naqlContent[currentNaql]}
              {nuqoolKhulasaObject[currentNaql] ?? null}
            </div>
          </motion.div>
        </AnimatePresence>
      </article>

      <nav className="naql-nav" aria-label={t('naqlQuickJump')}>
        {/* Row 1: prev / input / next */}
        <div className="naql-nav__row naql-nav__main">
          <motion.button
            type="button"
            className="naql-nav__btn"
            onClick={() => goTo(currentNaql - 1)}
            disabled={currentNaql === 1}
            aria-label={t('prevNaql')}
            transition={readingTransition}
            {...actionMotion}
          >
            <PrevIcon className="naql-nav__icon" title={t('prevNaql')} />
          </motion.button>

          <div className="naql-nav__position">
            <input
              className="naql-nav__input"
              type="number"
              min={1}
              max={TOTAL}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitInput()}
              onBlur={commitInput}
              aria-label={t('goToNaql')}
            />
            <span className="naql-nav__sep">/ {TOTAL}</span>
          </div>

          <motion.button
            type="button"
            className="naql-nav__btn"
            onClick={() => goTo(currentNaql + 1)}
            disabled={currentNaql === TOTAL}
            aria-label={t('nextNaql')}
            transition={readingTransition}
            {...actionMotion}
          >
            <NextIcon className="naql-nav__icon" title={t('nextNaql')} />
          </motion.button>
        </div>

        <details className="naql-nav__jump-menu">
          <summary>{t('naqlQuickJump')}</summary>
          <div className="naql-nav__row naql-nav__jumps">
            {[-50, -10, -5].map(n => (
              <motion.button
                type="button"
                key={n}
                className="naql-nav__jump"
                onClick={() => goTo(currentNaql + n)}
                disabled={currentNaql + n < 1}
                transition={readingTransition}
                {...actionMotion}
              >
                {n}
              </motion.button>
            ))}
            <div className="naql-nav__divider" aria-hidden="true" />
            {[5, 10, 50].map(n => (
              <motion.button
                type="button"
                key={n}
                className="naql-nav__jump"
                onClick={() => goTo(currentNaql + n)}
                disabled={currentNaql + n > TOTAL}
                transition={readingTransition}
                {...actionMotion}
              >
                +{n}
              </motion.button>
            ))}
          </div>
        </details>
      </nav>
    </section>
  );
}