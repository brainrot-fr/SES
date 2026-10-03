import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import { Button } from "../../components/shadcn/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../components/shadcn/empty";

export default function ReelEndCard({ onCreate, onRestart }) {
  const { t } = useLang();
  return (
    <Empty className="reels-end-card">
      <EmptyHeader>
        <EmptyMedia><AppIcon name="sparkle" size={25} /></EmptyMedia>
        <p className="text-sm text-muted-foreground">{t("reelsEndEyebrow")}</p>
        <EmptyTitle>{t("reelsEndTitle")}</EmptyTitle>
        <EmptyDescription>{t("reelsEndCopy")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" onClick={onCreate}><AppIcon name="reels" size={18} />{t("reelsCreate")}</Button>
        {onRestart && (
          <Button type="button" variant="secondary" onClick={onRestart}>
            <AppIcon name="retry" size={18} />
            {t("reelsBackToStart")}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
