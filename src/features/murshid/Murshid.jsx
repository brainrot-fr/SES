/**
 * Murshid.jsx
 * Simple display-only page: Silsila-e-Tarbiyat and Silsila-e-Faqiri,
 * each rendered as a plain top-to-bottom ordered list. No selection UI —
 * per feat-murshidObject.md the Murshid choice happens once during
 * onboarding, not re-picked here.
 */

import { silsilaETarbiyat, silsilaEFaqiri } from './murshidData';
import { useLang } from '../../context/LanguageContext';
import Page from '../../components/layout/Page';
import Split from '../../components/layout/Split';
import './murshid.css';

function SilsilaList({ title, entries, kind }) {
  return (
    <section className="murshid-section" data-silsila={kind}>
      <h2 className="murshid-section__title">{title}</h2>
      <ol className="murshid-chain">
        {entries.filter((entry) => entry.name?.trim()).map((entry) => (
          <li key={entry.id} className="murshid-chain__item">
            <div className="murshid-chain__body">
              <p className="murshid-chain__name">{entry.name}</p>
              {entry.title && <p className="murshid-chain__meta">{entry.title}</p>}
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
  const { t } = useLang();

  return (
    <Page className="murshid-root">
      <Split
        className="murshid-split"
        rail={(
          <header className="murshid-intro">
            <h1>{t('titleMurshid')}</h1>
            <p>{t('murshidIntro')}</p>
          </header>
        )}
      >
        <div className="murshid-lineages">
          <fieldset className="murshid-switch">
            <legend className="sr-only">{t('titleMurshid')}</legend>
            <input id="murshid-tarbiyat" type="radio" name="murshid-lineage" defaultChecked />
            <label htmlFor="murshid-tarbiyat">{t('murshidTarbiyat')}</label>
            <input id="murshid-faqiri" type="radio" name="murshid-lineage" />
            <label htmlFor="murshid-faqiri">{t('murshidFaqiri')}</label>
          </fieldset>
          <div className="murshid-lineages__columns">
            <SilsilaList kind="tarbiyat" title={t('murshidTarbiyat')} entries={silsilaETarbiyat} />
            <SilsilaList kind="faqiri" title={t('murshidFaqiri')} entries={silsilaEFaqiri} />
          </div>
        </div>
      </Split>
    </Page>
  );
}