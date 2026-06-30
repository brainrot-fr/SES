import { createContext, useContext, useState } from 'react';
import en from '../i18n/en';
import ur from '../i18n/ur';

const strings = { en, ur };
const Ctx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ses-lang'));

  const chooseLang = (l) => {
    localStorage.setItem('ses-lang', l);
    setLang(l);
  };

  // Clears lang → triggers onboarding again
  const resetLang = () => {
    localStorage.removeItem('ses-lang');
    setLang(null);
  };

  const t = (key) => strings[lang]?.[key] ?? strings.en[key] ?? key;
  const isRTL = lang === 'ur';

  return (
    <Ctx.Provider value={{ lang, chooseLang, resetLang, t, isRTL }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);