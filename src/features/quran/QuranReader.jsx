import { useState, useEffect, useRef } from "react";
import { fetchSurah, QURAN_SURAH_LIST, RECITERS } from "./quranApi";
import { quranTranslations } from "./quranTranslations";
import { useLang } from "../../context/LanguageContext";
import {
  PlayIcon,
  PauseIcon,
  TopArrowIcon,
} from "../../components/icons/MediaIcons.jsx";
import AppIcon from "../../components/icons/AppIcon";
import { Skeleton } from "../../components/shadcn/skeleton";
import { Button } from "../../components/shadcn/button";
import { Progress } from "../../components/shadcn/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/shadcn/select";
import { Slider } from "../../components/shadcn/slider";
import { Switch } from "../../components/shadcn/switch";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "../../components/shadcn/sheet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../components/shadcn/tabs";
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

function AyahEndMark({ number, small = false }) {
  const digits = toArabicNumber(number);
  return (
    <span
      className={`ayah-mark${small ? " ayah-mark--small" : ""}`}
      data-len={digits.length}
      dir="rtl"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
          <rect x="6" y="6" width="20" height="20" rx="2.5" />
          <rect x="6" y="6" width="20" height="20" rx="2.5" transform="rotate(45 16 16)" />
          <circle cx="16" cy="16" r="7.2" />
        </g>
      </svg>
      <span className="ayah-mark__num">{digits}</span>
    </span>
  );
}

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
  const [seekFraction, setSeekFraction] = useState(0);

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
  const seekingRef = useRef(false);

  const goTo = (n) => setCurrentSurah(Math.max(1, Math.min(TOTAL_SURAHS, n)));
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
    nextAyah,
    prevAyah,
    playAyahOnly,
    playAyahFromHere,
    currentTime,
    duration,
    surahElapsedTime,
    surahTotalTime,
    seekToSurahFraction,
  } = useQuranAudioPlayer(surah);

  const [ayahMenu, setAyahMenu] = useState(null);

  useEffect(() => {
    setAyahMenu(null);
  }, [currentSurah, loadAttempt]);

  const handleAyahClick = (ayah) => {
    if (activeAyahNumber === ayah.numberInSurah) {
      if (isPlaying) pause();
      else resume();
      return;
    }
    setAyahMenu({ ayah });
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

  const translationForAyah = (numberInSurah) =>
    quranTranslations[currentSurah]?.[numberInSurah];

  const totalAyahs = surah ? surah.ayahs.length : 0;
  const renderedCount = Math.min(
    totalAyahs,
    Math.max(visibleCount, activeAyahNumber || 0),
  );
  const visibleAyahs = surah ? surah.ayahs.slice(0, renderedCount) : [];
  const hasMore = surah ? renderedCount < surah.ayahs.length : false;

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
  const nextSurah = QURAN_SURAH_LIST[currentSurah];

  useEffect(() => {
    if (!seekingRef.current) setSeekFraction(surahProgress);
  }, [surahProgress, playerOpen]);

  useEffect(() => {
    if (!activeAyahNumber) return;
    ayahRefs.current[activeAyahNumber]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeAyahNumber]);

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
        <div className="grid gap-4" role="status" aria-label={t("quranLoading")}>
          <Skeleton className="h-24 w-full rounded-sm" />
          <Skeleton className="h-24 w-full rounded-sm" />
          <Skeleton className="h-24 w-full rounded-sm" />
        </div>
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

          <div className="flex items-center justify-between gap-2 bg-background py-2">
            <Tabs value={viewMode} onValueChange={setViewMode} aria-label={t("quranViewMode")}>
              <TabsList>
                <TabsTrigger value="verse">{t("quranVerseByVerse")}</TabsTrigger>
                <TabsTrigger value="reading">{t("quranReadingMode")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
              aria-controls="quran-display-controls"
            >
              <AppIcon name="display" />
              {t("quranDisplay")}
            </Button>
          </div>

          {settingsOpen && (
            <section
              id="quran-display-controls"
              aria-label={t("quranReaderSettings")}
              className="grid gap-4 py-3"
            >
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="quran-text-size" className="text-sm font-medium">{t("quranTextSize")}</label>
                  <output className="text-sm tabular-nums text-muted-foreground">{Math.round(quranZoom * 100)}%</output>
                </div>
                <Slider
                  id="quran-text-size"
                  min={MIN_QURAN_ZOOM}
                  max={MAX_QURAN_ZOOM}
                  step={QURAN_ZOOM_STEP}
                  value={[quranZoom]}
                  onValueChange={([value]) => setQuranZoom(Number(value.toFixed(1)))}
                  aria-label={t("quranTextSize")}
                />
                <p
                  lang="ar"
                  dir="rtl"
                  className="m-0 text-center font-[var(--font-arabic)] text-[calc(1.5rem*var(--quran-text-zoom))] leading-[2.1] text-foreground"
                  style={{ "--quran-text-zoom": quranZoom }}
                >
                  {surah.ayahs[0].text}
                </p>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border pt-3">
                <span id="quran-translation-label">
                  {t(showTranslation ? "quranHideTranslation" : "quranShowTranslation")}
                </span>
                <Switch
                  checked={showTranslation}
                  onCheckedChange={setShowTranslation}
                  aria-labelledby="quran-translation-label"
                />
              </div>
            </section>
          )}

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
                    onClick={() => handleAyahClick(ayah)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleAyahClick(ayah);
                      }
                    }}
                    ref={(el) => (ayahRefs.current[ayah.numberInSurah] = el)}
                  >
                    {ayah.text}
                    <AyahEndMark number={ayah.numberInSurah} />
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
                        onClick={() => handleAyahClick(ayah)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleAyahClick(ayah);
                          }
                        }}
                      >
                        {ayah.text}
                        <AyahEndMark number={ayah.numberInSurah} small />
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
          {!hasMore && nextSurah && (
            <Button
              type="button"
              variant="outline"
              className="mt-6 w-full"
              onClick={() => goTo(currentSurah + 1)}
            >
              {t("quranNextSurahNamed").replace("{name}", nextSurah.englishName)}
            </Button>
          )}
        </section>
      )}

      <nav className="quran-nav fixed inset-x-0 bottom-[var(--dock-offset)] z-[90] mx-auto flex w-[min(38rem,calc(100vw-24px))] items-center gap-1 rounded-[var(--radius-md)] border border-border bg-card/95 p-2 shadow-lg supports-[backdrop-filter]:bg-card/75 supports-[backdrop-filter]:backdrop-blur-md">
          <Button
            type="button"
            variant="ghost"
            className="h-11 min-w-0 flex-1 flex-col items-start justify-center gap-0 px-2 text-start"
            onClick={() => setPlayerOpen(true)}
            aria-haspopup="dialog"
            aria-label={t("quranSeek")}
          >
            <span className="max-w-full truncate text-sm font-semibold text-foreground">{surah?.englishName ?? t("titleQuran")}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("quranAyahLabel")} {activeAyahNumber || 1} / {totalAyahs}
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={prevAyah}
            disabled={!surah || !activeAyahNumber || activeAyahNumber <= 1}
            aria-label={t("quranPrevAyah")}
          >
            <AppIcon name="skipBack" className="rtl:rotate-180" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
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
            {isPlaying ? <PauseIcon title={t("quranPause")} /> : <PlayIcon title={t("quranPlaySurah")} />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={nextAyah}
            disabled={!surah || !activeAyahNumber || activeAyahNumber >= totalAyahs}
            aria-label={t("quranNextAyah")}
          >
            <AppIcon name="skipForward" className="rtl:rotate-180" />
          </Button>
          <Progress value={surahProgress * 100} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 rounded-none bg-transparent" />
      </nav>

      <Sheet open={playerOpen} onOpenChange={setPlayerOpen}>
        <SheetContent side="bottom" closeLabel={t("closeSheet")} className="gap-5 rounded-t-[var(--radius-md)] border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <SheetTitle>{surah?.englishName ?? t("titleQuran")}</SheetTitle>
          <div className="flex justify-between gap-3 text-sm text-muted-foreground">
            <span>{t("quranAyahLabel")} {activeAyahNumber || 1} / {totalAyahs}</span>
            <span>{RECITERS.find((r) => r.id === reciterId)?.name}</span>
          </div>
          <Slider
            min={0}
            max={1}
            step={0.001}
            value={[seekFraction]}
            onValueChange={([value]) => {
              seekingRef.current = true;
              setSeekFraction(value);
            }}
            onValueCommit={([value]) => {
              seekingRef.current = false;
              setSeekFraction(value);
              seekToSurahFraction(value);
            }}
            aria-label={t("quranSeek")}
          />
          <div className="flex justify-between gap-3 text-xs tabular-nums text-muted-foreground">
            <span>{formatTime(surahElapsedTime)}</span>
            <span>{formatTime(surahTotalTime)}</span>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={currentSurah <= 1}
              onClick={() => {
                goTo(currentSurah - 1);
                setPlayerOpen(false);
              }}
            >
              <AppIcon name="chevronLeft" className="rtl:rotate-180" />
              {t("quranPrevSurahLabel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={currentSurah >= TOTAL_SURAHS}
              onClick={() => {
                goTo(currentSurah + 1);
                setPlayerOpen(false);
              }}
            >
              {t("quranNextSurahLabel")}
              <AppIcon name="chevronRight" className="rtl:rotate-180" />
            </Button>
          </div>
          <label htmlFor="player-reciter-select" className="text-sm font-medium">{t("quranReciter")}</label>
          <Select value={reciterId} onValueChange={changeReciter}>
            <SelectTrigger id="player-reciter-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECITERS.map((reciter) => (
                <SelectItem key={reciter.id} value={reciter.id}>{reciter.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SheetContent>
      </Sheet>

      <Sheet open={!!ayahMenu} onOpenChange={(open) => { if (!open) closeAyahMenu(); }}>
        <SheetContent side="bottom" closeLabel={t("closeSheet")} className="gap-2 rounded-t-[var(--radius-md)] border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetTitle>{t("quranAyahActions")}</SheetTitle>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              playAyahOnly(ayahMenu.ayah);
              closeAyahMenu();
            }}
          >
            {t("quranPlayThisAyah")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              playAyahFromHere(ayahMenu.ayah);
              closeAyahMenu();
            }}
          >
            {t("quranPlayFromHere")}
          </Button>
        </SheetContent>
      </Sheet>

      {showBackToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="quran-back-to-top fixed end-4 z-40"
          onClick={() =>
            topRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          aria-label={t("quranBackToTop")}
        >
          <TopArrowIcon />
        </Button>
      )}
    </div>
  );
}
