import { useState } from 'react';
import './naqlDashboard.css';
import { nuqoolObject } from './nuqool.jsx';
import { nuqoolKhulasaObject } from './nuqoolKhulasa.jsx';

const TOTAL = Object.keys(nuqoolObject).length;

export default function NaqlDashboard() {
  const [currentNaql, setCurrentNaql] = useState(1);

  return (
    <div className="naql-container">
      <section>
        <h1 className='bismillah'>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</h1>
        <h2 className="naql-title">Naql {currentNaql}:</h2>
        <div className="naql-content">
          {nuqoolObject[currentNaql]}
          {nuqoolKhulasaObject?.[currentNaql]}
        </div>
      </section>

      <div className="naql-nav">
        <button
          className="naql-nav__btn"
          onClick={() => setCurrentNaql(n => Math.max(1, n - 1))}
          disabled={currentNaql === 1}
        >
          ← Back
        </button>
        <span className="naql-nav__counter">{currentNaql} / {TOTAL}</span>
        <button
          className="naql-nav__btn"
          onClick={() => setCurrentNaql(n => Math.min(TOTAL, n + 1))}
          disabled={currentNaql === TOTAL}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
