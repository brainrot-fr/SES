// Template: Reader — ayah presentation, toolbar, and loading states.
import { PlayIcon, PauseIcon } from "../../components/icons/MediaIcons.jsx";
import { Button } from "../../components/shadcn/button";
import { Skeleton } from "../../components/shadcn/skeleton";
import { ToggleGroup, ToggleGroupItem } from "../../components/shadcn/toggle-group";
import { Tabs, TabsList, TabsTrigger } from "../../components/shadcn/tabs";
import Band from "../../components/layout/Band";

const NO_SEPARATE_BISMILLAH = [1, 9];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toArabicNumber = (number) =>
  String(number)
    .split("")
    .map((digit) => ARABIC_DIGITS[Number(digit)])
    .join("");

export function AyahEndMark({ number, small = false }) {
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

export function FontScaleControls({ value, onChange, min, max, t }) {
  return (
    <div className="quran-reading-controls__font-size" role="group" aria-label={t("quranTextSize")}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("quranDecreaseTextSize")}
        disabled={value <= min}
        onClick={() => onChange((scale) => Math.max(min, Math.round((scale - 0.1) * 10) / 10))}
      >
        <span aria-hidden="true" className="text-xs font-semibold">A−</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("quranIncreaseTextSize")}
        disabled={value >= max}
        onClick={() => onChange((scale) => Math.min(max, Math.round((scale + 0.1) * 10) / 10))}
      >
        <span aria-hidden="true" className="text-base font-semibold">A+</span>
      </Button>
    </div>
  );
}

export function ViewModeToggle({ value, onChange, t }) {
  return (
    <Tabs value={value} onValueChange={onChange} aria-label={t("quranViewMode")}>
      <TabsList>
        <TabsTrigger value="verse">{t("quranVerseByVerse")}</TabsTrigger>
        <TabsTrigger value="reading">{t("quranReadingMode")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export function TranslationToggle({ value, onChange, t }) {
  return (
    <ToggleGroup
      type="single"
      value={value ? "shown" : "hidden"}
      onValueChange={(nextValue) => {
        if (nextValue) onChange(nextValue === "shown");
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
  );
}

export function ReaderToolbar({
  surah,
  currentSurah,
  viewMode,
  onViewModeChange,
  fontScale,
  onFontScaleChange,
  minFontScale,
  maxFontScale,
  showTranslation,
  onTranslationChange,
  t,
}) {
  return (
    <Band as="header" glow className="quran-surah-header">
      <h1 className="quran-surah-header__ar" lang="ar" dir="rtl">{surah.name}</h1>
      <p className="quran-surah-header__en">
        {surah.englishName} · {surah.englishNameTranslation}
      </p>
      <div className="quran-reading-controls">
        <div className="quran-reading-controls__mode">
          <ViewModeToggle value={viewMode} onChange={onViewModeChange} t={t} />
          <FontScaleControls
            value={fontScale}
            onChange={onFontScaleChange}
            min={minFontScale}
            max={maxFontScale}
            t={t}
          />
        </div>
        {viewMode === "verse" && (
          <TranslationToggle
            value={showTranslation}
            onChange={onTranslationChange}
            t={t}
          />
        )}
      </div>
      {!NO_SEPARATE_BISMILLAH.includes(currentSurah) && (
        <p className="quran-bismillah" lang="ar" dir="rtl">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}
    </Band>
  );
}

export function ReaderLoadState({ error, loading, onRetry, t }) {
  if (error) {
    return (
      <div className="quran-state quran-state--error" role="alert">
        <p>{t("quranLoadError")}</p>
        <button type="button" className="quran-back" onClick={onRetry}>
          {t("socialRetry")}
        </button>
      </div>
    );
  }
  if (!loading) return null;
  return (
    <div className="grid gap-4" role="status" aria-label={t("quranLoading")}>
      <Skeleton className="h-24 w-full rounded-sm" />
      <Skeleton className="h-24 w-full rounded-sm" />
      <Skeleton className="h-24 w-full rounded-sm" />
    </div>
  );
}

export function AyahBlock({
  ayah,
  viewMode,
  markers,
  translation,
  showTranslation,
  isPlaying,
  onAyahClick,
  onPlayAyah,
  setAyahRef,
  t,
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onAyahClick(ayah);
    }
  };
  const markerLabels = (
    <>
      {markers.isRukuEnd && (
        <span title={t("quranRukuEnd")}>
          {t("quranRuku")} {markers.rukuNumber}
        </span>
      )}
      {markers.hasSajdah && (
        <span title={t("quranSajdah")}>۩ {t("quranSajdah")}</span>
      )}
    </>
  );

  if (viewMode === "reading") {
    return (
      <span
        key={ayah.number}
        role="button"
        tabIndex={0}
        className={`quran-reading__ayah ${isPlaying ? "quran-reading__ayah--playing" : ""}`}
        onClick={() => onAyahClick(ayah)}
        onKeyDown={handleKeyDown}
        ref={(element) => setAyahRef(ayah.numberInSurah, element)}
      >
        {ayah.text}
        <AyahEndMark number={ayah.numberInSurah} />
        {(markers.isRukuEnd || markers.hasSajdah) && (
          <span className="quran-reading__markers" dir="ltr">{markerLabels}</span>
        )}{" "}
      </span>
    );
  }

  return (
    <div
      key={ayah.number}
      ref={(element) => setAyahRef(ayah.numberInSurah, element)}
      className={`quran-ayah ${isPlaying ? "quran-ayah--playing" : ""}`}
    >
      <div className="quran-ayah__row">
        <span className="quran-ayah__num">{ayah.numberInSurah}</span>
        <p
          className="quran-ayah__text"
          lang="ar"
          dir="rtl"
          role="button"
          tabIndex={0}
          onClick={() => onAyahClick(ayah)}
          onKeyDown={handleKeyDown}
        >
          {ayah.text}
          <AyahEndMark number={ayah.numberInSurah} small />
        </p>
        <button
          className="quran-ayah__play"
          onClick={() => onPlayAyah(ayah)}
          aria-label={isPlaying ? t("quranPause") : t("quranPlayAyah")}
        >
          {isPlaying ? (
            <PauseIcon className="quran-ayah__icon" title={t("quranPause")} />
          ) : (
            <PlayIcon className="quran-ayah__icon" title={t("quranPlayAyah")} />
          )}
        </button>
      </div>
      {(markers.isRukuEnd || markers.hasSajdah) && (
        <div className="quran-ayah__markers" dir="ltr">{markerLabels}</div>
      )}
      {showTranslation && translation && (
        <div className="quran-ayah__translation">
          <p className="quran-ayah__ur" lang="ur" dir="rtl">{translation.ur}</p>
          <p className="quran-ayah__translit">{translation.urTransliteration}</p>
        </div>
      )}
    </div>
  );
}

export function ReaderAyahList({
  ayahs,
  viewMode,
  showTranslation,
  activeAyahNumber,
  isPlaying,
  onAyahClick,
  onPlayAyah,
  setAyahRef,
  getAyahMarkers,
  translationForAyah,
  sentinelRef,
  hasMore,
  t,
}) {
  return viewMode === "reading" ? (
    <p className="quran-reading" lang="ar" dir="rtl">
      {ayahs.map((ayah) => (
        <AyahBlock
          key={ayah.number}
          ayah={ayah}
          viewMode={viewMode}
          markers={getAyahMarkers(ayah)}
          isPlaying={isPlaying && activeAyahNumber === ayah.numberInSurah}
          onAyahClick={onAyahClick}
          setAyahRef={setAyahRef}
          t={t}
        />
      ))}
      {hasMore && <span ref={sentinelRef} style={{ display: "inline-block", width: 1, height: 1 }} />}
    </p>
  ) : (
    <div className="quran-ayahs">
      {ayahs.map((ayah) => (
        <AyahBlock
          key={ayah.number}
          ayah={ayah}
          viewMode={viewMode}
          markers={getAyahMarkers(ayah)}
          translation={translationForAyah(ayah.numberInSurah)}
          showTranslation={showTranslation}
          isPlaying={isPlaying && activeAyahNumber === ayah.numberInSurah}
          onAyahClick={onAyahClick}
          onPlayAyah={onPlayAyah}
          setAyahRef={setAyahRef}
          t={t}
        />
      ))}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
}
