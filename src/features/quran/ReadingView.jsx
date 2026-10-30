export function AyahEndMark({ number, small = false }) {
  const digits = String(number)
    .split("")
    .map((digit) => ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"][Number(digit)])
    .join("");
  return (
    <span className={`ayah-mark${small ? " ayah-mark--small" : ""}`} data-len={digits.length} dir="rtl">
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

export default function ReadingView({ ayahs, getMarkers, isPlaying, activeAyahNumber, ayahRefs, hasMore, sentinelRef, onAyahClick, t }) {
  return (
    <p className="quran-reading" lang="ar" dir="rtl">
      {ayahs.map((ayah) => {
        const markers = getMarkers(ayah);
        const isThisPlaying = isPlaying && activeAyahNumber === ayah.numberInSurah;
        return (
          <span
            key={ayah.number}
            role="button"
            tabIndex={0}
            className={`quran-reading__ayah ${isThisPlaying ? "quran-reading__ayah--playing" : ""}`}
            onClick={() => onAyahClick(ayah)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onAyahClick(ayah);
              }
            }}
            ref={(element) => { ayahRefs.current[ayah.numberInSurah] = element; }}
          >
            {ayah.text}
            <AyahEndMark number={ayah.numberInSurah} />
            {(markers.isRukuEnd || markers.hasSajdah) && (
              <span className="quran-reading__markers" dir="ltr">
                {markers.isRukuEnd && <span>{t("quranRuku")} {markers.rukuNumber}</span>}
                {markers.hasSajdah && <span>۩ {t("quranSajdah")}</span>}
              </span>
            )}{" "}
          </span>
        );
      })}
      {hasMore && <span ref={sentinelRef} style={{ display: "inline-block", width: 1, height: 1 }} />}
    </p>
  );
}
