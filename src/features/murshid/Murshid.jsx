/**
 * Murshid.jsx
 * Simple display-only page: Silsila-e-Tarbiyat and Silsila-e-Faqiri,
 * each rendered as a plain top-to-bottom ordered list. No selection UI —
 * per feat-murshidObject.md the Murshid choice happens once during
 * onboarding, not re-picked here.
 */

import { silsilaETarbiyat, silsilaEFaqiri } from './murshidData';
import { useLang } from '../../context/LanguageContext';
import './murshid.css';

function SilsilaList({ title, entries }) {
  return (
    <section className="murshid-section">
      <h2 className="murshid-section__title">{title}</h2>
      <ol className="murshid-chain">
        {entries.map((entry, i) => (
          <li key={entry.id} className="murshid-chain__item">
            <span className="murshid-chain__num">{i + 1}</span>
            <div className="murshid-chain__body">
              <p className="murshid-chain__name">{entry.name || '—'}</p>
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
    <div className="murshid-root">
      <SilsilaList title={t('murshidTarbiyat')} entries={silsilaETarbiyat} />
      <SilsilaList title={t('murshidFaqiri')} entries={silsilaEFaqiri} />
    </div>
  );
}