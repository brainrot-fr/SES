import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import { getDisplayName } from "../auth/authSession";
import { useAccountProfile } from "../account/AccountProfileProvider";
import { getIslamicDate } from "./islamicDateService";
import AppIcon from "../../components/icons/AppIcon";
import Page from "../../components/layout/Page";
import Band from "../../components/layout/Band";
import Split from "../../components/layout/Split";
import RowList from "../../components/layout/RowList";
import Row from "../../components/layout/Row";
import { Skeleton } from "../../components/shadcn/skeleton";
import "./dashboard.css";

function getStoredProgress(key, total) {
  const value = Number(localStorage.getItem(key));
  return Number.isInteger(value) && value >= 1 && value <= total ? value : 1;
}

function getDayOfYear(date) {
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86400000,
  );
  return dayOfYear;
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { profile } = useAccountProfile();
  const navigate = useNavigate();
  const [today] = useState(() => new Date());
  const [ayah, setAyah] = useState(null);
  const [surahList, setSurahList] = useState([]);
  const [islamicDate, setIslamicDate] = useState({
    text: "",
    loading: true,
    error: false,
  });
  const [dateRetry, setDateRetry] = useState(0);
  const countryCode = profile?.country_code || null;

  useEffect(() => {
    let cancelled = false;
    import("../quran/quranApi").then(async ({ QURAN_SURAH_LIST, fetchSurah }) => {
      const totalAyahs = QURAN_SURAH_LIST.reduce((total, surah) => total + surah.numberOfAyahs, 0);
      let ayahIndex = (getDayOfYear(today) - 1) % totalAyahs;
      let selectedSurah = QURAN_SURAH_LIST[0];
      for (const surah of QURAN_SURAH_LIST) {
        if (ayahIndex < surah.numberOfAyahs) {
          selectedSurah = surah;
          break;
        }
        ayahIndex -= surah.numberOfAyahs;
      }
      const surahData = await fetchSurah(selectedSurah.number, { includeBismillah: true });
      if (cancelled) return;
      setSurahList(QURAN_SURAH_LIST);
      setAyah({ ...surahData.ayahs[ayahIndex], surah: selectedSurah });
    }).catch((error) => {
      console.error("[Dashboard] failed to load daily ayah", error);
    });
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    setIslamicDate({ text: "", loading: true, error: false });
    getIslamicDate({
      countryCode,
      locale: lang,
      now: new Date(),
      onRefresh: ({ text }) => {
        if (!cancelled) setIslamicDate({ text, loading: false, error: false });
      },
    })
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
  const username = getDisplayName(user);
  const welcome = username
    ? t("dashboardWelcomeNamed").replace("{username}", username)
    : t("dashboardWelcome");
  const currentSurah = getStoredProgress("ses-current-surah", 114);
  const currentNaql = getStoredProgress("ses-current-naql", 55);
  const currentSurahName = surahList[currentSurah - 1]?.englishName ?? t("navQuran");

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
            onClick={() => ayah && navigate(`/quran/${ayah.surah.number}/${ayah.numberInSurah}`)}
            disabled={!ayah}
            aria-label={ayah ? `${t("dashboardOpenAyah")} ${ayah.surah.englishName}, ${t("quranAyahLabel")} ${ayah.numberInSurah}` : t("dashboardAyahOfDay")}
          >
            <span className="dashboard__ayah-label">{t("dashboardAyahOfDay")}</span>
            {ayah ? (
              <span className="dashboard__arabic" lang="ar" dir="rtl">{ayah.text.replace(/^\uFEFF/, "")}</span>
            ) : (
              <span className="grid flex-1 content-center gap-4" aria-hidden="true">
                <Skeleton className="mx-auto h-8 w-4/5" />
                <Skeleton className="mx-auto h-8 w-full" />
                <Skeleton className="mx-auto h-8 w-3/5" />
              </span>
            )}
            {ayah && <span className="dashboard__reference">
              {ayah.surah.englishName} · {t("quranAyahLabel")} {ayah.numberInSurah}
            </span>}
            {ayah && <span className="dashboard__ayah-link">
              {t("dashboardReadQuran")}
              <AppIcon name="arrowRight" size={18} />
            </span>}
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
