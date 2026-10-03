/**
 * timeline.jsx
 * Timeline feature page showing major events and details.
 *
 * - Renders a semantic vertical timeline using shared design tokens.
 * - Opens event detail dialogs with accessible keyboard support.
 */

import { useState } from 'react';
import { timelineEvents } from './timelineData';
import { useLang } from '../../context/LanguageContext';
import AppIcon from '../../components/icons/AppIcon';
import Page from '../../components/layout/Page';
import Split from '../../components/layout/Split';
import { Button } from '../../components/shadcn/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/shadcn/sheet';
import './timeline.css';

export default function Timeline() {
  const { t } = useLang();

  const [openEvent, setOpenEvent] = useState(null);

  const openDetails = (ev) => {
    setOpenEvent(ev);
  };

  return (
    <Page className="tl-root">
      <Split
        className="tl-split"
        rail={(
          <header className="tl-hero">
            <h1 className="tl-hero__name">{t('tlName')}</h1>
            <p className="tl-hero__span">{t('tlSpan')}</p>
          </header>
        )}
      >
        <ol className="tl-list">
          {timelineEvents.map((ev) => (
            <li className="tl-item" key={ev.id}>
              <div className="tl-item__rail" aria-hidden="true">
                <span className="tl-item__year">{ev.year}</span>
                <span className="tl-item__marker" />
              </div>
              <button type="button" className="tl-item__content" onClick={() => openDetails(ev)}>
                <h2 className="tl-item__title">{ev.title}</h2>
                <p className="tl-item__summary">{ev.summary}</p>
                <span className="tl-item__cta">{t('tlDetails')} <AppIcon name="arrowRight" size={16} /></span>
              </button>
            </li>
          ))}
        </ol>
      </Split>

      <Sheet open={Boolean(openEvent)} onOpenChange={(open) => { if (!open) setOpenEvent(null); }}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          closeLabel={t('closeSheet')}
          className="tl-dialog mx-auto w-full gap-4 rounded-t-[var(--radius-md)] border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="gap-3 p-0">
            <div className="flex items-center justify-between gap-3">
              <span className="tl-dialog__year">{openEvent?.year}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpenEvent(null)} aria-label={t('tlCloseLabel')}>
                <AppIcon name="close" />
              </Button>
            </div>
            <SheetTitle className="tl-dialog__title">{openEvent?.title}</SheetTitle>
            <SheetDescription className="text-base leading-relaxed">{openEvent?.summary}</SheetDescription>
          </SheetHeader>
          <div className="tl-dialog__body">{openEvent?.detail}</div>
        </SheetContent>
      </Sheet>
    </Page>
  );
}