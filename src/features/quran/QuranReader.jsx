import { useState, useEffect, useRef } from 'react';
import { fetchSurah, RECITERS } from './quranApi';
import { quranTranslations } from './quranTranslations';
import { useLang } from '../../context/LanguageContext';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon } from '../../components/icons/MediaIcons.jsx';
import { useQuranAudioPlayer } from './useQuranAudioPlayer';
import './quran.css';

const TOTAL_SURAHS = 114;
const NO_SEPARATE_BISMILLAH = [1, 9];
const STORAGE_KEY = 'ses-current-surah';
const VIEW_MODE_KEY = 'ses-quran-view-mode';
const TRANSLATION_KEY = 'ses-show-translation';
const AYAH_BATCH_SIZE = 20;

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicNumber = (n) => String(n).split('').map((d) => ARABIC_DIGITS[Number(d)]).join('');

export default function QuranReader({ initialSurah, onBack }) {
  const { t } = useLang();

  const [currentSurah, setCurrentSurah] = useState(() => {
    const n = initialSurah ?? parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= TOTAL_SURAHS ? n : 1;
  });
  const [surah, setSurah] = useState(null);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(AYAH_BATCH_SIZE);

  const [viewMode, setViewMode] = useState(() => localStorage.getItem(VIEW_MODE_KEY) || 'verse');
  const [showTranslation, setShowTranslation] = useState(
    () => localStorage.getItem(TRANSLATION_KEY) !== 'false'
  );

  useEffect(() => { localStorage.setItem(VIEW_MODE_KEY, viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem(TRANSLATION_KEY, String(showTranslation)); }, [showTranslation]);

  const topRef = useRef(null);
  const sentinelRef = useRef(null);

  const goTo = (n) => setCurrentSurah(Math.max(1, Math.min(TOTAL_SURAHS, n)));

  const {
    activeAyahNumber, isPlaying, autoAdvance,
    reciterId, changeReciter,
    pause, resume,
    toggleAyah, playSurahFromStart, stop,
  } = useQuranAudioPlayer(surah);

  useEffect(() => {
    let cancelled = false;
    setSurah(null);
    setError(null);
    setVisibleCount(AYAH_BATCH_SIZE);
    localStorage.setItem(STORAGE_KEY, String(currentSurah));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    fetchSurah(currentSurah)
      .then((data) => { if (!cancelled) setSurah(data); })
      .catch((err) => { if (!cancelled) setError(err.message); });

    return () => { cancelled = true; };
  }, [currentSurah]);

  useEffect(() => {
    if (!surah) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + AYAH_BATCH_SIZE, surah.ayahs.length));
        }
      },
      { rootMargin: '800px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [surah]);

  useEffect(() => {
    if (activeAyahNumber && activeAyahNumber > visibleCount) {
      setVisibleCount((c) => Math.max(c, activeAyahNumber));
    }
  }, [activeAyahNumber, visibleCount]);

  const translationForAyah = (numberInSurah) => quranTranslations[currentSurah]?.[numberInSurah];

  const visibleAyahs = surah ? surah.ayahs.slice(0, visibleCount) : [];
  const hasMore = surah ? visibleCount < surah.ayahs.length : false;

  return (
    <div className="quran-container">
      <div ref={topRef} className="quran-scroll-anchor" />

      {onBack && (
        <button className="quran-back" onClick={() => { stop(); onBack(); }}>
          {t('quranBackToList')}
        </button>
      )}

      {error && <div className="quran-state quran-state--error">{t('quranLoadError')}</div>}
      {!surah && !error && <div className="quran-state">{t('quranLoading')}</div>}

      {surah && (
        <section className="quran-body">

          <div className="quran-reciter">
            <span className="quran-reciter__label">{t('quranReciter')}</span>
            <div className="quran-reciter__chips" role="radiogroup" aria-label={t('quranReciter')}>
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={reciterId === r.id}
                  className={`quran-reciter__chip ${reciterId === r.id ? 'quran-reciter__chip--active' : ''}`}
                  onClick={() => changeReciter(r.id)}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          <div className="quran-view-toggle" role="tablist" aria-label={t('quranViewMode')}>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'verse'}
              className={`quran-view-toggle__btn ${viewMode === 'verse' ? 'quran-view-toggle__btn--active' : ''}`}
              onClick={() => setViewMode('verse')}
            >
              {t('quranVerseByVerse')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'reading'}
              className={`quran-view-toggle__btn ${viewMode === 'reading' ? 'quran-view-toggle__btn--active' : ''}`}
              onClick={() => setViewMode('reading')}
            >
              {t('quranReadingMode')}
            </button>
          </div>
              <header className="quran-surah-header">
            <h2 className="quran-surah-header__ar">{surah.name}</h2>
            <p className="quran-surah-header__en">
              {surah.englishName} · {surah.englishNameTranslation}
            </p>
          </header>
          {viewMode === 'verse' && (
            <button
              className="quran-translation-toggle"
              onClick={() => setShowTranslation((v) => !v)}
            >
              {showTranslation ? t('quranHideTranslation') : t('quranShowTranslation')}
            </button>
          )}

          {!NO_SEPARATE_BISMILLAH.includes(currentSurah) && (
            <h1 className="quran-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</h1>
          )}

          {viewMode === 'reading' ? (
            <p className="quran-reading">
              {visibleAyahs.map((ayah) => {
                const isThisPlaying = isPlaying && activeAyahNumber === ayah.numberInSurah;
                return (
                  <span
                    key={ayah.number}
                    role="button"
                    tabIndex={0}
                    className={`quran-reading__ayah ${isThisPlaying ? 'quran-reading__ayah--playing' : ''}`}
                    onClick={() => toggleAyah(ayah)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAyah(ayah); }
                    }}
                  >
                    {ayah.text}
                    <span className="quran-reading__marker">﴿{toArabicNumber(ayah.numberInSurah)}﴾</span>{' '}
                  </span>
                );
              })}
              {hasMore && <span ref={sentinelRef} style={{ display: 'inline-block', width: 1, height: 1 }} />}
            </p>
          ) : (
            <div className="quran-ayahs">
              {visibleAyahs.map((ayah) => {
                const translation = translationForAyah(ayah.numberInSurah);
                const isThisPlaying = isPlaying && activeAyahNumber === ayah.numberInSurah;
                return (
                  <div key={ayah.number} className={`quran-ayah ${isThisPlaying ? 'quran-ayah--playing' : ''}`}>
                    <div className="quran-ayah__row">
                      <span className="quran-ayah__num">{ayah.numberInSurah}</span>
                      <p className="quran-ayah__text">{ayah.text}</p>
                      <button
                        className="quran-ayah__play"
                        onClick={() => toggleAyah(ayah)}
                        aria-label={isThisPlaying ? t('quranPause') : t('quranPlayAyah')}
                      >
                        {isThisPlaying ? (
                          <PauseIcon className="quran-ayah__icon" title={t('quranPause')} />
                        ) : (
                          <PlayIcon className="quran-ayah__icon" title={t('quranPlayAyah')} />
                        )}
                      </button>
                    </div>
                    {showTranslation && translation && (
                      <div className="quran-ayah__translation">
                        <p className="quran-ayah__ur">{translation.ur}</p>
                        <p className="quran-ayah__translit">{translation.urTransliteration}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
            </div>
          )}
        </section>
      )}

      <nav className="quran-nav">
        <div className="quran-nav__row">
          <button
            className="quran-nav__btn"
            onClick={() => goTo(currentSurah - 1)}
            disabled={currentSurah === 1}
            aria-label={t('quranPrevSurahLabel')}
          >
            <PrevIcon className="quran-nav__icon" title={t('quranPrevSurahLabel')} />
          </button>

          <button
            className="quran-nav__play-surah"
            onClick={() => {
              if (autoAdvance && isPlaying) pause();
              else if (autoAdvance && !isPlaying) resume();
              else playSurahFromStart();
            }}
            disabled={!surah}
            aria-label={autoAdvance && isPlaying ? t('quranPause') : t('quranPlaySurah')}
          >
            {autoAdvance && isPlaying ? (
              <>
                <PauseIcon className="quran-nav__icon" title={t('quranPause')} />
                <span className="quran-nav__play-text">{t('quranPause')}</span>
              </>
            ) : (
              <>
                <PlayIcon className="quran-nav__icon" title={t('quranPlaySurah')} />
                <span className="quran-nav__play-text">{t('quranPlaySurah')}</span>
              </>
            )}
          </button>

          <button
            className="quran-nav__btn"
            onClick={() => goTo(currentSurah + 1)}
            disabled={currentSurah === TOTAL_SURAHS}
            aria-label={t('quranNextSurahLabel')}
          >
            <NextIcon className="quran-nav__icon" title={t('quranNextSurahLabel')} />
          </button>
        </div>
      </nav>
    </div>
  );
}