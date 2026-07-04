/**
 * useQuranAudioPlayer.js
 * Custom hook that manages Quran audio playback.
 *
 * - Builds audio URLs for the selected reciter.
 * - Controls play/pause/resume/stop logic.
 * - Integrates with native media session and Android foreground service.
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { RECITERS, buildAudioUrl, getSavedReciter, saveReciter } from './quranApi';

const FG_NOTIFICATION_ID = 5501;
const FG_CHANNEL_ID = 'quran-playback';

const isNative = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === 'android';

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
      name: 'Quran playback',
      description: 'Shown while Quran audio is playing',
      importance: 3,
    });
    channelReady = true;
  } catch (err) {
    console.warn('[quranAudio] createNotificationChannel failed', err);
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
      smallIcon: 'ic_stat_icon_config_sample', // Capacitor's default bundled icon — swap for your own later
      notificationChannelId: FG_CHANNEL_ID,
      silent: true,
    });
  } catch (err) {
    console.warn('[quranAudio] startForegroundService failed', err);
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
      smallIcon: 'ic_stat_icon_config_sample',
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

  const changeReciter = useCallback((id) => {
    saveReciter(id);
    setReciterId(id);
  }, []);

  const surahRef = useRef(surah);

  /*
   * Keep a mutable reference to the current surah so async callbacks can
   * always resolve the latest ayah without forcing the hook to re-subscribe.
   */
  useEffect(() => { surahRef.current = surah; }, [surah]);

  const findAyah = useCallback(
    (numberInSurah) => surahRef.current?.ayahs.find((a) => a.numberInSurah === numberInSurah) ?? null,
    []
  );

  /*
   * updateNowPlaying syncs the current ayah and reciter with native media controls
   * and the Android foreground notification.
   */
  const updateNowPlaying = useCallback((ayah, playing) => {
    if (!isNative() || !surahRef.current) return;
    const label = `${surahRef.current.englishName} — Ayah ${ayah.numberInSurah}`;
    const reciterName = RECITERS.find((r) => r.id === reciterId)?.name ?? RECITERS[0].name;
    MediaSession.setMetadata({ title: label, artist: reciterName, album: surahRef.current.englishName }).catch(() => { });
    MediaSession.setPlaybackState({ playbackState: playing ? 'playing' : 'paused' }).catch(() => { });
    updateForeground(label, playing ? 'Playing' : 'Paused');
  }, [reciterId]);

  /* Start playback for a selected ayah and optionally keep auto-advancing. */
  const play = useCallback((ayah, chain = false) => {
    const audio = audioRef.current;
    audio.src = buildAudioUrl(ayah.number, reciterId);
    audio.play().catch(() => { });
    setActiveAyahNumber(ayah.numberInSurah);
    setIsPlaying(true);
    setAutoAdvance(chain);
    updateNowPlaying(ayah, true);
  }, [reciterId, updateNowPlaying]);

  const pause = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
    setAutoAdvance(false); // manual pause always exits "Play Surah" chaining
    setActiveAyahNumber((current) => {
      const ayah = findAyah(current);
      if (ayah) updateNowPlaying(ayah, false);
      return current;
    });
  }, [findAyah, updateNowPlaying]);

  /* Resume the currently loaded ayah without changing the selected track. */
  const resume = useCallback(() => {
    setActiveAyahNumber((current) => {
      const ayah = findAyah(current);
      if (ayah) {
        audioRef.current.play().catch(() => { });
        setIsPlaying(true);
        updateNowPlaying(ayah, true);
      }
      return current;
    });
  }, [findAyah, updateNowPlaying]);

  /* Stop playback completely and clear the active ayah state. */
  const stop = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
    setAutoAdvance(false);
    setActiveAyahNumber(null);
    if (isNative()) {
      MediaSession.setPlaybackState({ playbackState: 'none' }).catch(() => { });
    }
    stopForeground();
  }, []);

  /*
   * Toggle playback for a single ayah: pause/resume if currently selected,
   * or start a new ayah if a different one is chosen.
   */
  const toggleAyah = useCallback((ayah) => {
    if (activeAyahNumber === ayah.numberInSurah) {
      if (isPlaying) pause();
      else resume();
    } else {
      play(ayah);
    }
  }, [activeAyahNumber, isPlaying, pause, resume, play]);

  /* Start playback from the first ayah of the current surah and keep auto-advancing. */
  const playSurahFromStart = useCallback(() => {
    const first = surahRef.current?.ayahs[0];
    if (first) play(first, true);
  }, [play]);

  /* Advance to the next or previous ayah relative to the currently active one. */
  const advance = useCallback((direction) => {
    setActiveAyahNumber((current) => {
      const next = findAyah((current ?? 0) + direction);
      if (next) play(next, autoAdvance);
      return current;
    });
  }, [autoAdvance, findAyah, play]);

  /*
   * Native audio "ended" event handler. When in auto-advance mode, move to the next ayah.
   * Otherwise, stop playback and clear the active state.
   */
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      if (!autoAdvance) { stop(); return; }
      const next = findAyah((activeAyahNumber ?? 0) + 1);
      if (next) play(next, true);
      else stop();
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [autoAdvance, activeAyahNumber, findAyah, play, stop]);

  /*
   * Bind native media session action handlers for lock-screen controls.
   */
  useEffect(() => {
    if (!isNative()) return undefined;
    MediaSession.setActionHandler({ action: 'play' }, resume).catch(() => { });
    MediaSession.setActionHandler({ action: 'pause' }, pause).catch(() => { });
    MediaSession.setActionHandler({ action: 'nexttrack' }, () => advance(1)).catch(() => { });
    MediaSession.setActionHandler({ action: 'previoustrack' }, () => advance(-1)).catch(() => { });
    MediaSession.setActionHandler({ action: 'stop' }, stop).catch(() => { });
    return () => {
      ['play', 'pause', 'nexttrack', 'previoustrack', 'stop'].forEach((action) => {
        MediaSession.setActionHandler({ action }, null).catch(() => { });
      });
    };
  }, [resume, pause, advance, stop]);

  /*
   * Reset playback whenever the surah changes; fully stop on unmount.
   */
  useEffect(() => { stop(); }, [surah?.number]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stop(), [stop]);

  /* return object — expose it to the UI */
  return {
    activeAyahNumber,
    isPlaying,
    autoAdvance,
    reciterId,
    changeReciter,
    toggleAyah,
    playSurahFromStart,
    stop,
  };
}