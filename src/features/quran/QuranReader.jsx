import { useState, useEffect, useRef } from "react";
import { fetchSurah, RECITERS } from "./quranApi";
import { quranTranslations } from "./quranTranslations";
import { useLang } from "../../context/LanguageContext";
import {
  PlayIcon,
  PauseIcon,
  PrevIcon,
  NextIcon,
  TopArrowIcon,
} from "../../components/icons/MediaIcons.jsx";
import AppIcon from "../../components/icons/AppIcon";
import Skeleton from "../../components/ui/Skeleton";
import Sheet from "../../components/layout/Sheet";
import Band from "../../components/layout/Band";
import { useQuranAudioPlayer } from "./useQuranAudioPlayer";
import "./quran.css";

const TOTAL_SURAHS = 114;
const NO_SEPARATE_BISMILLAH = [1, 9];
const STORAGE_KEY = "ses-current-surah";
const VIEW_MODE_KEY = "ses-quran-view-mode";
const TRANSLATION_KEY = "ses-show-translation";
const QURAN_ZOOM_KEY = "ses-quran-text-zoom";
const MIN_QURAN_ZOOM = 0.8;
const MAX_QURAN_ZOOM = 1.8;
const QURAN_ZOOM_STEP = 0.1;
const AYAH_BATCH_SIZE = 40;

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toArabicNumber = (n) =>
  String(n)
    .split("")
    .map((d) => ARABIC_DIGITS[Number(d)])
    .join("");

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

import Popover from "../../components/ui/Popover";

export default function QuranReader({ initialSurah, initialAyah }) {
  const { t } = useLang();

  const [currentSurah, setCurrentSurah] = useState(() => {
    const n = initialSurah ?? parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= TOTAL_SURAHS ? n : 1;
  });
  const [surah, setSurah] = useState(null);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(AYAH_BATCH_SIZE);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);

  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(VIEW_MODE_KEY) || "verse",
  );
  const [showTranslation, setShowTranslation] = useState(
    () => localStorage.getItem(TRANSLATION_KEY) !== "false",
  );
  const [quranZoom, setQuranZoom] = useState(() => {
    const savedZoom = Number(localStorage.getItem(QURAN_ZOOM_KEY));
    return Number.isFinite(savedZoom) && savedZoom >= MIN_QURAN_ZOOM && savedZoom <= MAX_QURAN_ZOOM
      ? savedZoom
      : 1;
  });

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);
  useEffect(() => {
    localStorage.setItem(TRANSLATION_KEY, String(showTranslation));
  }, [showTranslation]);
  useEffect(() => {
    localStorage.setItem(QURAN_ZOOM_KEY, String(quranZoom));
  }, [quranZoom]);

  const topRef = useRef(null);
  const sentinelRef = useRef(null);
  const ayahRefs = useRef({});
  const deepLinkHandledRef = useRef(false);

  const goTo = (n) => setCurrentSurah(Math.max(1, Math.min(TOTAL_SURAHS, n)));
  const changeQuranZoom = (amount) => {
    setQuranZoom((current) =>
      Math.min(
        MAX_QURAN_ZOOM,
        Math.max(MIN_QURAN_ZOOM, Number((current + amount).toFixed(1))),
      ),
    );
  };
  const quranZoomControls = (
    <div
      className="quran-zoom-controls"
      role="group"
      aria-label={t("quranTextSize")}
    >
      <button
        type="button"
        className="quran-zoom-controls__button"
        onClick={() => changeQuranZoom(-QURAN_ZOOM_STEP)}
        disabled={quranZoom <= MIN_QURAN_ZOOM}
        aria-label={t("quranZoomOut")}
        title={t("quranZoomOut")}
      >
        <AppIcon name="zoomOut" size={18} />
      </button>
      <output className="quran-zoom-controls__value" aria-live="polite">
        {Math.round(quranZoom * 100)}%
      </output>
      <button
        type="button"
        className="quran-zoom-controls__button"
        onClick={() => changeQuranZoom(QURAN_ZOOM_STEP)}
        disabled={quranZoom >= MAX_QURAN_ZOOM}
        aria-label={t("quranZoomIn")}
        title={t("quranZoomIn")}
      >
        <AppIcon name="zoomIn" size={18} />
      </button>
    </div>
  );

  const {
    activeAyahNumber,
    isPlaying,
    autoAdvance,
    reciterId,
    changeReciter,
    pause,
    resume,
    toggleAyah,
    playSurahFromStart,
    playAyahOnly,
    playAyahFromHere,
    currentTime,
    duration,
    surahElapsedTime,
    surahTotalTime,
    seekToSurahFraction,
  } = useQuranAudioPlayer(surah);

  const [ayahMenu, setAyahMenu] = useState(null); // { anchorEl, ayah } | null

  useEffect(() => {
    setAyahMenu(null);
  }, [currentSurah, loadAttempt]);

  const handleAyahClick = (event, ayah) => {
    if (activeAyahNumber === ayah.numberInSurah) {
      if (isPlaying) pause();
      else resume();
      return;
    }
    setAyahMenu({ anchorEl: event.currentTarget, ayah });
  };

  const closeAyahMenu = () => setAyahMenu(null);

  useEffect(() => {
    let cancelled = false;
    setSurah(null);
    setError(null);
    setVisibleCount(AYAH_BATCH_SIZE);
    localStorage.setItem(STORAGE_KEY, String(currentSurah));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    fetchSurah(currentSurah)
      .then((data) => {
        if (!cancelled) setSurah(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [currentSurah]);

  useEffect(() => {
    if (!surah) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) =>
            Math.min(c + AYAH_BATCH_SIZE, surah.ayahs.length),
          );
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [surah]);

  useEffect(() => {
    if (!surah || surah.number !== currentSurah || !initialAyah) return;

    const targetAyah = initialAyah;
    if (targetAyah > surah.ayahs.length) {
      deepLinkHandledRef.current = true;
      return;
    }

    if (deepLinkHandledRef.current) return;
    if (visibleCount < targetAyah) {
      setVisibleCount(targetAyah);
      return;
    }

    deepLinkHandledRef.current = true;
    const frame = requestAnimationFrame(() => {
      ayahRefs.current[targetAyah]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentSurah, initialAyah, surah, visibleCount]);

  useEffect(() => {
    if (activeAyahNumber && activeAyahNumber > visibleCount) {
      setVisibleCount((c) => Math.max(c, activeAyahNumber));
    }
  }, [activeAyahNumber, visibleCount]);

  const translationForAyah = (numberInSurah) =>
    quranTranslations[currentSurah]?.[numberInSurah];

  const visibleAyahs = surah ? surah.ayahs.slice(0, visibleCount) : [];
  const hasMore = surah ? visibleCount < surah.ayahs.length : false;

  const totalAyahs = surah ? surah.ayahs.length : 0;
  const firstRukuNumber = surah?.ayahs?.[0]?.ruku;
  const getAyahMarkers = (ayah) => {
    const nextAyah = surah?.ayahs?.[ayah.numberInSurah];
    const isRukuEnd =
      ayah.ruku != null && (!nextAyah || nextAyah.ruku !== ayah.ruku);
    const rukuNumber = ayah.ruku - firstRukuNumber + 1;
    return { isRukuEnd, rukuNumber, hasSajdah: Boolean(ayah.sajda) };
  };
  const surahProgress =
    activeAyahNumber && totalAyahs
      ? Math.min(
          1,
          (activeAyahNumber - 1 + (duration ? currentTime / duration : 0)) /
            totalAyahs,
        )
      : 0;

  useEffect(() => {
    ayahRefs.current[activeAyahNumber]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeAyahNumber, visibleCount]);

  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="quran-container">
      <div ref={topRef} className="quran-scroll-anchor" />

      {error && (
        <div className="quran-state quran-state--error" role="alert">
          <p>{t("quranLoadError")}</p>
          <button type="button" className="quran-back" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            {t("socialRetry")}
          </button>
        </div>
      )}
      {!surah && !error && (
        <Skeleton variant="card" count={3} label={t("quranLoading")} />
      )}
      {surah && (
        <section className="quran-body" style={{ "--quran-text-zoom": quranZoom }}>
          <Band as="header" glow className="quran-surah-header">
            <h1 className="quran-surah-header__ar" lang="ar" dir="rtl">{surah.name}</h1>
            <p className="quran-surah-header__en">
              {surah.englishName} · {surah.englishNameTranslation}
            </p>
            {!NO_SEPARATE_BISMILLAH.includes(currentSurah) && (
              <p className="quran-bismillah" lang="ar" dir="rtl">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </p>
            )}
          </Band>

          <div
            className="quran-view-toggle"
            role="tablist"
            aria-label={t("quranViewMode")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "verse"}
              className={`quran-view-toggle__btn ${viewMode === "verse" ? "quran-view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode("verse")}
            >
              {t("quranVerseByVerse")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "reading"}
              className={`quran-view-toggle__btn ${viewMode === "reading" ? "quran-view-toggle__btn--active" : ""}`}
              onClick={() => setViewMode("reading")}
            >
              {t("quranReadingMode")}
            </button>
          </div>

          <button
            type="button"
            className="quran-settings-trigger"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("quranReaderSettings")}
            aria-haspopup="dialog"
          >
            Aa
          </button>

          {viewMode === "reading" ? (
            <p className="quran-reading" lang="ar" dir="rtl">
              {visibleAyahs.map((ayah) => {
                const markers = getAyahMarkers(ayah);
                const isThisPlaying =
                  isPlaying && activeAyahNumber === ayah.numberInSurah;
                return (
                  <span
                    key={ayah.number}
                    role="button"
                    tabIndex={0}
                    className={`quran-reading__ayah ${isThisPlaying ? "quran-reading__ayah--playing" : ""}`}
                    onClick={(e) => handleAyahClick(e, ayah)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleAyahClick(e, ayah);
                      }
                    }}
                    ref={(el) => (ayahRefs.current[ayah.numberInSurah] = el)}
                  >
                    {ayah.text}
                    <span className="quran-reading__marker">
                      ﴿{toArabicNumber(ayah.numberInSurah)}﴾
                    </span>{" "}
                    {(markers.isRukuEnd || markers.hasSajdah) && (
                      <span className="quran-reading__markers" dir="ltr">
                        {markers.isRukuEnd && (
                          <span title={t("quranRukuEnd")}>
                            {t("quranRuku")} {markers.rukuNumber}
                          </span>
                        )}
                        {markers.hasSajdah && (
                          <span title={t("quranSajdah")}>۩ {t("quranSajdah")}</span>
                        )}
                      </span>
                    )}{" "}
                  </span>
                );
              })}
              {hasMore && (
                <span
                  ref={sentinelRef}
                  style={{ display: "inline-block", width: 1, height: 1 }}
                />
              )}
            </p>
          ) : (
            <div className="quran-ayahs">
              {visibleAyahs.map((ayah) => {
                const markers = getAyahMarkers(ayah);
                const translation = translationForAyah(ayah.numberInSurah);
                const isThisPlaying =
                  isPlaying && activeAyahNumber === ayah.numberInSurah;
                return (
                  <div
                    key={ayah.number}
                    ref={(el) => (ayahRefs.current[ayah.numberInSurah] = el)}
                    className={`quran-ayah ${isThisPlaying ? "quran-ayah--playing" : ""}`}
                  >
                    <div className="quran-ayah__row">
                      <span className="quran-ayah__num">
                        {ayah.numberInSurah}
                      </span>

                      <p
                        className="quran-ayah__text"
                        lang="ar"
                        dir="rtl"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleAyahClick(e, ayah)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleAyahClick(e, ayah);
                          }
                        }}
                      >
                        {ayah.text}
                      </p>

                      <button
                        className="quran-ayah__play"
                        onClick={() => {
                          if (activeAyahNumber === ayah.numberInSurah)
                            toggleAyah(ayah);
                          else playAyahOnly(ayah);
                        }}
                        aria-label={
                          isThisPlaying ? t("quranPause") : t("quranPlayAyah")
                        }
                      >
                        {isThisPlaying ? (
                          <PauseIcon
                            className="quran-ayah__icon"
                            title={t("quranPause")}
                          />
                        ) : (
                          <PlayIcon
                            className="quran-ayah__icon"
                            title={t("quranPlayAyah")}
                          />
                        )}
                      </button>
                    </div>

                    {(markers.isRukuEnd || markers.hasSajdah) && (
                      <div className="quran-ayah__markers" dir="ltr">
                        {markers.isRukuEnd && (
                          <span title={t("quranRukuEnd")}>
                            {t("quranRuku")} {markers.rukuNumber}
                          </span>
                        )}
                        {markers.hasSajdah && (
                          <span title={t("quranSajdah")}>۩ {t("quranSajdah")}</span>
                        )}
                      </div>
                    )}

                    {showTranslation && translation && (
                      <div className="quran-ayah__translation">
                        <p className="quran-ayah__ur" lang="ur" dir="rtl">{translation.ur}</p>
                        <p className="quran-ayah__translit">
                          {translation.urTransliteration}
                        </p>
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
            aria-label={t("quranPrevSurahLabel")}
          >
            <PrevIcon
              className="quran-nav__icon"
              title={t("quranPrevSurahLabel")}
            />
          </button>

          <button
            type="button"
            className="quran-nav__track"
            onClick={() => setPlayerOpen(true)}
            aria-haspopup="dialog"
            aria-label={t("quranSeek")}
          >
            <span className="quran-nav__track-name">{surah?.englishName ?? t("titleQuran")}</span>
            <span className="quran-nav__track-position">
              {t("quranAyahLabel")} {activeAyahNumber || 1} / {totalAyahs}
            </span>
          </button>
          <button
            type="button"
            className="quran-nav__play"
            onClick={() => {
              if (activeAyahNumber) {
                if (isPlaying) pause();
                else resume();
              } else if (autoAdvance && isPlaying) pause();
              else if (autoAdvance && !isPlaying) resume();
              else playSurahFromStart();
            }}
            disabled={!surah}
            aria-label={isPlaying ? t("quranPause") : t("quranPlaySurah")}
          >
            {isPlaying ? <PauseIcon className="quran-nav__icon" title={t("quranPause")} /> : <PlayIcon className="quran-nav__icon" title={t("quranPlaySurah")} />}
          </button>
          <button
            className="quran-nav__btn"
            onClick={() => goTo(currentSurah + 1)}
            disabled={currentSurah === TOTAL_SURAHS}
            aria-label={t("quranNextSurahLabel")}
          >
            <NextIcon
              className="quran-nav__icon"
              title={t("quranNextSurahLabel")}
            />
          </button>
          <button
            type="button"
            className="quran-nav__expand"
            onClick={() => setPlayerOpen(true)}
            aria-label={t("quranSeek")}
            aria-haspopup="dialog"
          >
            <AppIcon name="more" size={20} />
          </button>
        </div>
      </nav>

      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        labelledBy="quran-settings-title"
        className="quran-settings-sheet"
      >
        <h2 id="quran-settings-title">{t("quranReaderSettings")}</h2>
        <label className="quran-sheet__label" htmlFor="reciter-select">{t("quranReciter")}</label>
        <select
          id="reciter-select"
          className="quran-reciter__select"
          value={reciterId}
          onChange={(e) => changeReciter(e.target.value)}
          aria-label={t("quranReciter")}
        >
          {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <div className="quran-sheet__row">
          <span>{t("quranTextSize")}</span>
          {quranZoomControls}
        </div>
        <button
          type="button"
          className="quran-sheet__toggle"
          onClick={() => setShowTranslation((value) => !value)}
          aria-pressed={showTranslation}
        >
          {showTranslation ? t("quranHideTranslation") : t("quranShowTranslation")}
        </button>
      </Sheet>

      <Sheet
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        labelledBy="quran-player-title"
        className="quran-player-sheet"
      >
        <h2 id="quran-player-title">{surah?.englishName}</h2>
        <div className="quran-player__meta">
          <span>{t("quranAyahLabel")} {activeAyahNumber || 1} / {totalAyahs}</span>
          <span>{RECITERS.find((r) => r.id === reciterId)?.name}</span>
        </div>
        <input
          type="range"
          className="quran-player__range"
          style={{ "--progress": `${surahProgress * 100}%` }}
          min={0}
          max={1}
          step={0.001}
          value={surahProgress}
          onChange={(e) => seekToSurahFraction(Number(e.target.value))}
          aria-label={t("quranSeek")}
        />
        <div className="quran-player__time">
          <span>{formatTime(surahElapsedTime)}</span>
          <span>{formatTime(surahTotalTime)}</span>
        </div>
        <label className="quran-sheet__label" htmlFor="player-reciter-select">{t("quranReciter")}</label>
        <select
          id="player-reciter-select"
          className="quran-reciter__select"
          value={reciterId}
          onChange={(e) => changeReciter(e.target.value)}
        >
          {RECITERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </Sheet>

      <Popover
        open={!!ayahMenu}
        anchorEl={ayahMenu?.anchorEl}
        onClose={closeAyahMenu}
        label={t("quranAyahActions")}
      >
        <button
          type="button"
          role="menuitem"
          className="ui-popover__item"
          onClick={() => {
            playAyahOnly(ayahMenu.ayah);
            closeAyahMenu();
          }}
        >
          {t("quranPlayThisAyah")}
        </button>
        <button
          type="button"
          role="menuitem"
          className="ui-popover__item"
          onClick={() => {
            playAyahFromHere(ayahMenu.ayah);
            closeAyahMenu();
          }}
        >
          {t("quranPlayFromHere")}
        </button>
      </Popover>

      {showBackToTop && (
        <button
          className="quran-back-to-top"
          onClick={() =>
            topRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          aria-label={t("quranBackToTop")}
        >
          <TopArrowIcon className="quran-back-to-top__icon" />
        </button>
      )}
    </div>
  );
}
