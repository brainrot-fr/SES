import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSurah } from './quranApi';
import { quranTranslations } from './quranTranslations';
import { useLang } from '../../context/LanguageContext';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon } from '../../components/icons/MediaIcons.jsx';
import './quran.css';

const TOTAL_SURAHS = 114;
const NO_SEPARATE_BISMILLAH = [1, 9]; // Al-Fatiha has it as ayah 1 itself; At-Tawbah omits it
const STORAGE_KEY = 'ses-current-surah';

export default function QuranReader({ initialSurah, onBack }) {
  const { t } = useLang();

  const [currentSurah, setCurrentSurah] = useState(() => {
    const n = initialSurah ?? parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= TOTAL_SURAHS ? n : 1;
  });
  const [surah, setSurah] = useState(null);
  const [error, setError] = useState(null);
  const [playingAyah, setPlayingAyah] = useState(null);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Lazy-init once, during render — guarantees audioRef.current is ready
  // before any effect below touches it.
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = new Audio();
  }
  const topRef = useRef(null);

  const goTo = useCallback(
    (n) => setCurrentSurah(Math.max(1, Math.min(TOTAL_SURAHS, n))),
    []
  );

  useEffect(() => {
    let cancelled = false;
    setSurah(null);
    setError(null);
    audioRef.current.pause();
    setPlayingAyah(null);
    setAutoAdvance(false);
    localStorage.setItem(STORAGE_KEY, String(currentSurah));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    fetchSurah(currentSurah)
      .then((data) => { if (!cancelled) setSurah(data); })
      .catch((err) => { if (!cancelled) setError(err.message); });

    return () => { cancelled = true; };
  }, [currentSurah]);

  const playAyah = useCallback((ayah, chain = false) => {
    const audio = audioRef.current;
    audio.src = ayah.audioUrl;
    audio.play().catch(() => {}); // ignore — needs a user gesture the first time
    setPlayingAyah(ayah.numberInSurah);
    setAutoAdvance(chain);
  }, []);

  const stopAudio = useCallback(() => {
    audioRef.current.pause();
    setPlayingAyah(null);
    setAutoAdvance(false);
  }, []);

  // Auto-advance through the surah when "Play Surah" is active
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      if (!autoAdvance || !surah) { setPlayingAyah(null); return; }
      const next = surah.ayahs.find((a) => a.numberInSurah === playingAyah + 1);
      if (next) playAyah(next, true);
      else { setPlayingAyah(null); setAutoAdvance(false); }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [autoAdvance, playingAyah, surah, playAyah]);

  const translationForAyah = (numberInSurah) =>
    quranTranslations[currentSurah]?.[numberInSurah];

  return (
    <div className="quran-container">
      <div ref={topRef} className="quran-scroll-anchor" />

      {onBack && (
        <button className="quran-back" onClick={onBack}>
          {t('quranBackToList')}
        </button>
      )}

      {error && <div className="quran-state quran-state--error">{t('quranLoadError')}</div>}
      {!surah && !error && <div className="quran-state">{t('quranLoading')}</div>}

      {surah && (
        <section className="quran-body">
          <header className="quran-surah-header">
            <h2 className="quran-surah-header__ar">{surah.name}</h2>
            <p className="quran-surah-header__en">
              {surah.englishName} · {surah.englishNameTranslation}
            </p>
          </header>

          {!NO_SEPARATE_BISMILLAH.includes(currentSurah) && (
            <h1 className="quran-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</h1>
          )}

          <div className="quran-ayahs">
            {surah.ayahs.map((ayah) => {
              const translation = translationForAyah(ayah.numberInSurah);
              const isPlaying = playingAyah === ayah.numberInSurah;
              return (
                <div key={ayah.number} className={`quran-ayah ${isPlaying ? 'quran-ayah--playing' : ''}`}>
                  <div className="quran-ayah__row">
                    <span className="quran-ayah__num">{ayah.numberInSurah}</span>
                    <p className="quran-ayah__text">{ayah.text}</p>
                    <button
                      className="quran-ayah__play"
                      onClick={() => (isPlaying ? stopAudio() : playAyah(ayah))}
                      aria-label={isPlaying ? t('quranPause') : t('quranPlayAyah')}
                    >
                      {isPlaying ? (
                        <PauseIcon className="quran-ayah__icon" title={t('quranPause')} />
                      ) : (
                        <PlayIcon className="quran-ayah__icon" title={t('quranPlayAyah')} />
                      )}
                    </button>
                  </div>
                  {translation && (
                    <div className="quran-ayah__translation">
                      <p className="quran-ayah__ur">{translation.ur}</p>
                      <p className="quran-ayah__translit">{translation.urTransliteration}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
            onClick={() => (autoAdvance ? stopAudio() : surah && playAyah(surah.ayahs[0], true))}
            disabled={!surah}
            aria-label={autoAdvance ? t('quranPause') : t('quranPlaySurah')}
          >
            {autoAdvance ? (
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