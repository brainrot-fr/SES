import { useState, useEffect, useRef } from "react";
import { fetchSurah, QURAN_SURAH_LIST } from "@/features/quran/quranData";
import { quranTranslations } from "@/features/quran/quranTranslations";
import { useLang } from "@/context/LanguageContext";
import AppIcon from "@/components/icons/AppIcon";
import BottomSheet from "@/components/BottomSheet";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/shadcn/empty";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Button } from "@/components/shadcn/button";
import { useQuranAudioPlayer } from "@/features/quran/useQuranAudioPlayer";
import AyahList from "@/features/quran/AyahList";
import PlayerBar from "@/features/quran/PlayerBar";
import PlayerControlsSheet from "@/features/quran/PlayerControlsSheet";
import QuranHeader from "@/features/quran/QuranHeader";
import ReaderSettings from "@/features/quran/ReaderSettings";
import ReadingView from "@/features/quran/ReadingView";
import "@/features/quran/quran.css";

const TOTAL_SURAHS = 114;
const NO_SEPARATE_BISMILLAH = [1, 9];
const STORAGE_KEY = "ses-current-surah";
const CURRENT_AYAH_KEY = "ses-current-ayah";
const VIEW_MODE_KEY = "ses-quran-view-mode";
const TRANSLATION_KEY = "ses-show-translation";
const FONT_SCALE_KEY = "ses-quran-font-scale";
const AYAH_BATCH_SIZE = 40;
const MIN_FONT_SCALE = 0.8;
const MAX_FONT_SCALE = 1.6;

export default function QuranReader({ initialSurah, initialAyah, onNavigate }) {
  const { t } = useLang();

  const currentSurah = initialSurah;
  const savedSurah = Number(localStorage.getItem(STORAGE_KEY));
  const savedAyah = Number(localStorage.getItem(CURRENT_AYAH_KEY));
  const restoreAyah = initialAyah ?? (savedSurah === currentSurah ? savedAyah : null);
  const [surah, setSurah] = useState(null);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(AYAH_BATCH_SIZE);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seekFraction, setSeekFraction] = useState(0);

  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(VIEW_MODE_KEY) || "verse",
  );
  const [showTranslation, setShowTranslation] = useState(
    () => localStorage.getItem(TRANSLATION_KEY) !== "false",
  );
  const [fontScale, setFontScale] = useState(() => {
    const storedScale = Number.parseFloat(localStorage.getItem(FONT_SCALE_KEY));
    return Number.isFinite(storedScale)
      ? Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, storedScale))
      : 1;
  });

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);
  useEffect(() => {
    localStorage.setItem(TRANSLATION_KEY, String(showTranslation));
  }, [showTranslation]);
  useEffect(() => {
    localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
  }, [fontScale]);
  const topRef = useRef(null);
  const sentinelRef = useRef(null);
  const ayahRefs = useRef({});
  const deepLinkHandledRef = useRef(false);
  const seekingRef = useRef(false);

  const goTo = (n) => onNavigate(Math.max(1, Math.min(TOTAL_SURAHS, n)));
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
    if (!surah || surah.number !== currentSurah || !restoreAyah) return;

    const targetAyah = restoreAyah;
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
  }, [currentSurah, restoreAyah, surah, visibleCount]);

  const translationForAyah = (numberInSurah) =>
    quranTranslations[currentSurah]?.[numberInSurah];
  const hasTranslations = Object.keys(quranTranslations[currentSurah] || {}).length > 0;

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
  const surahProgress = surahTotalTime > 0
    ? Math.min(1, surahElapsedTime / surahTotalTime)
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

  useEffect(() => {
    if (!surah || typeof IntersectionObserver === "undefined") return undefined;
    let saveTimer;
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!mostVisible) return;
      const ayahNumber = Number(mostVisible.target.dataset.ayahNumber);
      if (!Number.isInteger(ayahNumber) || ayahNumber < 1) return;
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        localStorage.setItem(CURRENT_AYAH_KEY, String(ayahNumber));
      }, 250);
    }, { threshold: [0.25, 0.5, 0.75] });

    Object.entries(ayahRefs.current).forEach(([number, element]) => {
      if (!element || Number(number) > renderedCount) return;
      element.dataset.ayahNumber = number;
      observer.observe(element);
    });

    return () => {
      window.clearTimeout(saveTimer);
      observer.disconnect();
    };
  }, [surah, renderedCount, viewMode]);

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
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t("quranLoadError")}</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" variant="secondary" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                {t("socialRetry")}
              </Button>
            </EmptyContent>
          </Empty>
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
        <section className="quran-body" style={{ "--quran-font-scale": fontScale }}>
          <QuranHeader
            surah={surah}
            showBismillah={!NO_SEPARATE_BISMILLAH.includes(currentSurah)}
            onOpenSettings={() => setSettingsOpen(true)}
            settingsLabel={t("quranReaderSettings")}
          />
          <ReaderSettings
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showTranslation={showTranslation}
            onShowTranslationChange={setShowTranslation}
            hasTranslations={hasTranslations}
            fontScale={fontScale}
            onFontScaleChange={setFontScale}
            minFontScale={MIN_FONT_SCALE}
            maxFontScale={MAX_FONT_SCALE}
            t={t}
          />

          {viewMode === "reading" ? (
            <ReadingView
              ayahs={visibleAyahs}
              getMarkers={getAyahMarkers}
              isPlaying={isPlaying}
              activeAyahNumber={activeAyahNumber}
              ayahRefs={ayahRefs}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              onAyahClick={handleAyahClick}
              t={t}
            />
          ) : (
            <AyahList
              ayahs={visibleAyahs}
              ayahRefs={ayahRefs}
              getMarkers={getAyahMarkers}
              translationForAyah={translationForAyah}
              showTranslation={showTranslation}
              isPlaying={isPlaying}
              activeAyahNumber={activeAyahNumber}
              onAyahClick={handleAyahClick}
              toggleAyah={toggleAyah}
              playAyahOnly={playAyahOnly}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              t={t}
            />
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

      <PlayerBar
        surah={surah}
        activeAyahNumber={activeAyahNumber}
        totalAyahs={totalAyahs}
        isPlaying={isPlaying}
        disabled={!surah}
        onOpenPlayer={() => setPlayerOpen(true)}
        onPrevious={prevAyah}
        onNext={nextAyah}
        onTogglePlayback={() => {
          if (activeAyahNumber) {
            if (isPlaying) pause();
            else resume();
          } else if (autoAdvance && isPlaying) pause();
          else if (autoAdvance && !isPlaying) resume();
          else playSurahFromStart();
        }}
        progress={surahProgress}
        t={t}
      />
      <PlayerControlsSheet
        open={playerOpen}
        onOpenChange={setPlayerOpen}
        surah={surah}
        currentSurah={currentSurah}
        totalSurahs={TOTAL_SURAHS}
        activeAyahNumber={activeAyahNumber}
        totalAyahs={totalAyahs}
        reciterId={reciterId}
        onReciterChange={changeReciter}
        seekFraction={seekFraction}
        onSeekFractionChange={setSeekFraction}
        seekingRef={seekingRef}
        seekToSurahFraction={seekToSurahFraction}
        elapsedTime={surahElapsedTime}
        totalTime={surahTotalTime}
        onNavigate={goTo}
        t={t}
      />

      <BottomSheet
        open={!!ayahMenu}
        onOpenChange={(open) => { if (!open) closeAyahMenu(); }}
        title={t("quranAyahActions")}
        description={t("quranAyahActionsDescription")}
        closeLabel={t("closeSheet")}
        className="mx-auto w-full max-w-xl gap-2 border-border bg-card p-4"
      >
          <h2 className="font-semibold text-foreground">{t("quranAyahActions")}</h2>
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
      </BottomSheet>

      {showBackToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed end-4 bottom-[calc(var(--dock-offset)+5rem)] z-40"
          onClick={() =>
            topRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          aria-label={t("quranBackToTop")}
        >
          <AppIcon name="arrowUp" />
        </Button>
      )}
    </div>
  );
}
