/**
 * LanguageContext.jsx
 * Handles language state and text translations.
 *
 * - Reads and writes the selected language to localStorage.
 * - Updates the document language and text direction.
 * - Provides a translation helper and reset function.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en';
import ur from '../i18n/ur';

const strings = { en, ur };
const Ctx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ses-lang-v2'));
  const isRTL = lang === 'ur';

  /*
   * Keep <html dir>/<html lang> in sync so native bidi handles
   * text alignment, punctuation, etc. without per-element overrides
   * Keep the document direction and language attribute in sync with the selected locale.
   */

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang || 'en';
  }, [lang, isRTL]);

  const chooseLang = (l) => {
    localStorage.setItem('ses-lang-v2', l);
    setLang(l);
  };

  const resetLang = () => {
    localStorage.removeItem('ses-lang-v2');
    setLang(null);
  };

  /* Translation helper: fall back to English if the current language key is missing. */
  const t = (key) => strings[lang]?.[key] ?? strings.en[key] ?? key;

  return (
    <Ctx.Provider value={{ lang, chooseLang, resetLang, t, isRTL }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);