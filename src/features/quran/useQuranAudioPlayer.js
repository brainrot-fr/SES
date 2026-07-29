/**
 * useQuranAudioPlayer.js
 * Custom hook that manages Quran audio playback.
 *
 * - Builds audio URLs for the selected reciter.
 * - Controls play/pause/resume/stop logic.
 * - Integrates with native media session and Android foreground service.
 */

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
} from "./quranApi";

const FG_NOTIFICATION_ID = 5501;
const FG_CHANNEL_ID = "quran-playback";

const isNative = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === "android";

let channelReady = false;

/*
 * Ensure the Android foreground service channel exists before starting playback.
 * This is a one-time setup step required for ongoing audio notifications.
 */

async function ensureForegroundChannel() {
  if (!isAndroid() || channelReady) return;
  try {
    await ForegroundService.createNotificationChannel({
      id: FG_CHANNEL_ID,
      name: "Quran playback",
      description: "Shown while Quran audio is playing",
      importance: 3,
    });
    channelReady = true;
  } catch (err) {
    console.warn("[quranAudio] createNotificationChannel failed", err);
  }
}

async function startForeground(title, body) {
  if (!isAndroid()) return;
  try {
    await ensureForegroundChannel();
    await ForegroundService.startForegroundService({
      id: FG_NOTIFICATION_ID,
      title,
      body,
      smallIcon: "ic_stat_icon_config_sample", // Capacitor's default bundled icon — swap for your own later
      notificationChannelId: FG_CHANNEL_ID,
      silent: true,
    });
  } catch (err) {
    console.warn("[quranAudio] startForegroundService failed", err);
  }
}

/* Keep the foreground service notification updated when playback changes. */
async function updateForeground(title, body) {
  if (!isAndroid()) return;
  try {
    await ForegroundService.updateForegroundService({
      id: FG_NOTIFICATION_ID,
      title,
      body,
      smallIcon: "ic_stat_icon_config_sample",
    });
  } catch {
    await startForeground(title, body);
  }
}

/* Stop the Android foreground service when playback ends or is stopped. */
async function stopForeground() {
  if (!isAndroid()) return;
  try {
    await ForegroundService.stopForegroundService();
  } catch {
    /* already stopped — fine */
  }
}

export function useQuranAudioPlayer(surah) {
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

  const pendingReciterRestartRef = useRef(false);
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
    updateForeground(label, playing ? "Playing" : "Paused");
  }, []);

  /* Start playback for a selected ayah and optionally keep auto-advancing. */
  const play = useCallback(
    (ayah, chain = false) => {
      pendingReciterRestartRef.current = false;
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
      const ayah = findAyah(activeAyahNumberRef.current);
      if (!ayah) return;
      console.warn(
        `[quranAudio] ${reciterIdRef.current} failed at ${currentBitrate}kbps, trying ${fallback}kbps`,
      );
      setReciterBitrate(reciterIdRef.current, fallback);
      audio.src = buildAudioUrl(ayah.number, reciterIdRef.current, fallback);
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
    const audio = audioRef.current;
    audio.pause();
    // Drop the old resource so late network / ended / error events cannot
    // fire against a stale surah or activeAyahNumber. Do NOT call load() —
    // on Android WebView that itself can re-emit error/ended and re-enter
    // the handlers while we are already tearing down.
    if (audio.src) {
      audio.removeAttribute("src");
    }
    setIsPlaying(false);
    setAutoAdvance(false);
    setActiveAyahNumber(null);
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
    const first = surahRef.current?.ayahs[0];
    if (first) play(first, true);
  }, [play]);

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

  /*
   * Single "ended" handler. Uses refs so it always sees the latest values
   * and is never re-subscribed on every ayah change (which previously left
   * two listeners racing when a Surah finished).
   */
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
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
   * Playback position for the progress bar. Reset on ayah change so the
   * bar doesn't flash the previous ayah's position while the new one loads
   * — though in practice setting audio.src already resets currentTime,
   * this just avoids a one-frame stale read.
   */
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
  }, []);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [activeAyahNumber]);

  /*
   * Each ayah is a separate audio file fetched on demand, so the true
   * length of the whole surah isn't known upfront (see quranApi.js — we
   * deliberately avoid prefetching a surah's audio just to read duration).
   * Instead, remember each ayah's duration as it's discovered during
   * normal playback (no extra network cost) and use the running average
   * to estimate ayahs that haven't loaded yet. The surah-wide elapsed/
   * total time gets more accurate the further you listen.
   */
  const [ayahDurations, setAyahDurations] = useState({});

  useEffect(() => {
    setAyahDurations({});
  }, [surah?.number, reciterId]);

  useEffect(() => {
    if (activeAyahNumber == null || !duration) return;
    setAyahDurations((prev) =>
      prev[activeAyahNumber] === duration
        ? prev
        : { ...prev, [activeAyahNumber]: duration },
    );
  }, [activeAyahNumber, duration]);

  const averageKnownDuration = useMemo(() => {
    const known = Object.values(ayahDurations);
    if (known.length)
      return known.reduce((sum, d) => sum + d, 0) / known.length;
    return duration || 0;
  }, [ayahDurations, duration]);

  const surahTotalTime = useMemo(() => {
    const count = surah?.ayahs?.length ?? 0;
    if (!count) return 0;
    let total = 0;
    for (let n = 1; n <= count; n += 1) {
      total += ayahDurations[n] ?? averageKnownDuration;
    }
    return total;
  }, [surah, ayahDurations, averageKnownDuration]);

  const surahElapsedTime = useMemo(() => {
    if (activeAyahNumber == null) return 0;
    let total = currentTime;
    for (let n = 1; n < activeAyahNumber; n += 1) {
      total += ayahDurations[n] ?? averageKnownDuration;
    }
    return total;
  }, [activeAyahNumber, currentTime, ayahDurations, averageKnownDuration]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    const clamped = Math.max(0, Math.min(time, audio.duration));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

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
      pendingReciterRestartRef.current = false;

      const onLoaded = () => {
        audio.removeEventListener("loadedmetadata", onLoaded);
        const targetTime = withinAyah * (audio.duration || 0);
        audio.currentTime = targetTime;
        setCurrentTime(targetTime);
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
  const playAyahFromHere = useCallback((ayah) => play(ayah, true), [play]);

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