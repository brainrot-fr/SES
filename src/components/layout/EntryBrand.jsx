import { useLang } from "../../context/LanguageContext";
import AppIcon from "../icons/AppIcon";

export default function EntryBrand() {
  const { t } = useLang();

  return (
    <aside className="entry-brand flex min-h-48 flex-col justify-center gap-4 bg-muted/20 px-[var(--page-gutter)] py-8 md:min-h-full md:px-[clamp(3rem,8vw,8rem)] md:py-16" aria-label={t("appTitle")}>
      <span className="entry-brand__mark text-primary" aria-hidden="true">
        <AppIcon name="nuqool" size={28} />
      </span>
      <p className="entry-brand__arabic m-0 text-lg font-semibold text-foreground" lang="ur" dir="rtl">نقول امام مہدی علیہ السلام</p>
      <blockquote className="entry-brand__verse m-0 max-w-[38ch]">
        <p className="m-0 text-[clamp(1.35rem,3vw,2rem)] leading-relaxed text-foreground" lang="ar" dir="rtl">{t("entryBrandVerseArabic")}</p>
        <footer className="mt-2 grid gap-1 text-sm text-muted-foreground">
          <span>{t("entryBrandVerse")}</span>
          <cite className="not-italic">{t("entryBrandReference")}</cite>
        </footer>
      </blockquote>
    </aside>
  );
}
