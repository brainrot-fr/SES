import { useEffect, useState, useMemo } from 'react';
import { fetchSurahList } from './quranApi';
import { useLang } from '../../context/LanguageContext';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import RowList from '../../components/layout/RowList';
import PageHeader from '../../components/layout/PageHeader';
import AppIcon from '../../components/icons/AppIcon';
import { Input, ScrollArea } from '../../components/shadcn/primitives';
import './quran.css';

export default function QuranSurahList({
  onOpenSurah,
  activeSurah = null,
  compact = false,
  initialSurahs = null,
}) {
  const { t } = useLang();
  const [surahs, setSurahs] = useState(initialSurahs);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [continueSurah] = useState(() => Number(localStorage.getItem('ses-current-surah')) || null);

  useEffect(() => {
    if (initialSurahs) {
      setSurahs(initialSurahs);
      setError(null);
      return undefined;
    }
    let cancelled = false;
    setSurahs(null);
    setError(null);
    fetchSurahList()
      .then((list) => { if (!cancelled) setSurahs(list); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [initialSurahs, loadAttempt]);

  const filteredSurahs = useMemo(() => {
    if (!surahs) return null;
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) => (
      s.name.includes(query.trim()) ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      String(s.number).includes(q)
    ));
  }, [surahs, query]);

  if (error) {
    return (
      <div className="quran-state quran-state--error" role="alert">
        <EmptyState
          icon="retry"
          title={t('quranLoadError')}
          action={{ label: t('socialRetry'), onClick: () => setLoadAttempt((attempt) => attempt + 1) }}
        />
      </div>
    );
  }
  if (!surahs) {
    return <Skeleton variant="list" count={8} label={t('quranLoading')} className="quran-list__skeleton" />;
  }

  const listContent = (
    <div className={`quran-list${compact ? ' quran-list--compact' : ''}`}>
      <PageHeader className="quran-list__header">
        <h1>{t("titleQuran")}</h1>
        <label className="relative min-w-0">
          <AppIcon name="search" size={18} className="quran-list__search-icon" />
          <Input
          type="search"
          className="quran-list__search"
          placeholder={t('quranSearchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("quranSearchLabel")}
          />
        </label>
      </PageHeader>

      {continueSurah && surahs[continueSurah - 1] && (
        <button
          type="button"
          className="quran-list__continue"
          onClick={() => onOpenSurah(continueSurah)}
        >
          <span className="quran-list__continue-label">{t('quranContinue')}</span>
          <span className="quran-list__continue-name">{surahs[continueSurah - 1].englishName}</span>
          <span className="quran-list__continue-num">{continueSurah}</span>
        </button>
      )}

      {filteredSurahs.length === 0 ? (
        <EmptyState
          icon="book"
          title={t('quranNoResults')}
          description={query}
          action={{ label: t('quranClearSearch'), onClick: () => setQuery('') }}
        />
      ) : (
        <RowList className="quran-list__rows">
          {filteredSurahs.map((s) => (
            <button
              key={s.number}
              type="button"
              className={`quran-list__item${activeSurah === s.number ? ' quran-list__item--active' : ''}`}
              onClick={() => onOpenSurah(s.number)}
              aria-current={activeSurah === s.number ? 'page' : undefined}
            >
              <span className="quran-list__num">{s.number}</span>
              <span className="quran-list__names">
                <span className="quran-list__en">{s.englishName} · {s.englishNameTranslation}</span>
                <span className="quran-list__meta">{s.numberOfAyahs} · {s.revelationType}</span>
              </span>
              <span className="quran-list__ar" lang="ar" dir="rtl">{s.name}</span>
            </button>
          ))}
        </RowList>
      )}
    </div>
  );

  return compact
    ? <ScrollArea className="quran-list__rail-scroll">{listContent}</ScrollArea>
    : listContent;
}