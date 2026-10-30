/**
 * Quran.jsx
 * Entry component for the Quran feature.
 *
 * - Loads the last selected Surah from storage.
 * - Shows either the surah list or the selected surah reader.
 */

import QuranSurahList from '@/features/quran/QuranSurahList';
import QuranReader from '@/features/quran/QuranReader';
import { QURAN_SURAH_LIST } from '@/features/quran/quranData';

export default function Quran({
  selectedSurah,
  selectedAyah,
  onNavigate,
}) {
  if (selectedSurah == null) {
    return <QuranSurahList onOpenSurah={onNavigate} />;
  }

  return (
    <div className="quran-layout quran-layout--reader">
      <aside className="quran-layout__index">
        <QuranSurahList
          onOpenSurah={onNavigate}
          activeSurah={selectedSurah}
          compact
          initialSurahs={QURAN_SURAH_LIST}
        />
      </aside>
      <div className="quran-layout__reader">
        <QuranReader
          key={`${selectedSurah}-${selectedAyah || ""}`}
          initialSurah={selectedSurah}
          initialAyah={selectedAyah}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}