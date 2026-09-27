import { useState } from "react";
import { useNavigate } from "react-router-dom";
import quranData from "../../data/quran.json";
import { useLang } from "../../context/LanguageContext";
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
  const navigate = useNavigate();
  const [today] = useState(() => new Date());
  const [ayah] = useState(() => getDailyAyah(today));
  const [islamicDate] = useState(() => getIslamicDate(today, lang));

  const cards = [
    { id: "nuqool", title: t("navNuqool"), description: t("dashboardNuqoolDesc"), icon: "📜" },
    { id: "quran", title: t("navQuran"), description: t("dashboardQuranDesc"), icon: "📖" },
    { id: "timeline", title: t("navTimeline"), description: t("dashboardTimelineDesc"), icon: "🕰️" },
    { id: "murshid", title: t("navMurshid"), description: t("dashboardMurshidDesc"), icon: "🧭" },
    { id: "social", title: t("navSocial"), description: t("dashboardSocialDesc"), icon: "💬" },
    { id: "settings", title: t("titleSettings"), description: t("dashboardSettingsDesc"), icon: "⚙️" },
  ];

  return (
    <div className="dashboard">
      <section className="dashboard__welcome">
        <p className="dashboard__eyebrow">{t("dashboardWelcome")}</p>
        <h1>{t("titleDashboard")}</h1>
        <p className="dashboard__date">{islamicDate}</p>
      </section>

      <button
        type="button"
        className="dashboard__ayah"
        onClick={() => navigate(`/quran/${ayah.surah.number}`)}
        aria-label={`${t("dashboardOpenAyah")} ${ayah.surah.englishName}, ${t("quranAyahLabel")} ${ayah.numberInSurah}`}
      >
        <span className="dashboard__section-label">{t("dashboardAyahOfDay")}</span>
        <span className="dashboard__arabic" lang="ar" dir="rtl">{ayah.text.replace(/^\uFEFF/, "")}</span>
        <span className="dashboard__reference">
          {ayah.surah.englishName} · {t("quranAyahLabel")} {ayah.numberInSurah}
        </span>
        <span className="dashboard__ayah-link">{t("dashboardReadQuran")}</span>
      </button>

      <section className="dashboard__section" aria-labelledby="dashboard-links-title">
        <h2 id="dashboard-links-title">{t("dashboardExplore")}</h2>
        <div className="dashboard__grid">
          {cards.map((card) => (
            <button
              type="button"
              key={card.id}
              className="dashboard__card"
              onClick={() => navigate(`/${card.id}`)}
            >
              <span className="dashboard__card-icon" aria-hidden="true">{card.icon}</span>
              <span className="dashboard__card-title">{card.title}</span>
              <span className="dashboard__card-description">{card.description}</span>
              <span className="dashboard__card-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
