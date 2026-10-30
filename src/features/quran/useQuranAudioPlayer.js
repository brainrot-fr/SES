/**
 * useQuranAudioPlayer.js
 * Custom hook that manages Quran audio playback.
 *
 * - Builds audio URLs for the selected reciter.
 * - Controls play/pause/resume/stop logic.
 * - Integrates with native media session and Android foreground service.
 */

import { useRef, useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { Capacitor } from "@capacitor/core";
import { MediaSession } from "@capgo/capacitor-media-session";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";
import {
  RECITERS,
  buildAudioUrl,
  getSavedReciter,
  saveReciter,
  setReciterBitrate,
  nextAudioBitrate,
  fetchSurahAudioDuration,
} from "@/features/quran/quranData";
import { findAyahAtElapsedTime, shouldPlayOpeningBismillah } from "@/features/quran/quranPlayback";

const FG_NOTIFICATION_ID = 5501;
const FG_CHANNEL_ID = "quran-playback-v2";
const FALLBACK_AYAH_SECONDS = 5;

const isNative = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === "android";

let channelReady = false;
let foregroundServiceStarted = false;
let foregroundServiceQueue = Promise.resolve();
let lastForegroundKey = "";

function playbackReducer(state, action) {
  switch (action.type) {
    case "LOAD":
      return {
        ...state,
        status: action.status ?? "loading",
        activeAyahNumber: action.activeAyahNumber ?? state.activeAyahNumber,
        autoAdvance: action.autoAdvance ?? state.autoAdvance,
      };
    case "PLAYING":
      return { ...state, status: action.bismillah ? "bismillah" : "playing" };
    case "PAUSE":
      return { ...state, status: state.activeAyahNumber == null ? "idle" : "paused" };
    case "STOP":
      return { ...state, status: "idle", activeAyahNumber: null, autoAdvance: false };
    case "RECITER":
      return { ...state, reciterId: action.reciterId };
    default:
      return state;
  }
}

function enqueueForegroundOperation(operation) {
  const result = foregroundServiceQueue.then(operation, operation);
  foregroundServiceQueue = result.catch(() => {});
  return result;
}

/*
 * Ensure the Android foreground service channel exists before starting playback.
 * This is a one-time setup step required for ongoing audio notifications.
 */

async function ensureForegroundChannel() {
  if (!isAndroid() || channelReady) return;
  try {
    if (typeof ForegroundService.deleteNotificationChannel === "function") {
      ForegroundService.deleteNotificationChannel({ id: "quran-playback" }).catch(() => {});
    }
    await ForegroundService.createNotificationChannel({
      id: FG_CHANNEL_ID,
      name: "Quran playback",
      description: "Shown while Quran audio is playing",
      importance: 2,
    });
    channelReady = true;
  } catch (err) {
    console.warn("[quranAudio] createNotificationChannel failed", err);
  }
}

async function startForeground(title, body) {
  await ensureForegroundChannel();
  await ForegroundService.startForegroundService({
    id: FG_NOTIFICATION_ID,
    title,
    body,
    smallIcon: "ic_quran_notification",
    notificationChannelId: FG_CHANNEL_ID,
    silent: true,
  });
  foregroundServiceStarted = true;
}

/* Keep the foreground service notification updated when playback changes. */
async function updateForeground(title, body) {
  if (!isAndroid()) return;
  return enqueueForegroundOperation(async () => {
    try {
      if (!foregroundServiceStarted) {
        await startForeground(title, body);
        return;
      }
      await ForegroundService.updateForegroundService({
        id: FG_NOTIFICATION_ID,
        title,
        body,
        smallIcon: "ic_quran_notification",
      });
    } catch (err) {
      foregroundServiceStarted = false;
      console.warn("[quranAudio] foreground service update failed", err);
    }
  });
}

function syncForeground(surahName, reciterName) {
  const key = `${surahName}|${reciterName}`;
  if (key === lastForegroundKey) return;
  lastForegroundKey = key;
  updateForeground(surahName, reciterName);
}

/* Stop the Android foreground service when playback ends or is stopped. */
async function stopForeground() {
  if (!isAndroid()) {
    lastForegroundKey = "";
    return;
  }
  return enqueueForegroundOperation(async () => {
    try {
      if (foregroundServiceStarted) {
        await ForegroundService.stopForegroundService();
      }
    } catch {
      /* already stopped — fine */
    } finally {
      foregroundServiceStarted = false;
      lastForegroundKey = "";
    }
  });
}

export function useQuranAudioPlayer(surah) {
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = new Audio();
  }

  const [playback, dispatch] = useReducer(playbackReducer, null, () => ({
    status: "idle",
    activeAyahNumber: null,
    autoAdvance: false,
    reciterId: getSavedReciter(),
  }));
  const { activeAyahNumber, autoAdvance, reciterId } = playback;
  const isPlaying = playback.status === "loading"
    || playback.status === "playing"
    || playback.status === "bismillah";

  const activeAyahNumberRef = useRef(activeAyahNumber);
  const isPlayingRef = useRef(isPlaying);
  const autoAdvanceRef = useRef(autoAdvance);
  const reciterIdRef = useRef(reciterId);
  const pendingBismillahAyahRef = useRef(null);
  const pendingSeekFractionRef = useRef(null);

  const pendingReciterRestartRef = useRef(false);
  const isStoppingRef = useRef(false);
  const playRef = useRef(() => {});
  const playSurahFromStartRef = useRef(() => {});
  const stopRef = useRef(() => {});

  useEffect(() => {
    activeAyahNumberRef.current = activeAyahNumber;
    isPlayingRef.current = isPlaying;
    autoAdvanceRef.current = autoAdvance;
    reciterIdRef.current = reciterId;
  }, [activeAyahNumber, autoAdvance, isPlaying, reciterId]);

  const surahRef = useRef(surah);

  /*
   * Keep a mutable reference to the current surah so async callbacks can
   * always resolve the latest ayah without forcing the hook to re-subscribe.
   */
  useEffect(() => {
    surahRef.current = surah;
  }, [surah]);

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
    if (!isNative() || !surahRef.current) return;
    const label = `${surahRef.current.englishName} — Ayah ${ayah.numberInSurah}`;
    const reciterName =
      RECITERS.find((r) => r.id === reciterIdRef.current)?.name ??
      RECITERS[0].name;
    MediaSession.setMetadata({
      title: label,
      artist: reciterName,
      album: surahRef.current.englishName,
    }).catch(() => {});
    MediaSession.setPlaybackState({
      playbackState: playing ? "playing" : "paused",
    }).catch(() => {});
    syncForeground(surahRef.current.englishName, reciterName);
  }, []);

  /* Start playback for a selected ayah and optionally keep auto-advancing. */
  const play = useCallback(
    (ayah, chain = false) => {
      pendingReciterRestartRef.current = false;
      pendingBismillahAyahRef.current = null;
      pendingSeekFractionRef.current = null;
      isStoppingRef.current = false;
      const audio = audioRef.current;
      // Always read the latest reciter from the ref so a mid-flight
      // changeReciter cannot leave us with a stale URL.
      audio.src = buildAudioUrl(ayah.number, reciterIdRef.current);
      audio.play().catch(() => {});
      dispatch({
        type: "LOAD",
        activeAyahNumber: ayah.numberInSurah,
        autoAdvance: chain,
      });
      updateNowPlaying(ayah, true);
    },
    [updateNowPlaying],
  );

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const playWithOpeningBismillah = useCallback((ayah) => {
    pendingBismillahAyahRef.current = ayah;
    pendingSeekFractionRef.current = null;
    isStoppingRef.current = false;
    const audio = audioRef.current;
    audio.src = buildAudioUrl(1, reciterIdRef.current);
    audio.play().catch(() => {});
    dispatch({
      type: "LOAD",
      activeAyahNumber: ayah.numberInSurah,
      autoAdvance: true,
      status: "bismillah",
    });
    updateNowPlaying(ayah, true);
  }, [updateNowPlaying]);

  /*
   * Some reciters 404 at the default bitrate on the CDN. If the currently
   * loaded ayah fails, step down through the bitrate list, remember the one
   * that actually works for this reciter, and retry.
   */
  const pause = useCallback(() => {
    audioRef.current.pause();
    // autoAdvance is intentionally left alone — pausing (in-app button OR the
    // OS media notification) must never cancel "Play Surah" chaining. resume()
    // needs to pick the chain back up. Only stop() or picking a different
    // ayah should end chaining.
    dispatch({ type: "PAUSE" });
    const ayah = findAyah(activeAyahNumberRef.current);
    if (ayah) updateNowPlaying(ayah, false);
  }, [findAyah, updateNowPlaying]);

  /* Resume the currently loaded ayah without changing the selected track. */
  const resume = useCallback(() => {
    if (pendingReciterRestartRef.current) {
      pendingReciterRestartRef.current = false;
      if (autoAdvanceRef.current) {
        playSurahFromStartRef.current();
      } else {
        const ayah = findAyah(activeAyahNumberRef.current);
        if (ayah) playRef.current(ayah, false);
      }
      return;
    }
    const ayah = findAyah(activeAyahNumberRef.current);
    if (ayah) {
      dispatch({ type: "LOAD" });
      audioRef.current.play().catch(() => {});
      updateNowPlaying(ayah, true);
    }
  }, [findAyah, updateNowPlaying]);

  /* Stop playback completely and clear the active ayah state. */
  const stop = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    pendingBismillahAyahRef.current = null;
    pendingSeekFractionRef.current = null;

    const audio = audioRef.current;
    audio.pause();
    // Let Android WebView finish dispatching ended before releasing its source.
    setTimeout(() => {
      if (isStoppingRef.current && audio.paused) audio.removeAttribute("src");
    }, 0);
    dispatch({ type: "STOP" });
    if (isNative()) {
      MediaSession.setPlaybackState({ playbackState: "none" }).catch(() => {});
    }
    stopForeground();
  }, []);

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
    dispatch({ type: "RECITER", reciterId: id });
    if (activeAyahNumberRef.current !== null) pendingReciterRestartRef.current = true;
  }, []);

  /* Advance to the next or previous ayah relative to the currently active one. */
  const advance = useCallback(
    (direction) => {
      const next = findAyah((activeAyahNumberRef.current ?? 0) + direction);
      if (next) playRef.current(next, autoAdvanceRef.current);
    },
    [findAyah],
  );

  /*
   * Playback position for the progress bar. Reset on ayah change so the
   * bar doesn't flash the previous ayah's position while the new one loads
   * — though in practice setting audio.src already resets currentTime,
   * this just avoids a one-frame stale read.
   */
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [indexedSurahDuration, setIndexedSurahDuration] = useState(null);

  const [ayahDurations, setAyahDurations] = useState({});

  useEffect(() => {
    setAyahDurations({});
  }, [surah?.number, reciterId]);

  const activeAyah = findAyah(activeAyahNumber);
  const audioMetadataMatchesActiveAyah =
    activeAyah != null &&
    audioRef.current.currentSrc.endsWith(
      `/${reciterId}/${activeAyah.number}.mp3`,
    );

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      const fraction = pendingSeekFractionRef.current;
      if (fraction === null || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      pendingSeekFractionRef.current = null;
      const targetTime = fraction * audio.duration;
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    };
    const handleError = () => {
      if (!audio.src) return;
      const match = audio.src.match(/\/audio\/(\d+)\//);
      const currentBitrate = match ? Number(match[1]) : null;
      const fallback = currentBitrate ? nextAudioBitrate(currentBitrate) : null;
      if (!fallback) {
        console.warn("[quranAudio] no working bitrate found for", reciterIdRef.current);
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
    const handlePlaying = () => {
      dispatch({ type: "PLAYING", bismillah: Boolean(pendingBismillahAyahRef.current) });
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("playing", handlePlaying);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("playing", handlePlaying);
    };
  }, [findAyah]);

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
  }, [activeAyahNumber, duration, audioMetadataMatchesActiveAyah]);

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

  // Before an index is generated, use a fixed average instead of letting
  // whichever ayah happens to load first change the displayed surah length.
  const ayahCount = surah?.ayahs?.length ?? 0;
  const durationKey = `${surah?.number ?? ''}:${reciterId}`;
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
  }, []);

  /* Seek across cumulative indexed or estimated ayah durations. */
  const seekToSurahFraction = useCallback(
    (fraction) => {
      const ayahs = surahRef.current?.ayahs;
      if (!ayahs || ayahs.length === 0) return;
      const requestedFraction = Number.isFinite(fraction) ? fraction : 0;
      const clampedFraction = Math.max(0, Math.min(requestedFraction, 1));
      const durations = ayahs.map((ayah) =>
        ayahDurations[ayah.numberInSurah] ?? estimatedAyahDuration,
      );
      const estimatedTotal = durations.reduce((total, duration) => total + duration, 0);
      const durationScale = estimatedTotal > 0 ? surahTotalTime / estimatedTotal : 1;
      const scaledDurations = durations.map((duration) => duration * durationScale);
      const target = findAyahAtElapsedTime(scaledDurations, clampedFraction * surahTotalTime);
      if (!target) return;
      const targetAyah = ayahs[target.index];
      if (!targetAyah) return;
      const withinAyah = target.duration > 0 ? target.offset / target.duration : 0;

      const audio = audioRef.current;

      if (targetAyah.numberInSurah === activeAyahNumberRef.current) {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          seek(withinAyah * audio.duration);
        } else {
          pendingSeekFractionRef.current = withinAyah;
        }
        return;
      }

      const wasPlaying = isPlayingRef.current;
      pendingBismillahAyahRef.current = null;
      pendingReciterRestartRef.current = false;

      pendingSeekFractionRef.current = withinAyah;
      audio.src = buildAudioUrl(targetAyah.number, reciterIdRef.current);
      if (wasPlaying) audio.play().catch(() => {});
      dispatch({
        type: "LOAD",
        activeAyahNumber: targetAyah.numberInSurah,
        status: wasPlaying ? "loading" : "paused",
      });
      updateNowPlaying(targetAyah, wasPlaying);
    },
    [ayahDurations, estimatedAyahDuration, seek, surahTotalTime, updateNowPlaying],
  );

  /*
   * Bind native media session action handlers for lock-screen controls.
   */
  useEffect(() => {
    if (!isNative()) return undefined;
    MediaSession.setActionHandler({ action: "play" }, resume).catch(() => {});
    MediaSession.setActionHandler({ action: "pause" }, pause).catch(() => {});
    MediaSession.setActionHandler({ action: "nexttrack" }, () =>
      advance(1),
    ).catch(() => {});
    MediaSession.setActionHandler({ action: "previoustrack" }, () =>
      advance(-1),
    ).catch(() => {});
    MediaSession.setActionHandler({ action: "stop" }, stop).catch(() => {});
    return () => {
      ["play", "pause", "nexttrack", "previoustrack", "stop"].forEach(
        (action) => {
          MediaSession.setActionHandler({ action }, null).catch(() => {});
        },
      );
    };
  }, [resume, pause, advance, stop]);

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