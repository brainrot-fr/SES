/**
 * LanguageContext.jsx
 * Handles language state and text translations.
 *
 * - Reads and writes the selected language to localStorage.
 * - Updates the document language and text direction.
 * - Provides a translation helper and reset function.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import en from '@/i18n/en';
import ur from '@/i18n/ur';

const strings = { en, ur };
const Ctx = createContext(null);

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem('ses-lang-v2');
    return saved === 'en' || saved === 'ur' ? saved : null;
  } catch (error) {
    console.warn('[language] could not read saved language', error);
    return null;
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readSavedLanguage);
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

  const chooseLang = useCallback((l) => {
    if (l !== 'en' && l !== 'ur') return;
    try {
      localStorage.setItem('ses-lang-v2', l);
    } catch (error) {
      console.warn('[language] could not persist selected language', error);
    }
    setLang(l);
  }, []);

  const resetLang = useCallback(() => {
    try {
      localStorage.removeItem('ses-lang-v2');
    } catch (error) {
      console.warn('[language] could not clear saved language', error);
    }
    setLang(null);
  }, []);

  /* Translation helper: fall back to English if the current language key is missing. */
  const t = useCallback((key) => strings[lang]?.[key] ?? strings.en[key] ?? key, [lang]);
  const value = useMemo(() => ({ lang, chooseLang, resetLang, t, isRTL }), [lang, chooseLang, resetLang, t, isRTL]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);