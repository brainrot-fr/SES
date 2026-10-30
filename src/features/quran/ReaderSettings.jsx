import BottomSheet from "@/components/BottomSheet";
import { Button } from "@/components/shadcn/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";

export default function ReaderSettings({
  open,
  onOpenChange,
  viewMode,
  onViewModeChange,
  showTranslation,
  onShowTranslationChange,
  hasTranslations,
  fontScale,
  onFontScaleChange,
  minFontScale,
  maxFontScale,
  t,
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("quranReaderSettings")}
      description={t("quranReaderSettingsDescription")}
      closeLabel={t("closeSheet")}
      className="mx-auto w-full max-w-xl gap-5 border-border bg-card p-5"
    >
      <h2 className="font-semibold text-foreground">{t("quranReaderSettings")}</h2>
      <Tabs value={viewMode} onValueChange={onViewModeChange} aria-label={t("quranViewMode")}>
        <TabsList>
          <TabsTrigger value="verse">{t("quranVerseByVerse")}</TabsTrigger>
          <TabsTrigger value="reading">{t("quranReadingMode")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="quran-reading-controls__font-size" role="group" aria-label={t("quranTextSize")}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("quranDecreaseTextSize")}
          disabled={fontScale <= minFontScale}
          onClick={() => onFontScaleChange((scale) => Math.max(minFontScale, Math.round((scale - 0.1) * 10) / 10))}
        >
          <span aria-hidden="true" className="text-xs font-semibold">A−</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("quranIncreaseTextSize")}
          disabled={fontScale >= maxFontScale}
          onClick={() => onFontScaleChange((scale) => Math.min(maxFontScale, Math.round((scale + 0.1) * 10) / 10))}
        >
          <span aria-hidden="true" className="text-base font-semibold">A+</span>
        </Button>
      </div>
      {hasTranslations && viewMode === "verse" && (
        <ToggleGroup
          type="single"
          value={showTranslation ? "shown" : "hidden"}
          onValueChange={(value) => {
            if (value) onShowTranslationChange(value === "shown");
          }}
          aria-label={t("quranTranslation")}
          className="gap-1"
        >
          <ToggleGroupItem value="shown" variant="outline" className="min-h-11 px-3">
            {t("quranShowTranslation")}
          </ToggleGroupItem>
          <ToggleGroupItem value="hidden" variant="outline" className="min-h-11 px-3">
            {t("quranHideTranslation")}
          </ToggleGroupItem>
        </ToggleGroup>
      )}
    </BottomSheet>
  );
}
