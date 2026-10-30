/**
 * timeline.jsx
 * Timeline feature page showing major events and details.
 *
 * - Renders a semantic vertical timeline using shared design tokens.
 * - Opens event detail dialogs with accessible keyboard support.
 */

import { useState } from 'react';
import { timelineEvents } from '@/features/timeline/timelineData';
import { useLang } from '@/context/LanguageContext';
import AppIcon from '@/components/icons/AppIcon';
import BottomSheet from '@/components/BottomSheet';
import DirectionalIcon from '@/components/icons/DirectionalIcon';
import Page from '@/components/layout/Page';
import Split from '@/components/layout/Split';
import { Button } from '@/components/shadcn/button';
import '@/features/timeline/timeline.css';

export default function Timeline() {
  const { t, lang } = useLang();

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
              <div className="tl-item__rail">
                <span className="tl-item__marker" aria-hidden="true" />
              </div>
              <button type="button" className="tl-item__content" onClick={() => openDetails(ev)}>
                <span className="tl-item__year">{ev.year}</span>
                <h2 className="tl-item__title">{lang === 'ur' ? ev.title_ur || ev.title : ev.title}</h2>
                <p className="tl-item__summary">{lang === 'ur' ? ev.summary_ur || ev.summary : ev.summary}</p>
                <span className="tl-item__cta">{t('tlDetails')} <DirectionalIcon name="arrowRight" size={16} /></span>
              </button>
            </li>
          ))}
        </ol>
      </Split>

      <BottomSheet
        open={Boolean(openEvent)}
        onOpenChange={(open) => { if (!open) setOpenEvent(null); }}
        title={lang === 'ur' ? openEvent?.title_ur || openEvent?.title : openEvent?.title}
        description={lang === 'ur' ? openEvent?.summary_ur || openEvent?.summary : openEvent?.summary}
        closeLabel={t('closeSheet')}
        showCloseButton={false}
        className="tl-dialog mx-auto w-full gap-4 border-border bg-card p-5"
      >
          <header className="tl-dialog__header flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="tl-dialog__year">{openEvent?.year}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpenEvent(null)} aria-label={t('tlCloseLabel')}>
                <AppIcon name="close" />
              </Button>
            </div>
            <h2 className="tl-dialog__title">{lang === 'ur' ? openEvent?.title_ur || openEvent?.title : openEvent?.title}</h2>
            <p className="text-base leading-relaxed text-muted-foreground">{lang === 'ur' ? openEvent?.summary_ur || openEvent?.summary : openEvent?.summary}</p>
          </header>
          <div className="tl-dialog__body">{lang === 'ur' ? openEvent?.detail_ur || openEvent?.detail : openEvent?.detail}</div>
      </BottomSheet>
    </Page>
  );
}