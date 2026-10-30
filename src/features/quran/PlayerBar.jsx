import AppIcon from "@/components/icons/AppIcon";
import DirectionalIcon from "@/components/icons/DirectionalIcon";
import { Button } from "@/components/shadcn/button";
import { Progress } from "@/components/shadcn/progress";

export default function PlayerBar({
  surah,
  activeAyahNumber,
  totalAyahs,
  isPlaying,
  disabled,
  onOpenPlayer,
  onPrevious,
  onNext,
  onTogglePlayback,
  progress,
  t,
}) {
  return (
    <nav className="quran-nav fixed inset-x-0 bottom-[var(--dock-offset)] z-[90] mx-auto flex w-[min(38rem,calc(100vw-24px))] items-center gap-1 rounded-[var(--radius-md)] border border-border bg-card/95 p-2 shadow-lg supports-[backdrop-filter]:bg-card/75 supports-[backdrop-filter]:backdrop-blur-md">
      <Button
        type="button"
        variant="ghost"
        className="h-11 min-w-0 flex-1 flex-col items-start justify-center gap-0 px-2 text-start"
        onClick={onOpenPlayer}
        aria-haspopup="dialog"
        aria-label={t("quranPlaybackPosition")
          .replace("{surahName}", surah?.englishName ?? t("titleQuran"))
          .replace("{current}", String(activeAyahNumber || 1))
          .replace("{total}", String(totalAyahs))}
      >
        <span className="max-w-full truncate text-sm font-semibold text-foreground">{surah?.englishName ?? t("titleQuran")}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{t("quranAyahLabel")} {activeAyahNumber || 1} / {totalAyahs}</span>
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={onPrevious} disabled={disabled || !activeAyahNumber || activeAyahNumber <= 1} aria-label={t("quranPrevAyah")}>
        <DirectionalIcon name="skipBack" />
      </Button>
      <Button type="button" size="icon" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={onTogglePlayback} disabled={disabled} aria-label={isPlaying ? t("quranPause") : t("quranPlaySurah")}>
        <AppIcon name={isPlaying ? "pause" : "play"} />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={onNext} disabled={disabled || !activeAyahNumber || activeAyahNumber >= totalAyahs} aria-label={t("quranNextAyah")}>
        <DirectionalIcon name="skipForward" />
      </Button>
      <Progress value={progress * 100} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 rounded-none bg-transparent" />
    </nav>
  );
}
