import { useLang } from "../../context/LanguageContext";
import EmptyState from "../../components/ui/EmptyState";

export default function ReelEndCard({ onCreate, onRestart }) {
  const { t } = useLang();
  return (
    <EmptyState
      className="reels-end-card"
      icon="sparkle"
      eyebrow={t("reelsEndEyebrow")}
      title={t("reelsEndTitle")}
      description={t("reelsEndCopy")}
      action={{
        label: t("reelsCreate"),
        icon: "reels",
        variant: "primary",
        onClick: onCreate,
      }}
      secondaryAction={onRestart ? {
        label: t("reelsBackToStart"),
        icon: "retry",
        variant: "secondary",
        onClick: onRestart,
      } : undefined}
    />
  );
}
