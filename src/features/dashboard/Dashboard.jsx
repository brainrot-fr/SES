import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import quranData from "../../data/quran.json";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { useAccountProfile } from "../account/AccountProfileProvider";
import { getIslamicDate } from "./islamicDateService";
import AppIcon from "../../components/icons/AppIcon";
import Page from "../../components/layout/Page";
import Band from "../../components/layout/Band";
import Split from "../../components/layout/Split";
import RowList from "../../components/layout/RowList";
import Row from "../../components/layout/Row";
import "./dashboard.css";

function getStoredProgress(key, total) {
  const value = Number(localStorage.getItem(key));
  return Number.isInteger(value) && value >= 1 && value <= total ? value : 1;
}

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

export default function Dashboard() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { profile } = useAccountProfile();
  const navigate = useNavigate();
  const [today] = useState(() => new Date());
  const [ayah] = useState(() => getDailyAyah(today));
  const [islamicDate, setIslamicDate] = useState({
    text: "",
    loading: true,
    error: false,
  });
  const [dateRetry, setDateRetry] = useState(0);
  const countryCode = profile?.country_code || null;

  useEffect(() => {
    let cancelled = false;
    setIslamicDate({ text: "", loading: true, error: false });
    getIslamicDate({ countryCode, locale: lang, now: new Date() })
      .then(({ text }) => {
        if (!cancelled) setIslamicDate({ text, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) {
          setIslamicDate({ text: "", loading: false, error: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, lang, dateRetry]);
  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0];
  const welcome = username
    ? t("dashboardWelcomeNamed").replace("{username}", username)
    : t("dashboardWelcome");
  const currentSurah = getStoredProgress("ses-current-surah", 114);
  const currentNaql = getStoredProgress("ses-current-naql", 55);
  const currentSurahName = quranData.surahList[currentSurah - 1]?.englishName ?? t("navQuran");

  return (
    <Page className="dashboard">
      <header className="dashboard__greeting">
        <h1>{welcome}</h1>
        <span className="dashboard__date-line">
          <span className="dashboard__date-separator" aria-hidden="true">· </span>
          <span className="dashboard__date" aria-label={t("dashboardIslamicDate")}>
            {islamicDate.loading ? (
              <span role="status">{t("dashboardIslamicDateLoading")}</span>
            ) : islamicDate.error ? (
              <span className="dashboard__date-error" role="alert">
                {t("dashboardIslamicDateError")}
                <button type="button" onClick={() => setDateRetry((retry) => retry + 1)}>
                  {t("dashboardIslamicDateRetry")}
                </button>
              </span>
            ) : islamicDate.text}
          </span>
        </span>
      </header>

      <Split
        className="dashboard__layout"
        rail={(
          <Band
            as="button"
            type="button"
            glow
            className="dashboard__ayah"
            onClick={() => navigate(`/quran/${ayah.surah.number}/${ayah.numberInSurah}`)}
            aria-label={`${t("dashboardOpenAyah")} ${ayah.surah.englishName}, ${t("quranAyahLabel")} ${ayah.numberInSurah}`}
          >
            <span className="dashboard__ayah-label">{t("dashboardAyahOfDay")}</span>
            <span className="dashboard__arabic" lang="ar" dir="rtl">{ayah.text.replace(/^\uFEFF/, "")}</span>
            <span className="dashboard__reference">
              {ayah.surah.englishName} · {t("quranAyahLabel")} {ayah.numberInSurah}
            </span>
            <span className="dashboard__ayah-link">
              {t("dashboardReadQuran")}
              <AppIcon name="arrowRight" size={18} />
            </span>
          </Band>
        )}
      >
        <div className="dashboard__lists">
          <section className="dashboard__section" aria-labelledby="dashboard-continue-title">
            <h2 id="dashboard-continue-title">{t("dashboardContinue")}</h2>
            <RowList>
              <Row
                as="button"
                type="button"
                className="dashboard__row"
                onClick={() => navigate(`/quran/${currentSurah}`)}
                leading={<span className="dashboard__number">{currentSurah}</span>}
                content={(
                  <span className="dashboard__row-copy">
                    <span className="dashboard__row-name">{currentSurahName}</span>
                    <span className="dashboard__progress" aria-hidden="true">
                      <span style={{ width: `${(currentSurah / 114) * 100}%` }} />
                    </span>
                  </span>
                )}
              />
              <Row
                as="button"
                type="button"
                className="dashboard__row"
                onClick={() => navigate(`/nuqool/${currentNaql}`)}
                leading={<span className="dashboard__number">{currentNaql}</span>}
                content={(
                  <span className="dashboard__row-copy">
                    <span className="dashboard__row-name">{t("titleNuqool")}</span>
                    <span className="dashboard__progress" aria-hidden="true">
                      <span style={{ width: `${(currentNaql / 55) * 100}%` }} />
                    </span>
                  </span>
                )}
              />
            </RowList>
          </section>

          <section className="dashboard__section" aria-labelledby="dashboard-explore-title">
            <h2 id="dashboard-explore-title">{t("dashboardExplore")}</h2>
            <RowList>
              {[
                { id: "timeline", label: t("navTimeline") },
                { id: "murshid", label: t("navMurshid") },
                { id: "settings", label: t("titleSettings") },
              ].map((destination) => (
                <Row
                  as="button"
                  type="button"
                  key={destination.id}
                  className="dashboard__row dashboard__explore-row"
                  onClick={() => navigate(`/${destination.id}`)}
                  content={<span className="dashboard__row-name">{destination.label}</span>}
                  trailing={<AppIcon name="arrowRight" size={18} />}
                />
              ))}
            </RowList>
          </section>
        </div>
      </Split>
    </Page>
  );
}
