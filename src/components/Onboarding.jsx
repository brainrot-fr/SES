/**
 * Onboarding.jsx
 * Initial language selection screen shown before the app loads.
 *
 * - Lets the user choose English or Urdu.
 * - Stores the choice through LanguageContext.
 */

import { useState } from 'react';
import { useLang } from '../context/LanguageContext';

export default function Onboarding() {
  const { chooseLang } = useLang();
  const [selected, setSelected] = useState('en');

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="flex flex-col items-center gap-4 max-w-[340px] w-full text-center bg-surface-2 rounded-lg shadow-lg px-5 py-8">

        <h1 className="text-[1.1rem] font-bold text-heading m-0 leading-snug">
          Nuqool e Imam Mahdi A.S
        </h1>
        <p className="font-['Readex_Pro'] text-base text-muted m-0" dir="rtl">
          نقول امام مہدی علیہ السلام
        </p>

        <p className="text-sm text-muted mt-1 mb-0">
          Choose your language&nbsp;/&nbsp;زبان منتخب کریں
        </p>

        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={() => setSelected('en')}
            className={`flex-1 py-3.5 px-4 rounded-md text-base cursor-pointer transition-all duration-150 ${
              selected === 'en'
                ? 'bg-primary-soft text-primary font-bold shadow-[inset_0_0_0_2px_var(--color-primary)]'
                : 'bg-surface-3 text-body shadow-sm hover:shadow-md hover:-translate-y-px'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setSelected('ur')}
            dir="rtl"
            className={`flex-1 py-3.5 px-4 rounded-md text-base font-['Readex_Pro'] cursor-pointer transition-all duration-150 ${
              selected === 'ur'
                ? 'bg-primary-soft text-primary font-bold shadow-[inset_0_0_0_2px_var(--color-primary)]'
                : 'bg-surface-3 text-body shadow-sm hover:shadow-md hover:-translate-y-px'
            }`}
          >
            اردو
          </button>
        </div>

        <button
          onClick={() => chooseLang(selected)}
          className="w-full py-[0.9rem] mt-1 bg-primary text-on-primary rounded-md shadow-md text-base font-bold cursor-pointer transition-all duration-150 hover:shadow-lg hover:-translate-y-px"
        >
          {selected === 'ur' ? 'جاری رکھیں' : 'Continue'}
        </button>

      </div>
    </div>
  );
}