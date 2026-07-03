import { useState } from 'react';
import QuranSurahList from './QuranSurahList';
import QuranReader from './QuranReader';

const STORAGE_KEY = 'ses-current-surah';

export default function Quran() {
  const [selectedSurah, setSelectedSurah] = useState(() => {
    const n = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= 114 ? n : null;
  });

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