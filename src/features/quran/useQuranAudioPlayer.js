/**
 * useQuranAudioPlayer.js
 * Custom hook that manages Quran audio playback.
 *
 * - Builds audio URLs for the selected reciter.
 * - Controls play/pause/resume/stop logic.
 * - Integrates with native media session and Android foreground service.
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { RECITERS } from "./quranApi";
import { useQuranAudioUrls } from "./quranAudioUrls";
import { useQuranAudioProgress } from "./useQuranAudioProgress";
import { useForegroundService } from "./useForegroundService";
import {
  updateMediaSessionNowPlaying,
  updateMediaSessionPlaybackState,
  useMediaSession,
} from "./useMediaSession";

export function useQuranAudioPlayer(surah) {
  const {
    buildAudioUrl,
    getSavedReciter,
    saveReciter,
    setReciterBitrate,
    nextAudioBitrate,
    shouldPlayOpeningBismillah,
  } = useQuranAudioUrls();
  const { syncForeground, stopForeground } = useForegroundService();
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = new Audio();
  }

  /*
   * Two separate pieces of state on purpose: which ayah is loaded, and
   * whether it's currently playing. Conflating these was the source of
   * the old pause/resume bug.
   */
  const [activeAyahNumber, setActiveAyahNumber] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [reciterId, setReciterId] = useState(getSavedReciter());

  const activeAyahNumberRef = useRef(activeAyahNumber);
  const isPlayingRef = useRef(isPlaying);
  const autoAdvanceRef = useRef(autoAdvance);
  const reciterIdRef = useRef(reciterId);
  const pendingBismillahAyahRef = useRef(null);

  const pendingReciterRestartRef = useRef(false);
  const isStoppingRef = useRef(false);
  const playRef = useRef(() => {});
  const playSurahFromStartRef = useRef(() => {});
  const stopRef = useRef(() => {});

  useEffect(() => {
    activeAyahNumberRef.current = activeAyahNumber;
  }, [activeAyahNumber]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    autoAdvanceRef.current = autoAdvance;
  }, [autoAdvance]);
  useEffect(() => {
    reciterIdRef.current = reciterId;
  }, [reciterId]);

  const surahRef = useRef(surah);

  /*
   * Keep a mutable reference to the current surah so async callbacks can
   * always resolve the latest ayah without forcing the hook to re-subscribe.
   */
  useEffect(() => {
    surahRef.current = surah;
  }, [surah]);

  const {
    currentTime,
    duration,
    surahElapsedTime,
    surahTotalTime,
    seek,
  } = useQuranAudioProgress({ audioRef, surah, activeAyahNumber, reciterId });

  const findAyah = useCallback(
    (numberInSurah) =>
      surahRef.current?.ayahs.find((a) => a.numberInSurah === numberInSurah) ??
      null,
    [],
  );

  /*
   * updateNowPlaying syncs the current ayah and reciter with native media controls
   * and the Android foreground notification.
   */
  const updateNowPlaying = useCallback((ayah, playing) => {
    if (!surahRef.current) return;
    const reciterName =
      RECITERS.find((r) => r.id === reciterIdRef.current)?.name ??
      RECITERS[0].name;
    updateMediaSessionNowPlaying({
      surahName: surahRef.current.englishName,
      ayahNumber: ayah.numberInSurah,
      reciterName,
      playing,
    });
    syncForeground(surahRef.current.englishName, reciterName);
  }, [syncForeground]);

  /* Start playback for a selected ayah and optionally keep auto-advancing. */
  const play = useCallback(
    (ayah, chain = false) => {
      pendingReciterRestartRef.current = false;
      pendingBismillahAyahRef.current = null;
      isStoppingRef.current = false;
      const audio = audioRef.current;
      // Always read the latest reciter from the ref so a mid-flight
      // changeReciter cannot leave us with a stale URL.
      audio.src = buildAudioUrl(ayah.number, reciterIdRef.current);
      audio.play().catch(() => {});
      setActiveAyahNumber(ayah.numberInSurah);
      setIsPlaying(true);
      setAutoAdvance(chain);
      updateNowPlaying(ayah, true);
    },
    [updateNowPlaying],
  );

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const playWithOpeningBismillah = useCallback((ayah) => {
    pendingBismillahAyahRef.current = ayah;
    isStoppingRef.current = false;
    const audio = audioRef.current;
    audio.src = buildAudioUrl(1, reciterIdRef.current);
    audio.play().catch(() => {});
    setActiveAyahNumber(ayah.numberInSurah);
    setIsPlaying(true);
    setAutoAdvance(true);
    updateNowPlaying(ayah, true);
  }, [updateNowPlaying]);

  /*
   * Some reciters 404 at the default bitrate on the CDN. If the currently
   * loaded ayah fails, step down through the bitrate list, remember the one
   * that actually works for this reciter, and retry.
   */
  useEffect(() => {
    const audio = audioRef.current;
    const handleError = () => {
      if (!audio.src) return;
      const match = audio.src.match(/\/audio\/(\d+)\//);
      const currentBitrate = match ? Number(match[1]) : null;
      const fallback = currentBitrate ? nextAudioBitrate(currentBitrate) : null;
      if (!fallback) {
        console.warn(
          "[quranAudio] no working bitrate found for",
          reciterIdRef.current,
        );
        return;
      }
      const ayah = pendingBismillahAyahRef.current ?? findAyah(activeAyahNumberRef.current);
      if (!ayah) return;
      console.warn(
        `[quranAudio] ${reciterIdRef.current} failed at ${currentBitrate}kbps, trying ${fallback}kbps`,
      );
      setReciterBitrate(reciterIdRef.current, fallback);
      const audioAyahNumber = pendingBismillahAyahRef.current ? 1 : ayah.number;
      audio.src = buildAudioUrl(audioAyahNumber, reciterIdRef.current, fallback);
      if (isPlayingRef.current) audio.play().catch(() => {});
    };
    audio.addEventListener("error", handleError);
    return () => audio.removeEventListener("error", handleError);
  }, [findAyah]);

  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
    // autoAdvance is intentionally left alone — pausing (in-app button OR the
    // OS media notification) must never cancel "Play Surah" chaining. resume()
    // needs to pick the chain back up. Only stop() or picking a different
    // ayah should end chaining.
    setActiveAyahNumber((current) => {
      const ayah = findAyah(current);
      if (ayah) updateNowPlaying(ayah, false);
      return current;
    });
  }, [findAyah, updateNowPlaying]);

  /* Resume the currently loaded ayah without changing the selected track. */
  const resume = useCallback(() => {
    if (pendingReciterRestartRef.current) {
      pendingReciterRestartRef.current = false;
      if (autoAdvanceRef.current) {
        playSurahFromStartRef.current();
      } else {
        setActiveAyahNumber((current) => {
          const ayah = findAyah(current);
          if (ayah) playRef.current(ayah, false);
          return current;
        });
      }
      return;
    }
    setActiveAyahNumber((current) => {
      const ayah = findAyah(current);
      if (ayah) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
        updateNowPlaying(ayah, true);
      }
      return current;
    });
  }, [findAyah, updateNowPlaying]);

  /* Stop playback completely and clear the active ayah state. */
  const stop = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    pendingBismillahAyahRef.current = null;

    const audio = audioRef.current;
    audio.pause();
    // Let Android WebView finish dispatching ended before releasing its source.
    setTimeout(() => {
      if (isStoppingRef.current && audio.paused) audio.removeAttribute("src");
    }, 0);
    setIsPlaying(false);
    setAutoAdvance(false);
    setActiveAyahNumber(null);
    updateMediaSessionPlaybackState("none");
    stopForeground();
  }, [stopForeground]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  /*
   * Toggle playback for a single ayah: pause/resume if currently selected,
   * or start a new ayah if a different one is chosen.
   */
  const toggleAyah = useCallback(
    (ayah) => {
      if (activeAyahNumber === ayah.numberInSurah) {
        if (isPlaying) pause();
        else resume();
      } else {
        play(ayah);
      }
    },
    [activeAyahNumber, isPlaying, pause, resume, play],
  );

  /* Start playback from the first ayah of the current surah and keep auto-advancing. */
  const playSurahFromStart = useCallback(() => {
    const first = surahRef.current?.ayahs.find((ayah) => ayah.numberInSurah === 1);
    const currentSurah = surahRef.current;
    if (!first || !currentSurah) return;
    if (!shouldPlayOpeningBismillah(currentSurah.number, first.numberInSurah)) {
      play(first, true);
      return;
    }

    playWithOpeningBismillah(first);
  }, [play, playWithOpeningBismillah]);

  useEffect(() => {
    playSurahFromStartRef.current = playSurahFromStart;
  }, [playSurahFromStart]);

  const changeReciter = useCallback((id) => {
    saveReciter(id);
    setReciterId(id);
    // Peek at activeAyahNumber via the functional form so this doesn't
    // need to depend on (and be recreated by) that state directly.
    setActiveAyahNumber((current) => {
      if (current !== null) pendingReciterRestartRef.current = true;
      return current;
    });
  }, []);

  /* Advance to the next or previous ayah relative to the currently active one. */
  const advance = useCallback(
    (direction) => {
      setActiveAyahNumber((current) => {
        const next = findAyah((current ?? 0) + direction);
        if (next) playRef.current(next, autoAdvanceRef.current);
        return current;
      });
    },
    [findAyah],
  );

  useMediaSession({ resume, pause, advance, stop });

  /*
   * Single "ended" handler. Uses refs so it always sees the latest values
   * and is never re-subscribed on every ayah change (which previously left
   * two listeners racing when a Surah finished).
   */
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      if (isStoppingRef.current) return;
      const pendingBismillahAyah = pendingBismillahAyahRef.current;
      if (pendingBismillahAyah) {
        pendingBismillahAyahRef.current = null;
        playRef.current(pendingBismillahAyah, true);
        return;
      }
      if (!autoAdvanceRef.current) {
        stopRef.current();
        return;
      }
      const next = findAyah((activeAyahNumberRef.current ?? 0) + 1);
      if (next) playRef.current(next, true);
      else stopRef.current();
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [findAyah]);

  /*
   * Seek to a position within the whole surah rather than just the
   * currently loaded ayah's audio file. Ayahs are separate audio files
   * fetched lazily, so we don't know each one's real duration up front —
   * each ayah is treated as an equal-width slice of the bar instead.
   */
  const seekToSurahFraction = useCallback(
    (fraction) => {
      const ayahs = surahRef.current?.ayahs;
      if (!ayahs || ayahs.length === 0) return;

      const clampedFraction = Math.max(0, Math.min(fraction, 1));
      const raw = clampedFraction * ayahs.length;
      const index = Math.min(ayahs.length - 1, Math.floor(raw));
      const withinAyah = raw - index;
      const targetAyah = ayahs[index];
      if (!targetAyah) return;

      const audio = audioRef.current;

      if (targetAyah.numberInSurah === activeAyahNumberRef.current) {
        seek(withinAyah * (audio.duration || 0));
        return;
      }

      const wasPlaying = isPlayingRef.current;
      pendingBismillahAyahRef.current = null;
      pendingReciterRestartRef.current = false;

      const onLoaded = () => {
        audio.removeEventListener("loadedmetadata", onLoaded);
        const targetTime = withinAyah * (audio.duration || 0);
        audio.currentTime = targetTime;
        seek(targetTime);
      };
      audio.addEventListener("loadedmetadata", onLoaded);

      audio.src = buildAudioUrl(targetAyah.number, reciterIdRef.current);
      if (wasPlaying) audio.play().catch(() => {});
      setActiveAyahNumber(targetAyah.numberInSurah);
      setIsPlaying(wasPlaying);
      updateNowPlaying(targetAyah, wasPlaying);
    },
    [seek, updateNowPlaying],
  );

  /*
   * Reset playback whenever the surah changes; fully stop on unmount.
   */
  useEffect(() => {
    stop();
  }, [surah?.number]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stop(), [stop]);

  /* Popup actions — expose both play modes to UI. */
  const playAyahOnly = useCallback((ayah) => play(ayah, false), [play]);
  const playAyahFromHere = useCallback((ayah) => {
    const currentSurah = surahRef.current;
    if (
      currentSurah &&
      shouldPlayOpeningBismillah(currentSurah.number, ayah.numberInSurah)
    ) {
      playWithOpeningBismillah(ayah);
      return;
    }
    play(ayah, true);
  }, [play, playWithOpeningBismillah]);

  /* return object — expose it to the UI */
  return {
    activeAyahNumber,
    isPlaying,
    autoAdvance,
    reciterId,
    changeReciter,
    pause,
    resume,
    toggleAyah,
    playSurahFromStart,
    nextAyah: () => advance(1),
    prevAyah: () => advance(-1),
    playAyahOnly,
    playAyahFromHere,
    currentTime,
    duration,
    surahElapsedTime,
    surahTotalTime,
    seek,
    seekToSurahFraction,
    stop,
  };
}