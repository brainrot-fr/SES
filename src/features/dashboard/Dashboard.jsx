import { useState } from "react";
import { useNavigate } from "react-router-dom";
import quranData from "../../data/quran.json";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import AppIcon from "../../components/icons/AppIcon";
import Card from "../../components/ui/Card";
import "./dashboard.css";

function getDailyAyah(date = new Date()) {
  const ayahs = Object.values(quranData.surahs).flatMap((surah) =>
    surah.ayahs.map((ayah) => ({ ...ayah, surah })),
  );
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86400000,
  );
  return ayahs[(dayOfYear - 1) % ayahs.length];
}

function getIslamicDate(date, lang) {
  const locale = lang === "ur" ? "ur-u-ca-islamic" : "en-u-ca-islamic";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [today] = useState(() => new Date());
  const [ayah] = useState(() => getDailyAyah(today));
  const [islamicDate] = useState(() => getIslamicDate(today, lang));
  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0];
  const welcome = username
    ? t("dashboardWelcomeNamed").replace("{username}", username)
    : t("dashboardWelcome");

  const cards = [
    { id: "nuqool", title: t("navNuqool"), description: t("dashboardNuqoolDesc") },
    { id: "quran", title: t("navQuran"), description: t("dashboardQuranDesc") },
    { id: "timeline", title: t("navTimeline"), description: t("dashboardTimelineDesc") },
    { id: "murshid", title: t("navMurshid"), description: t("dashboardMurshidDesc") },
    { id: "social", title: t("navSocial"), description: t("dashboardSocialDesc") },
    { id: "settings", title: t("titleSettings"), description: t("dashboardSettingsDesc") },
  ];

  return (
    <div className="dashboard">
      <section className="dashboard__welcome">
        <div className="dashboard__welcome-copy">
          <p className="dashboard__eyebrow">{t("dashboardEyebrow")}</p>
          <h1>{welcome}</h1>
          <p className="dashboard__subtitle">{t("dashboardSubtitle")}</p>
        </div>
        <div className="dashboard__date">
          <span className="dashboard__date-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
              <path d="M7.5 3v4M16.5 3v4M3.5 10h17" />
            </svg>
          </span>
          <span className="dashboard__date-copy">
            <span className="dashboard__date-label">{t("dashboardIslamicDate")}</span>
            <span>{islamicDate}</span>
          </span>
        </div>
      </section>

      <div className="dashboard__content">
        <button
          type="button"
          className="dashboard__ayah"
          onClick={() => navigate(`/quran/${ayah.surah.number}/${ayah.numberInSurah}`)}
          aria-label={`${t("dashboardOpenAyah")} ${ayah.surah.englishName}, ${t("quranAyahLabel")} ${ayah.numberInSurah}`}
        >
          <span className="dashboard__ayah-top">
            <span className="dashboard__section-label">{t("dashboardAyahOfDay")}</span>
            <span className="dashboard__ayah-mark" aria-hidden="true">۞</span>
          </span>
          <span className="dashboard__arabic" lang="ar" dir="rtl">{ayah.text.replace(/^\uFEFF/, "")}</span>
          <span className="dashboard__reference">
            {ayah.surah.englishName} · {t("quranAyahLabel")} {ayah.numberInSurah}
          </span>
          <span className="dashboard__ayah-link">
            {t("dashboardReadQuran")}
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </span>
        </button>

        <section className="dashboard__section" aria-labelledby="dashboard-links-title">
          <div className="dashboard__section-heading">
            <div>
              <p className="dashboard__eyebrow">{t("dashboardStartHere")}</p>
              <h2 id="dashboard-links-title">{t("dashboardExplore")}</h2>
            </div>
            <button type="button" className="dashboard__community-link" onClick={() => navigate("/social")}>
              <AppIcon name="social" />
              <span>{t("dashboardCommunityCta")}</span>
            </button>
          </div>
          <div className="dashboard__grid">
            {cards.map((card) => (
              <Card
                as="button"
                type="button"
                key={card.id}
                className="dashboard__card"
                interactive
                onClick={() => navigate(`/${card.id}`)}
              >
                <span className="dashboard__card-icon"><AppIcon name={card.id} /></span>
                <span className="dashboard__card-copy">
                  <span className="dashboard__card-title">{card.title}</span>
                  <span className="dashboard__card-description">{card.description}</span>
                </span>
                <span className="dashboard__card-arrow" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </span>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
