import IconButton from "@/components/layout/IconButton";
import Band from "@/components/layout/Band";

export default function QuranHeader({ surah, showBismillah, onOpenSettings, settingsLabel }) {
  return (
    <Band as="header" glow className="quran-surah-header">
      <h1 className="quran-surah-header__ar" lang="ar" dir="rtl">{surah.name}</h1>
      <p className="quran-surah-header__en">
        {surah.englishName} · {surah.englishNameTranslation}
      </p>
      <IconButton icon="display" label={settingsLabel} onClick={onOpenSettings} />
      {showBismillah && (
        <p className="quran-bismillah" lang="ar" dir="rtl">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}
    </Band>
  );
}
