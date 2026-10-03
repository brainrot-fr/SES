import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import { Button } from "@/components/shadcn/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/shadcn/empty";

export default function ReelEndCard({ onCreate, onRestart }) {
  const { t } = useLang();
  return (
    <Empty className="reels-end-card gap-4 rounded-none border-0 p-5 md:p-6">
      <EmptyHeader>
        <EmptyMedia><AppIcon name="sparkle" size={25} /></EmptyMedia>
        <p className="reels-end-card__eyebrow">{t("reelsEndEyebrow")}</p>
        <EmptyTitle>{t("reelsEndTitle")}</EmptyTitle>
        <EmptyDescription>{t("reelsEndCopy")}</EmptyDescription>
      </EmptyHeader>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={onCreate}>
          <AppIcon name="reels" size={18} />
          {t("reelsCreate")}
        </Button>
        {onRestart && (
          <Button type="button" variant="secondary" onClick={onRestart}>
            <AppIcon name="retry" size={18} />
            {t("reelsBackToStart")}
          </Button>
        )}
      </div>
    </Empty>
  );
}
