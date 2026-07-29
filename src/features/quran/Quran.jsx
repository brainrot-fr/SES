/**
 * Quran.jsx
 * Entry component for the Quran feature.
 *
 * - Loads the last selected Surah from storage.
 * - Shows either the surah list or the reader depending on selection.
 */

import { useState } from 'react';
import QuranSurahList from './QuranSurahList';
import QuranReader from './QuranReader';

const STORAGE_KEY = 'ses-current-surah';

export default function Quran({ selectedSurah: controlledSurah, onSelectSurah } = {}) {
  const [internalSurah, setInternalSurah] = useState(() => {
    const n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= 114 ? n : null;
  });

  const isControlled = controlledSurah !== undefined;
  const selectedSurah = isControlled ? controlledSurah : internalSurah;
  const setSelectedSurah = isControlled ? onSelectSurah : setInternalSurah;

  if (selectedSurah == null) {
    return <QuranSurahList onOpenSurah={setSelectedSurah} />;
  }

  return (
    <QuranReader
      initialSurah={selectedSurah}
      onBack={() => setSelectedSurah(null)}
    />
  );
}