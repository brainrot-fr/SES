/**
 * Onboarding.jsx
 * Initial language selection screen shown before the app loads.
 *
 * - Lets the user choose English or Urdu.
 * - Stores the choice through LanguageContext.
 */

import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { Button } from './shadcn/button';
import { ToggleGroup, ToggleGroupItem } from './shadcn/toggle-group';
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
        <ToggleGroup
          type="single"
          value={selected}
          onValueChange={(value) => value && setSelected(value)}
          aria-label={t("obChoose")}
          className="ob-options grid w-full"
        >
          <ToggleGroupItem value="en" variant="ghost" className="ob-option justify-start rounded-none border-0 border-b bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary">
            <span className="ob-option__code" aria-hidden="true">EN</span>{t("obEnglish")}
          </ToggleGroupItem>
          <ToggleGroupItem value="ur" variant="ghost" className="ob-option ob-option--rtl justify-start rounded-none border-0 border-b bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-primary" dir="rtl">
            {t("obUrdu")}
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          type="button"
          size="lg"
          className="w-full ob-continue"
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