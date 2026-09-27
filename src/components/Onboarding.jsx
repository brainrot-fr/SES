/**
 * Onboarding.jsx
 * Initial language selection screen shown before the app loads.
 *
 * - Lets the user choose English or Urdu.
 * - Stores the choice through LanguageContext.
 */

import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import AppIcon from './icons/AppIcon';
import Button from './ui/Button';
import Card from './ui/Card';
import './Onboarding.css';

export default function Onboarding() {
  const { chooseLang, t } = useLang();
  const [selected, setSelected] = useState('en');

  return (
    <main className="ob-root">
      <Card className="ob-card">
        <span className="ob-mark" aria-hidden="true"><AppIcon name="nuqool" size={32} /></span>
        <h1 className="ob-title">{t("appTitle")}</h1>
        <p className="ob-title-ur" lang="ur" dir="rtl">
          نقول امام مہدی علیہ السلام
        </p>
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
            {t("obEnglish")}
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
          fullWidth
          size="lg"
          className="ob-continue"
          lang={selected}
          dir={selected === 'ur' ? 'rtl' : 'ltr'}
          onClick={() => chooseLang(selected)}
        >
          {t(selected === 'ur' ? "obContinueUr" : "obContinueEn")}
        </Button>
      </Card>
    </main>
  );
}