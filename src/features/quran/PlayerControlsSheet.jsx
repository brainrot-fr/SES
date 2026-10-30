import BottomSheet from "@/components/BottomSheet";
import DirectionalIcon from "@/components/icons/DirectionalIcon";
import { Button } from "@/components/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/select";
import { Slider } from "@/components/shadcn/slider";
import { RECITERS } from "@/features/quran/quranData";

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function PlayerControlsSheet({
  open,
  onOpenChange,
  surah,
  currentSurah,
  totalSurahs,
  activeAyahNumber,
  totalAyahs,
  reciterId,
  onReciterChange,
  seekFraction,
  onSeekFractionChange,
  seekingRef,
  seekToSurahFraction,
  elapsedTime,
  totalTime,
  onNavigate,
  t,
}) {
  const title = surah?.englishName ?? t("titleQuran");
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={t("quranPlayerDescription")}
      closeLabel={t("closeSheet")}
      className="mx-auto w-full max-w-xl gap-5 border-border bg-card p-5"
    >
      <h2 className="font-semibold text-foreground">{title}</h2>
      <div className="flex justify-between gap-3 text-sm text-muted-foreground">
        <span>{t("quranAyahLabel")} {activeAyahNumber || 1} / {totalAyahs}</span>
        <span>{RECITERS.find((reciter) => reciter.id === reciterId)?.name}</span>
      </div>
      <Slider
        className="quran-player__slider"
        min={0}
        max={1}
        step={0.001}
        value={[seekFraction]}
        onValueChange={([value]) => {
          seekingRef.current = true;
          onSeekFractionChange(value);
        }}
        onValueCommit={([value]) => {
          seekingRef.current = false;
          onSeekFractionChange(value);
          seekToSurahFraction(value);
        }}
        aria-label={t("quranSeek")}
      />
      <div className="flex justify-between gap-3 text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(elapsedTime)}</span>
        <span>{formatTime(totalTime)}</span>
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={currentSurah <= 1}
          onClick={() => {
            onNavigate(currentSurah - 1);
            onOpenChange(false);
          }}
        >
          <DirectionalIcon name="skipBack" />
          {t("quranPrevSurahLabel")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={currentSurah >= totalSurahs}
          onClick={() => {
            onNavigate(currentSurah + 1);
            onOpenChange(false);
          }}
        >
          {t("quranNextSurahLabel")}
          <DirectionalIcon name="skipForward" />
        </Button>
      </div>
      <label htmlFor="player-reciter-select" className="text-sm font-medium">{t("quranReciter")}</label>
      <Select value={reciterId} onValueChange={onReciterChange}>
        <SelectTrigger id="player-reciter-select" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          {RECITERS.map((reciter) => (
            <SelectItem key={reciter.id} value={reciter.id}>{reciter.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </BottomSheet>
  );
}
