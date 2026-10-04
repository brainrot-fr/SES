import { useState, useEffect, useRef } from "react";
import { useLang } from "../../context/LanguageContext";
import { Button } from "../../components/shadcn/button";
import { Alert, AlertDescription } from "../../components/shadcn/alert";
import { useQuranAudioPlayer } from "./useQuranAudioPlayer";
import { useQuranReaderState } from "./useQuranReaderState";
import QuranPlayerControls from "./QuranPlayerControls";
import {
  ReaderLoadState,
  ReaderAyahList,
  ReaderToolbar,
} from "./QuranReaderComponents";
import "./quran.css";

export default function QuranReader({ initialSurah, initialAyah }) {
  const { t } = useLang();
  const {
    currentSurah,
    surah,
    showingCachedSurah,
    error,
    loadAttempt,
    showBackToTop,
    viewMode,
    setViewMode,
    showTranslation,
    setShowTranslation,
    fontScale,
    setFontScale,
    topRef,
    sentinelRef,
    ayahRefs,
    totalAyahs,
    getVisibleAyahs,
    nextSurah,
    goTo,
    retry,
    getAyahMarkers,
    translationForAyah,
    minFontScale,
    maxFontScale,
  } = useQuranReaderState(initialSurah, initialAyah);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [seekFraction, setSeekFraction] = useState(0);
  const seekingRef = useRef(false);
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

  const visibleAyahs = getVisibleAyahs(activeAyahNumber);
  const hasMore = visibleAyahs.length < totalAyahs;
  const surahProgress =
    activeAyahNumber && totalAyahs
      ? Math.min(
          1,
          (activeAyahNumber - 1 + (duration ? currentTime / duration : 0)) /
            totalAyahs,
        )
      : 0;
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

  return (
    <div className="quran-container">
      <div ref={topRef} className="quran-scroll-anchor" />

      <ReaderLoadState error={error} loading={!surah} onRetry={retry} t={t} />
      {showingCachedSurah && <Alert className="mb-3" aria-live="polite"><AlertDescription>{t("quranOfflineCached")}</AlertDescription></Alert>}
      {surah && (
        <section className="quran-body" style={{ "--quran-font-scale": fontScale }}>
          <ReaderToolbar
            surah={surah}
            currentSurah={currentSurah}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            fontScale={fontScale}
            onFontScaleChange={setFontScale}
            minFontScale={minFontScale}
            maxFontScale={maxFontScale}
            showTranslation={showTranslation}
            onTranslationChange={setShowTranslation}
            t={t}
          />

          <ReaderAyahList
            ayahs={visibleAyahs}
            viewMode={viewMode}
            showTranslation={showTranslation}
            activeAyahNumber={activeAyahNumber}
            isPlaying={isPlaying}
            onAyahClick={handleAyahClick}
            onPlayAyah={(ayah) => {
              if (activeAyahNumber === ayah.numberInSurah) toggleAyah(ayah);
              else playAyahOnly(ayah);
            }}
            setAyahRef={(number, element) => {
              ayahRefs.current[number] = element;
            }}
            getAyahMarkers={getAyahMarkers}
            translationForAyah={translationForAyah}
            sentinelRef={sentinelRef}
            hasMore={hasMore}
            t={t}
          />
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

      <QuranPlayerControls
        t={t}
        surah={surah}
        currentSurah={currentSurah}
        totalAyahs={totalAyahs}
        activeAyahNumber={activeAyahNumber}
        isPlaying={isPlaying}
        autoAdvance={autoAdvance}
        reciterId={reciterId}
        changeReciter={changeReciter}
        pause={pause}
        resume={resume}
        playSurahFromStart={playSurahFromStart}
        nextAyah={nextAyah}
        prevAyah={prevAyah}
        playAyahOnly={playAyahOnly}
        playAyahFromHere={playAyahFromHere}
        seekToSurahFraction={seekToSurahFraction}
        surahElapsedTime={surahElapsedTime}
        surahTotalTime={surahTotalTime}
        surahProgress={surahProgress}
        goTo={goTo}
        playerOpen={playerOpen}
        setPlayerOpen={setPlayerOpen}
        seekFraction={seekFraction}
        setSeekFraction={setSeekFraction}
        seekingRef={seekingRef}
        ayahMenu={ayahMenu}
        closeAyahMenu={closeAyahMenu}
        topRef={topRef}
        showBackToTop={showBackToTop}
      />
    </div>
  );
}
