import { useState, useEffect, useRef } from 'react';
import './naqlDashboard.css';
import { nuqoolObject } from './nuqool.jsx';
import { nuqoolKhulasaObject } from './nuqoolKhulasa.jsx';

const TOTAL = Object.keys(nuqoolObject).length;
const STORAGE_KEY = 'ses-current-naql';

export default function NaqlDashboard() {
  const [currentNaql, setCurrentNaql] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const n = parseInt(saved, 10);
    return (!isNaN(n) && n >= 1 && n <= TOTAL) ? n : 1;
  });
  const [inputVal, setInputVal] = useState(String(currentNaql));
  const topRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(currentNaql));
    setInputVal(String(currentNaql));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentNaql]);

  const goTo = (n) => setCurrentNaql(Math.max(1, Math.min(TOTAL, n)));

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
        <h2 className="naql-title">Naql {currentNaql}:</h2>
        <div className="naql-content">
          {nuqoolObject[currentNaql]}
          {nuqoolKhulasaObject?.[currentNaql]}
        </div>
      </section>

      {/* ── Fixed bottom navigation bar ── */}
      <nav className="naql-nav">
        {/* Row 1: prev / input / next */}
        <div className="naql-nav__row naql-nav__main">
          <button
            className="naql-nav__btn"
            onClick={() => goTo(currentNaql - 1)}
            disabled={currentNaql === 1}
            aria-label="Previous naql"
          >
            ←
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
              aria-label="Go to naql number"
            />
            <span className="naql-nav__sep">/ {TOTAL}</span>
          </div>

          <button
            className="naql-nav__btn"
            onClick={() => goTo(currentNaql + 1)}
            disabled={currentNaql === TOTAL}
            aria-label="Next naql"
          >
            →
          </button>
        </div>

        {/* Row 2: quick-jump buttons */}
        <div className="naql-nav__row naql-nav__jumps">
          {[-50, -10, -5].map(n => (
            <button
              key={n}
              className="naql-nav__jump"
              onClick={() => goTo(currentNaql + n)}
              disabled={currentNaql + n < 1}
              title={`Go back ${Math.abs(n)}`}
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
              title={`Skip forward ${n}`}
            >
              +{n}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
