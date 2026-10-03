/**
 * Onboarding.jsx
 * Initial language selection screen shown before the app loads.
 *
 * - Lets the user choose English or Urdu.
 * - Stores the choice through LanguageContext.
 */

import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { Button } from "@/components/shadcn/button";
import EntryBrand from './layout/EntryBrand';
import './Onboarding.css';

export default function Onboarding() {
  const { chooseLang, t } = useLang();
  const [selected, setSelected] = useState('en');

  return (
    <main className="ob-root">
      <EntryBrand />
      <section className="ob-content" aria-labelledby="onboarding-title">
        <h1 className="ob-title" id="onboarding-title">{t("appTitle")}</h1>
        <p
          className="ob-purpose"
          lang={selected}
          dir={selected === 'ur' ? 'rtl' : 'ltr'}
        >
          {t(selected === 'ur' ? "obValuePropUr" : "obValuePropEn")}
        </p>
        <p className="ob-prompt">{t("obChoose")}</p>
        <div className="ob-options">
          <Button
            type="button"
            onClick={() => setSelected('en')}
            variant="secondary"
            className={`ob-option${selected === 'en' ? ' ob-option--active' : ''}`}
            aria-pressed={selected === 'en'}
          >
            <span className="ob-option__code" aria-hidden="true">EN</span>
            <span>{t("obEnglish")}</span>
          </Button>
          <Button
            type="button"
            onClick={() => setSelected('ur')}
            variant="secondary"
            className={`ob-option ob-option--rtl${selected === 'ur' ? ' ob-option--active' : ''}`}
            dir="rtl"
            aria-pressed={selected === 'ur'}
          >
            {t("obUrdu")}
          </Button>
        </div>
        <Button
          type="button"
          className="w-full ob-continue"
          size="lg"
          lang={selected}
          dir={selected === 'ur' ? 'rtl' : 'ltr'}
          onClick={() => chooseLang(selected)}
        >
          {t(selected === 'ur' ? "obContinueUr" : "obContinueEn")}
        </Button>
      </section>
    </main>
  );
}