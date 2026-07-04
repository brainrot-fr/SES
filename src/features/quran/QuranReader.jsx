import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { fetchSurah, RECITERS, buildAudioUrl, getSavedReciter, saveReciter } from './quranApi';
import { LocalNotifications } from '@capacitor/local-notifications';
import { quranTranslations } from './quranTranslations';
import { useLang } from '../../context/LanguageContext';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon } from '../../components/icons/MediaIcons.jsx';
import './quran.css';

const TOTAL_SURAHS = 114;
const NO_SEPARATE_BISMILLAH = [1, 9]; // Al-Fatiha has it as ayah 1 itself; At-Tawbah omits it
const STORAGE_KEY = 'ses-current-surah';
const NOTIF_ID = 778899;

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
  const [reciter, setReciter] = useState(() => getSavedReciter());
  const [isPaused, setIsPaused] = useState(false);
  const [showTranslation, setShowTranslation] = useState(
    () => localStorage.getItem('ses-show-translation') !== 'false'
  );

  // Lazy-init once, during render — guarantees audioRef.current is ready
  // before any effect below touches it.
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = new Audio();
  }
  const topRef = useRef(null);

  const stateRef = useRef({ playingAyah: null, isPaused: false, surah: null, autoAdvance: false });
  useEffect(() => {
    stateRef.current = { playingAyah, isPaused, surah, autoAdvance };
  });

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
    audio.src = buildAudioUrl(ayah.number, reciter);
    audio.play().catch(() => {});
    setPlayingAyah(ayah.numberInSurah);
    setAutoAdvance(chain);
    setIsPaused(false);
  }, [reciter]);

  const pauseAudio = useCallback(() => {
    audioRef.current.pause();
    setIsPaused(true);
  }, []);

  const resumeAudio = useCallback(() => {
    audioRef.current.play().catch(() => {});
    setIsPaused(false);
  }, []);

  const stopAudio = useCallback(() => {
    audioRef.current.pause();
    setPlayingAyah(null);
    setAutoAdvance(false);
    setIsPaused(false);
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

  // Subscribe to native button taps
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    console.log('[MusicControls] subscribing to actions');

    const handleAction = (action) => {
      console.log('[MusicControls] action received', action);
      const { surah: s, playingAyah: pa, autoAdvance: aa } = stateRef.current;
      const message = JSON.parse(action).message;
      switch (message) {
        case 'music-controls-pause':
        case 'music-controls-media-button-pause':
          pauseAudio();
          break;
        case 'music-controls-play':
        case 'music-controls-media-button-play':
          resumeAudio();
          break;
        case 'music-controls-next':
        case 'music-controls-media-button-next': {
          const next = s?.ayahs.find((a) => a.numberInSurah === pa + 1);
          if (next) playAyah(next, aa);
          break;
        }
        case 'music-controls-previous':
        case 'music-controls-media-button-previous': {
          const prev = s?.ayahs.find((a) => a.numberInSurah === pa - 1);
          if (prev) playAyah(prev, aa);
          break;
        }
        default:
          break;
      }
    };

    MusicControls.subscribe(handleAction);
    MusicControls.listen();

    return () => {
      MusicControls.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create / update / tear down the notification as playback state changes
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    if (playingAyah && surah) {
      console.log('[MusicControls] create() called', { playingAyah, isPaused });
      MusicControls.create({
        track: `Ayah ${playingAyah}`,
        artist: surah.englishName,
        album: 'Quran',
        isPlaying: !isPaused,
        hasPrev: playingAyah > 1,
        hasNext: playingAyah < surah.numberOfAyahs,
        hasClose: true,
        dismissable: true,
      }, () => {}, (err) => console.error('[MusicControls] create failed', err));
      MusicControls.updateIsPlaying(!isPaused);
    } else {
      MusicControls.destroy();
    }
  }, [playingAyah, isPaused, surah]);

  useEffect(() => {
    saveReciter(reciter);
    if (playingAyah != null && surah) {
      const current = surah.ayahs.find((a) => a.numberInSurah === playingAyah);
      if (current) {
        audioRef.current.src = buildAudioUrl(current.number, reciter);
        if (!isPaused) audioRef.current.play().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciter]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (playingAyah && surah) {
      if (typeof MediaMetadata !== 'undefined') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${surah.englishName} · Ayah ${playingAyah}`,
          artist: t('appTitle'),
          album: 'Quran',
        });
      }
      navigator.mediaSession.playbackState = isPaused ? 'paused' : 'playing';
      navigator.mediaSession.setActionHandler('play', resumeAudio);
      navigator.mediaSession.setActionHandler('pause', pauseAudio);
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const prev = surah.ayahs.find((a) => a.numberInSurah === playingAyah - 1);
        if (prev) playAyah(prev, autoAdvance);
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const next = surah.ayahs.find((a) => a.numberInSurah === playingAyah + 1);
        if (next) playAyah(next, autoAdvance);
      });
    } else {
      navigator.mediaSession.playbackState = 'none';
    }
  }, [playingAyah, isPaused, surah, autoAdvance, playAyah, pauseAudio, resumeAudio, t]);

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

          <div className="quran-reciter">
            <label htmlFor="reciter-select" className="quran-reciter__label">
              {t('quranReciter')}
            </label>
            <select
              id="reciter-select"
              className="quran-reciter__select"
              value={reciter}
              onChange={(e) => setReciter(e.target.value)}
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="quran-translation-toggle"
            onClick={() => {
              setShowTranslation((v) => {
                localStorage.setItem('ses-show-translation', String(!v));
                return !v;
              });
            }}
          >
            {showTranslation ? t('quranHideTranslation') : t('quranShowTranslation')}
          </button>

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
                      onClick={() => {
                        if (isPlaying && !isPaused) pauseAudio();
                        else if (isPlaying && isPaused) resumeAudio();
                        else playAyah(ayah);
                      }}
                      aria-label={isPlaying && !isPaused ? t('quranPause') : t('quranPlayAyah')}
                    >
                      {isPlaying && !isPaused ? (
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
            onClick={() => {
              if (autoAdvance && !isPaused) pauseAudio();
              else if (autoAdvance && isPaused) resumeAudio();
              else surah && playAyah(surah.ayahs[0], true);
            }}
            disabled={!surah}
            aria-label={autoAdvance && !isPaused ? t('quranPause') : t('quranPlaySurah')}
          >
            {autoAdvance && !isPaused ? (
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