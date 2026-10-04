import { useEffect, useRef, useState } from "react";
import { fetchSurah, QURAN_SURAH_LIST } from "./quranApi";
import { quranTranslations } from "./quranTranslations";

const TOTAL_SURAHS = 114;
const STORAGE_KEY = "ses-current-surah";
const VIEW_MODE_KEY = "ses-quran-view-mode";
const TRANSLATION_KEY = "ses-show-translation";
const FONT_SCALE_KEY = "ses-quran-font-scale";
const AYAH_BATCH_SIZE = 40;
const MIN_FONT_SCALE = 0.8;
const MAX_FONT_SCALE = 1.6;

export function useQuranReaderState(initialSurah, initialAyah) {
  const [currentSurah, setCurrentSurah] = useState(() => {
    const n = initialSurah ?? parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return !isNaN(n) && n >= 1 && n <= TOTAL_SURAHS ? n : 1;
  });
  const [surah, setSurah] = useState(null);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(AYAH_BATCH_SIZE);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(VIEW_MODE_KEY) || "verse",
  );
  const [showTranslation, setShowTranslation] = useState(
    () => localStorage.getItem(TRANSLATION_KEY) !== "false",
  );
  const [fontScale, setFontScale] = useState(() => {
    const storedScale = Number.parseFloat(localStorage.getItem(FONT_SCALE_KEY));
    return Number.isFinite(storedScale)
      ? Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, storedScale))
      : 1;
  });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const topRef = useRef(null);
  const sentinelRef = useRef(null);
  const ayahRefs = useRef({});
  const deepLinkHandledRef = useRef(false);

  const goTo = (number) =>
    setCurrentSurah(Math.max(1, Math.min(TOTAL_SURAHS, number)));
  const retry = () => setLoadAttempt((attempt) => attempt + 1);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);
  useEffect(() => {
    localStorage.setItem(TRANSLATION_KEY, String(showTranslation));
  }, [showTranslation]);
  useEffect(() => {
    localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    let cancelled = false;
    setSurah(null);
    setError(null);
    setVisibleCount(AYAH_BATCH_SIZE);
    localStorage.setItem(STORAGE_KEY, String(currentSurah));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    fetchSurah(currentSurah)
      .then((data) => {
        if (!cancelled) setSurah(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [currentSurah, loadAttempt]);

  useEffect(() => {
    if (!surah) return undefined;
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + AYAH_BATCH_SIZE, surah.ayahs.length),
          );
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [surah, visibleCount]);

  useEffect(() => {
    if (!surah || surah.number !== currentSurah || !initialAyah) return;
    if (initialAyah > surah.ayahs.length) {
      deepLinkHandledRef.current = true;
      return;
    }
    if (deepLinkHandledRef.current) return;
    if (visibleCount < initialAyah) {
      setVisibleCount(initialAyah);
      return;
    }

    deepLinkHandledRef.current = true;
    const frame = requestAnimationFrame(() => {
      ayahRefs.current[initialAyah]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentSurah, initialAyah, surah, visibleCount]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalAyahs = surah?.ayahs.length ?? 0;
  const getVisibleAyahs = (activeAyahNumber = 0) =>
    surah
      ? surah.ayahs.slice(
          0,
          Math.min(totalAyahs, Math.max(visibleCount, activeAyahNumber || 0)),
        )
      : [];
  const visibleAyahs = getVisibleAyahs();
  const hasMore = visibleAyahs.length < totalAyahs;
  const firstRukuNumber = surah?.ayahs?.[0]?.ruku;
  const getAyahMarkers = (ayah) => {
    const nextAyah = surah?.ayahs?.[ayah.numberInSurah];
    const isRukuEnd =
      ayah.ruku != null && (!nextAyah || nextAyah.ruku !== ayah.ruku);
    const rukuNumber = ayah.ruku - firstRukuNumber + 1;
    return { isRukuEnd, rukuNumber, hasSajdah: Boolean(ayah.sajda) };
  };

  return {
    currentSurah,
    surah,
    error,
    loadAttempt,
    showBackToTop,
    viewMode,
    setViewMode,
    showTranslation,
    setShowTranslation,
    fontScale,
    setFontScale,
    topRef,
    sentinelRef,
    ayahRefs,
    totalAyahs,
    visibleAyahs,
    getVisibleAyahs,
    hasMore,
    nextSurah: QURAN_SURAH_LIST[currentSurah],
    goTo,
    retry,
    getAyahMarkers,
    translationForAyah: (numberInSurah) =>
      quranTranslations[currentSurah]?.[numberInSurah],
    minFontScale: MIN_FONT_SCALE,
    maxFontScale: MAX_FONT_SCALE,
  };
}
