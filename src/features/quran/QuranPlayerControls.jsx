import { PlayIcon, PauseIcon, TopArrowIcon } from "../../components/icons/MediaIcons.jsx";
import AppIcon from "../../components/icons/AppIcon";
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
import { Sheet, SheetContent, SheetTitle } from "../../components/shadcn/sheet";
import { RECITERS } from "./quranApi";

const TOTAL_SURAHS = 114;

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function SurahSkipIcon({ direction }) {
  const rotation = direction === "backward" ? "rotate(180 12 12)" : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={rotation}>
        <path d="M2 3v18l9-9L2 3Zm9 0v18l9-9-9-9Zm10 0h2v18h-2V3Z" />
      </g>
    </svg>
  );
}

export function ReciterSelect({ value, onChange, t }) {
  return (
    <>
      <label htmlFor="player-reciter-select" className="text-sm font-medium">
        {t("quranReciter")}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="player-reciter-select" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RECITERS.map((reciter) => (
            <SelectItem key={reciter.id} value={reciter.id}>{reciter.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export default function QuranPlayerControls({
  t,
  surah,
  currentSurah,
  totalAyahs,
  activeAyahNumber,
  isPlaying,
  autoAdvance,
  reciterId,
  changeReciter,
  pause,
  resume,
  playSurahFromStart,
  nextAyah,
  prevAyah,
  playAyahOnly,
  playAyahFromHere,
  seekToSurahFraction,
  surahElapsedTime,
  surahTotalTime,
  surahProgress,
  goTo,
  playerOpen,
  setPlayerOpen,
  seekFraction,
  setSeekFraction,
  seekingRef,
  ayahMenu,
  closeAyahMenu,
  topRef,
  showBackToTop,
}) {
  return (
    <>
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
          onClick={() => goTo(currentSurah - 1)}
          disabled={!surah || currentSurah <= 1}
          aria-label={t("quranPrevSurahLabel")}
        >
          <SurahSkipIcon direction="backward" />
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => goTo(currentSurah + 1)}
          disabled={!surah || currentSurah >= TOTAL_SURAHS}
          aria-label={t("quranNextSurahLabel")}
        >
          <SurahSkipIcon direction="forward" />
        </Button>
        <Progress value={surahProgress * 100} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 rounded-none bg-transparent" />
      </nav>

      <Sheet open={playerOpen} onOpenChange={setPlayerOpen}>
        <SheetContent side="bottom" closeLabel={t("closeSheet")} className="mx-auto w-full max-w-xl gap-5 rounded-t-[var(--radius-md)] border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          <SheetTitle>{surah?.englishName ?? t("titleQuran")}</SheetTitle>
          <div className="flex justify-between gap-3 text-sm text-muted-foreground">
            <span>{t("quranAyahLabel")} {activeAyahNumber || 1} / {totalAyahs}</span>
            <span>{RECITERS.find((reciter) => reciter.id === reciterId)?.name}</span>
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
          <ReciterSelect value={reciterId} onChange={changeReciter} t={t} />
        </SheetContent>
      </Sheet>

      <Sheet open={!!ayahMenu} onOpenChange={(open) => { if (!open) closeAyahMenu(); }}>
        <SheetContent side="bottom" closeLabel={t("closeSheet")} className="mx-auto w-full max-w-xl gap-2 rounded-t-[var(--radius-md)] border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
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
          onClick={() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          aria-label={t("quranBackToTop")}
        >
          <TopArrowIcon />
        </Button>
      )}
    </>
  );
}
