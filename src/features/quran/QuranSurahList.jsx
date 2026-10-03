import { useEffect, useState, useMemo } from 'react';
import { fetchSurahList } from './quranApi';
import { useLang } from '../../context/LanguageContext';
import AppIcon from '../../components/icons/AppIcon';
import { Button } from "@/components/shadcn/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/shadcn/empty";
import { Skeleton } from "@/components/shadcn/skeleton";
import RowList from '../../components/layout/RowList';
import PageHeader from '../../components/layout/PageHeader';
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
        <Empty className="gap-3 rounded-none border-0 p-5 md:p-6">
          <EmptyHeader>
            <EmptyMedia><AppIcon name="retry" size={25} /></EmptyMedia>
            <EmptyTitle>{t('quranLoadError')}</EmptyTitle>
          </EmptyHeader>
          <Button type="button" variant="secondary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            {t('socialRetry')}
          </Button>
        </Empty>
      </div>
    );
  }
  if (!surahs) {
    return (
      <div className="quran-list__skeleton grid gap-3" role="status" aria-label={t('quranLoading')}>
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-[4.5rem] rounded-none bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className={`quran-list${compact ? ' quran-list--compact' : ''}`}>
      <PageHeader className="quran-list__header">
        <h1>{t("titleQuran")}</h1>
        <input
          type="search"
          className="quran-list__search"
          placeholder={t('quranSearchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("quranSearchLabel")}
        />
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
        <Empty className="gap-3 rounded-none border-0 p-5 md:p-6">
          <EmptyHeader>
            <EmptyMedia><AppIcon name="book" size={25} /></EmptyMedia>
            <EmptyTitle>{t('quranNoResults')}</EmptyTitle>
            <EmptyDescription>{query}</EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="secondary" onClick={() => setQuery('')}>
            {t('quranClearSearch')}
          </Button>
        </Empty>
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
}