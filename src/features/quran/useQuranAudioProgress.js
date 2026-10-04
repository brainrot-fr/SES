import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSurahAudioDuration } from "./quranApi";

const FALLBACK_AYAH_SECONDS = 5;

export function useQuranAudioProgress({
  audioRef,
  surah,
  activeAyahNumber,
  reciterId,
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [indexedSurahDuration, setIndexedSurahDuration] = useState(null);
  const [ayahDurations, setAyahDurations] = useState({});

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
    };
  }, [audioRef]);

  useEffect(() => {
    setAyahDurations({});
  }, [surah?.number, reciterId]);

  const activeAyah = surah?.ayahs.find(
    (ayah) => ayah.numberInSurah === activeAyahNumber,
  );
  const audioMetadataMatchesActiveAyah =
    activeAyah != null &&
    audioRef.current.currentSrc.endsWith(
      `/${reciterId}/${activeAyah.number}.mp3`,
    );

  useEffect(() => {
    if (
      activeAyahNumber == null ||
      !Number.isFinite(duration) ||
      duration <= 0 ||
      audioRef.current.readyState < 1 ||
      !audioMetadataMatchesActiveAyah
    ) {
      return;
    }
    setAyahDurations((previous) =>
      previous[activeAyahNumber] === duration
        ? previous
        : { ...previous, [activeAyahNumber]: duration },
    );
  }, [activeAyahNumber, duration, audioMetadataMatchesActiveAyah, audioRef]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [activeAyahNumber, surah?.number, reciterId]);

  useEffect(() => {
    let cancelled = false;
    if (!surah?.number) return () => { cancelled = true; };
    fetchSurahAudioDuration(surah.number, reciterId).then((seconds) => {
      if (!cancelled) {
        setIndexedSurahDuration({
          key: `${surah.number}:${reciterId}`,
          seconds,
        });
      }
    });
    return () => { cancelled = true; };
  }, [surah?.number, reciterId]);

  const ayahCount = surah?.ayahs?.length ?? 0;
  const durationKey = `${surah?.number ?? ""}:${reciterId}`;
  const indexedDuration = indexedSurahDuration?.key === durationKey
    ? indexedSurahDuration.seconds
    : null;
  const estimatedAyahDuration = indexedDuration
    ? indexedDuration / ayahCount
    : FALLBACK_AYAH_SECONDS;
  const surahTotalTime = indexedDuration ?? ayahCount * estimatedAyahDuration;

  const surahElapsedTime = useMemo(() => {
    if (activeAyahNumber == null) return 0;
    let elapsed = currentTime;
    for (let number = 1; number < activeAyahNumber; number += 1) {
      elapsed += ayahDurations[number] ?? estimatedAyahDuration;
    }
    return Math.min(surahTotalTime, elapsed);
  }, [
    activeAyahNumber,
    currentTime,
    ayahDurations,
    estimatedAyahDuration,
    surahTotalTime,
  ]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    const clamped = Math.max(0, Math.min(time, audio.duration));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [audioRef]);

  return { currentTime, duration, surahElapsedTime, surahTotalTime, seek };
}
