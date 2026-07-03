import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import './Onboarding.css';

export default function Onboarding() {
  const { chooseLang } = useLang();
  const [selected, setSelected] = useState('en');

  return (
    <div className="ob-root">
      <div className="ob-card">

        <h1 className="ob-title">Nuqool e Imam Mahdi A.S</h1>
        <p className="ob-title-ur">نقول امام مہدی علیہ السلام</p>

        <p className="ob-prompt">
          Choose your language&nbsp;/&nbsp;زبان منتخب کریں
        </p>

        <div className="ob-options">
          <button
            className={`ob-option ${selected === 'en' ? 'ob-option--active' : ''}`}
            onClick={() => setSelected('en')}
          >
            English
          </button>
          <button
            className={`ob-option ob-option--rtl ${selected === 'ur' ? 'ob-option--active' : ''}`}
            onClick={() => setSelected('ur')}
          >
            اردو
          </button>
        </div>

        <button className="ob-continue" onClick={() => chooseLang(selected)}>
          {selected === 'ur' ? 'جاری رکھیں' : 'Continue'}
        </button>
      </div>
    </div>
  );
}