/**
 * naqlDashboard.jsx
 * The Naql browsing user interface.
 *
 * - Shows the current Naql text block with navigation and quick jump controls.
 * - Persists the current Naql number to localStorage.
 * - Responds to notification requests to open a specific Naql.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const { t, lang } = useLang();

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
    <div className="naql-container">
      <div ref={topRef} className="naql-scroll-anchor" />

      <section className="naql-body">
        <h1 className="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</h1>
        <h2 className="naql-title">{t('naql')} {currentNaql}:</h2>
        <div className="naql-content">
          {naqlContent[currentNaql]}
          {nuqoolKhulasaObject?.[currentNaql]}
        </div>
      </section>

      <nav className="naql-nav">
        {/* Row 1: prev / input / next */}
        <div className="naql-nav__row naql-nav__main">
          <button
            className="naql-nav__btn"
            onClick={() => goTo(currentNaql - 1)}
            disabled={currentNaql === 1}
            aria-label={t('prevNaql')}
          >
            <PrevIcon className="naql-nav__icon" title={t('prevNaql')} />
          </button>

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

          <button
            className="naql-nav__btn"
            onClick={() => goTo(currentNaql + 1)}
            disabled={currentNaql === TOTAL}
            aria-label={t('nextNaql')}
          >
            <NextIcon className="naql-nav__icon" title={t('nextNaql')} />
          </button>
        </div>

        {/* Row 2: quick-jump */}
        <div className="naql-nav__row naql-nav__jumps">
          {[-50, -10, -5].map(n => (
            <button
              key={n}
              className="naql-nav__jump"
              onClick={() => goTo(currentNaql + n)}
              disabled={currentNaql + n < 1}
            >
              {n}
            </button>
          ))}
          <div className="naql-nav__divider" />
          {[5, 10, 50].map(n => (
            <button
              key={n}
              className="naql-nav__jump"
              onClick={() => goTo(currentNaql + n)}
              disabled={currentNaql + n > TOTAL}
            >
              +{n}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}