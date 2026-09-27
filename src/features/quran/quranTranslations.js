/**
 * Quran Translations (v2 — not wired into the UI yet)
 * -----------------------------------------------------
 * Same pattern as nuqoolObject in features/nuqool/en/nuqool.jsx: just fill in
 * this object, nothing else needs to change. Ayah text always comes from
 * quranApi.js; translation text never does — no API carries the exact
 * wording this app needs, so it's entered here by hand.
 *
 * Shape: quranTranslations[surahNumber][ayahNumberInSurah] = { ur, urTransliteration }
 *   ur                 — Urdu-script translation
 *   urTransliteration  — the same translation transliterated into Latin
 *                         script, written the way naql text already is
 *                         (see nuqool.jsx)
 *
 * Once a surah has entries here, QuranReader will show them under the
 * matching ayah automatically.
 */
export const quranTranslations = {
  1: {
    1: { ur: 'ٹیسٹ ترجمہ — آیت ۱', urTransliteration: 'Test translation — Ayah 1' },
    2: { ur: 'ٹیسٹ ترجمہ — آیت ۲', urTransliteration: 'Test translation — Ayah 2' },
    3: { ur: 'ٹیسٹ ترجمہ — آیت ۳', urTransliteration: 'Test translation — Ayah 3' },
  },
};

export default quranTranslations;