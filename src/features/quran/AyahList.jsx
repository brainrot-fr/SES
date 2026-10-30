import AppIcon from "@/components/icons/AppIcon";
import { AyahEndMark } from "@/features/quran/ReadingView";

export default function AyahList({
  ayahs,
  ayahRefs,
  getMarkers,
  translationForAyah,
  showTranslation,
  isPlaying,
  activeAyahNumber,
  onAyahClick,
  toggleAyah,
  playAyahOnly,
  hasMore,
  sentinelRef,
  t,
}) {
  return (
    <div className="quran-ayahs">
      {ayahs.map((ayah) => {
        const markers = getMarkers(ayah);
        const translation = translationForAyah(ayah.numberInSurah);
        const isThisPlaying = isPlaying && activeAyahNumber === ayah.numberInSurah;
        return (
          <div
            key={ayah.number}
            ref={(element) => { ayahRefs.current[ayah.numberInSurah] = element; }}
            className={`quran-ayah ${isThisPlaying ? "quran-ayah--playing" : ""}`}
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
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onAyahClick(ayah);
                  }
                }}
              >
                {ayah.text}
                <AyahEndMark number={ayah.numberInSurah} small />
              </p>
              <button
                type="button"
                className="quran-ayah__play"
                onClick={() => {
                  if (activeAyahNumber === ayah.numberInSurah) toggleAyah(ayah);
                  else playAyahOnly(ayah);
                }}
                aria-label={isThisPlaying ? t("quranPause") : t("quranPlayAyah")}
              >
                <AppIcon name={isThisPlaying ? "pause" : "play"} className="quran-ayah__icon" />
              </button>
            </div>
            {(markers.isRukuEnd || markers.hasSajdah) && (
              <div className="quran-ayah__markers" dir="ltr">
                {markers.isRukuEnd && <span>{t("quranRuku")} {markers.rukuNumber}</span>}
                {markers.hasSajdah && <span>۩ {t("quranSajdah")}</span>}
              </div>
            )}
            {showTranslation && translation && (
              <div className="quran-ayah__translation">
                <p className="quran-ayah__ur" lang="ur" dir="rtl">{translation.ur}</p>
                <p className="quran-ayah__translit">{translation.urTransliteration}</p>
              </div>
            )}
          </div>
        );
      })}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
}
