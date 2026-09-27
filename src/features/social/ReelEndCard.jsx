import AppIcon from "../../components/icons/AppIcon";
import { useLang } from "../../context/LanguageContext";

export default function ReelEndCard({ onCreate, onRestart }) {
  const { t } = useLang();
  return (
    <section className="reels-end-card" aria-labelledby="reels-end-title">
      <span className="reels-end-card__mark"><AppIcon name="sparkle" size={27} /></span>
      <p className="reels-end-card__eyebrow">{t("reelsEndEyebrow")}</p>
      <h2 id="reels-end-title">{t("reelsEndTitle")}</h2>
      <p className="reels-end-card__copy">{t("reelsEndCopy")}</p>
      <div className="reels-end-card__actions">
        <button type="button" className="reels-end-card__primary" onClick={onCreate}>
          <AppIcon name="reels" size={18} />
          {t("reelsCreate")}
        </button>
        {onRestart && (
          <button type="button" className="reels-end-card__secondary" onClick={onRestart}>
            <AppIcon name="retry" size={18} />
            {t("reelsBackToStart")}
          </button>
        )}
      </div>
    </section>
  );
}
