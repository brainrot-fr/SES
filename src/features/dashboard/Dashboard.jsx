import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { getDisplayName } from "@/features/auth/authSession";
import { useAccountProfile } from "@/features/account/AccountProfileProvider";
import { getIslamicDate } from "@/features/dashboard/islamicDateService";
import { getDailyAyahPosition } from "@/features/dashboard/dailyAyah";
import { fetchSurah, QURAN_SURAH_COUNT, QURAN_SURAH_META } from "@/features/quran/quranData";
import { NAQL_COUNT } from "@/features/nuqool/count";
import DirectionalIcon from "@/components/icons/DirectionalIcon";
import Page from "@/components/layout/Page";
import Band from "@/components/layout/Band";
import RowList from "@/components/layout/RowList";
import Row from "@/components/layout/Row";
import { Skeleton } from "@/components/shadcn/skeleton";
import { Button } from "@/components/shadcn/button";
import FormError from "@/components/FormError";
import "@/features/dashboard/dashboard.css";

function getStoredProgress(key, total) {
  const value = Number(localStorage.getItem(key));
  return Number.isInteger(value) && value >= 1 && value <= total ? value : 1;
}

function hasStoredProgress(key) {
  return localStorage.getItem(key) !== null;
}

export default function Dashboard() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { profile } = useAccountProfile();
  const navigate = useNavigate();
  const [today] = useState(() => new Date());
  const [ayah, setAyah] = useState(null);
  const [ayahError, setAyahError] = useState(false);
  const [ayahRetry, setAyahRetry] = useState(0);
  const [islamicDate, setIslamicDate] = useState({
    text: "",
    loading: true,
    error: false,
  });
  const [dateRetry, setDateRetry] = useState(0);
  const countryCode = profile?.country_code || null;

  useEffect(() => {
    let cancelled = false;
    setAyah(null);
    setAyahError(false);
    (async () => {
      const { surah: selectedSurah, ayahIndex } = getDailyAyahPosition(today, QURAN_SURAH_META);
      const surahData = await fetchSurah(selectedSurah.number, { includeBismillah: true });
      if (cancelled) return;
      setAyah({ ...surahData.ayahs[ayahIndex], surah: selectedSurah });
    })().catch((error) => {
      console.error("[Dashboard] failed to load daily ayah", error);
      if (!cancelled) setAyahError(true);
    });
    return () => {
      cancelled = true;
    };
  }, [today, ayahRetry]);

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
  const currentSurah = getStoredProgress("ses-current-surah", QURAN_SURAH_COUNT);
  const currentNaql = getStoredProgress("ses-current-naql", NAQL_COUNT);
  const hasQuranProgress = hasStoredProgress("ses-current-surah");
  const hasNaqlProgress = hasStoredProgress("ses-current-naql");
  const currentSurahMeta = QURAN_SURAH_META[currentSurah - 1];
  const currentAyah = getStoredProgress("ses-current-ayah", currentSurahMeta?.numberOfAyahs ?? 286);
  const currentSurahName = currentSurahMeta?.englishName ?? t("navQuran");

  return (
    <Page className="dashboard">
      <header className="dashboard__greeting">
        <h1>{welcome}</h1>
        <span className="dashboard__date-line">
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

      <div className="dashboard__layout">
        <Band
            as="section"
            glow
            className="dashboard__ayah"
          >
            <span className="dashboard__ayah-label">{t("dashboardAyahOfDay")}</span>
            {ayah ? (
              <span className="dashboard__arabic" lang="ar" dir="rtl">{ayah.text.replace(/^\uFEFF/, "")}</span>
            ) : ayahError ? (
              <span className="dashboard__ayah-error">
                <FormError message={t("dashboardAyahError")} />
                <Button type="button" variant="outline" onClick={() => setAyahRetry((retry) => retry + 1)}>
                  {t("dashboardIslamicDateRetry")}
                </Button>
              </span>
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate(`/quran/${ayah.surah.number}/${ayah.numberInSurah}`)}
              >
                {t("dashboardReadQuran")}
                <DirectionalIcon name="arrowRight" size={18} />
              </Button>
            </span>}
        </Band>
          <section className="dashboard__section dashboard__continue" aria-labelledby="dashboard-continue-title">
            <h2 id="dashboard-continue-title">{t("dashboardContinue")}</h2>
            <RowList>
              {hasQuranProgress && <Row
                as="button"
                type="button"
                className="dashboard__row"
                onClick={() => navigate(`/quran/${currentSurah}`)}
                leading={<span className="dashboard__number">{currentSurah}</span>}
                content={(
                  <span className="dashboard__row-copy">
                    <span className="dashboard__row-name">
                      {currentSurahName} · {t("quranAyahLabel")} {currentAyah} / {currentSurahMeta?.numberOfAyahs ?? 286}
                    </span>
                  </span>
                )}
              />}
              {hasNaqlProgress && <Row
                as="button"
                type="button"
                className="dashboard__row"
                onClick={() => navigate(`/nuqool/${currentNaql}`)}
                leading={<span className="dashboard__number">{currentNaql}</span>}
                content={(
                  <span className="dashboard__row-copy">
                    <span className="dashboard__row-name">{t("titleNuqool")} · {currentNaql} / {NAQL_COUNT}</span>
                  </span>
                )}
              />}
              {!hasQuranProgress && !hasNaqlProgress && (
                <p className="dashboard__empty-progress">{t("dashboardNoProgress")}</p>
              )}
            </RowList>
          </section>

          <section className="dashboard__section dashboard__explore" aria-labelledby="dashboard-explore-title">
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
                  trailing={<DirectionalIcon name="arrowRight" size={18} />}
                />
              ))}
            </RowList>
          </section>
      </div>
    </Page>
  );
}
