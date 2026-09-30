import { useLang } from "../../context/LanguageContext";
import AppIcon from "../icons/AppIcon";

export default function EntryBrand() {
  const { t } = useLang();

  return (
    <aside className="entry-brand" aria-label={t("appTitle")}>
      <span className="entry-brand__mark" aria-hidden="true">
        <AppIcon name="nuqool" size={28} />
      </span>
      <p className="entry-brand__arabic" lang="ur" dir="rtl">نقول امام مہدی علیہ السلام</p>
      <blockquote className="entry-brand__verse">
        <p lang="ar" dir="rtl">{t("entryBrandVerseArabic")}</p>
        <footer>
          <span>{t("entryBrandVerse")}</span>
          <cite>{t("entryBrandReference")}</cite>
        </footer>
      </blockquote>
    </aside>
  );
}
