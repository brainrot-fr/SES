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
import { useLang } from '../../context/LanguageContext';

const STORAGE_KEY = 'ses-current-surah';

export default function Quran({
  selectedSurah: controlledSurah,
  selectedAyah,
  onSelectSurah,
} = {}) {
  const { t } = useLang();
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
    <div className="quran-layout quran-layout--reader">
      <aside className="quran-layout__surahs" aria-label={t('quranSurahNavigation')}>
        <QuranSurahList
          onOpenSurah={setSelectedSurah}
          activeSurah={selectedSurah}
          compact
        />
      </aside>
      <div className="quran-layout__reader">
        <QuranReader
          key={`${selectedSurah}-${selectedAyah || ""}`}
          initialSurah={selectedSurah}
          initialAyah={selectedAyah}
        />
      </div>
    </div>
  );
}