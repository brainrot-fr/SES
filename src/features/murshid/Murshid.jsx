/**
 * Murshid.jsx
 * Simple display-only page: Silsila-e-Tarbiyat and Silsila-e-Faqiri,
 * each rendered as a plain top-to-bottom ordered list. No selection UI —
 * per feat-murshidObject.md the Murshid choice happens once during
 * onboarding, not re-picked here.
 */

import { silsilaETarbiyat, silsilaEFaqiri } from '@/features/murshid/murshidData';
import { useLang } from '@/context/LanguageContext';
import Page from '@/components/layout/Page';
import Split from '@/components/layout/Split';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import '@/features/murshid/murshid.css';

function SilsilaList({ title, entries, kind, lang }) {
  const visibleEntries = entries.filter((entry) => entry.name?.trim());
  return (
    <section className="murshid-section" data-silsila={kind}>
      <h2 className="murshid-section__title">{title}</h2>
      <ol className="murshid-chain">
        {visibleEntries.map((entry) => (
          <li key={entry.id} className="murshid-chain__item">
            <div className="murshid-chain__body">
              <p className="murshid-chain__name">{lang === 'ur' ? entry.name_ur || entry.name : entry.name}</p>
              {entry.title && <p className="murshid-chain__meta">{lang === 'ur' ? entry.title_ur || entry.title : entry.title}</p>}
              {entry.years && <p className="murshid-chain__meta">{entry.years}</p>}
              {entry.note && <p className="murshid-chain__note">{entry.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Murshid() {
  const { t, lang } = useLang();

  return (
    <Page className="murshid-root">
      <Split
        className="murshid-split"
        rail={(
          <header className="murshid-intro">
            <p>{t('murshidIntro')}</p>
          </header>
        )}
      >
        <div className="murshid-lineages">
          <Tabs defaultValue="tarbiyat" className="w-full">
            <TabsList className="w-full grid-cols-2 lg:hidden">
              <TabsTrigger value="tarbiyat">{t('murshidTarbiyat')}</TabsTrigger>
              <TabsTrigger value="faqiri">{t('murshidFaqiri')}</TabsTrigger>
            </TabsList>
            <div className="murshid-lineages__columns">
              <TabsContent value="tarbiyat" forceMount className="data-[state=inactive]:hidden lg:data-[state=inactive]:block">
                <SilsilaList kind="tarbiyat" title={t('murshidTarbiyat')} entries={silsilaETarbiyat} lang={lang} />
              </TabsContent>
              <TabsContent value="faqiri" forceMount className="data-[state=inactive]:hidden lg:data-[state=inactive]:block">
                <SilsilaList kind="faqiri" title={t('murshidFaqiri')} entries={silsilaEFaqiri} lang={lang} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Split>
    </Page>
  );
}