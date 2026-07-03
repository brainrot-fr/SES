import { useEffect, useState } from 'react';
import { fetchSurahList } from './quranApi';
import { useLang } from '../../context/LanguageContext';
import './quran.css';

export default function QuranSurahList({ onOpenSurah }) {
  const { t } = useLang();
  const [surahs, setSurahs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSurahList()
      .then((list) => { if (!cancelled) setSurahs(list); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div className="quran-state quran-state--error">{t('quranLoadError')}</div>;
  }
  if (!surahs) {
    return <div className="quran-state">{t('quranLoading')}</div>;
  }

  return (
    <div className="quran-list">
      {surahs.map((s) => (
        <button key={s.number} className="quran-list__item" onClick={() => onOpenSurah(s.number)}>
          <span className="quran-list__num">{s.number}</span>
          <span className="quran-list__names">
            <span className="quran-list__ar">{s.name}</span>
            <span className="quran-list__en">{s.englishName} · {s.englishNameTranslation}</span>
          </span>
          <span className="quran-list__meta">{s.numberOfAyahs} · {s.revelationType}</span>
        </button>
      ))}
    </div>
  );
}