import { useRef, useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { MediaSession } from '@capgo/capacitor-media-session';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

const RECITER_NAME = 'Mishary Alafasy'; // matches AUDIO_EDITION in quranApi.js
const FG_NOTIFICATION_ID = 5501;
const FG_CHANNEL_ID = 'quran-playback';

const isNative = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === 'android';

let channelReady = false;
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

async function stopForeground() {
  if (!isAndroid()) return;
  try {
    await ForegroundService.stopForegroundService();
  } catch {
    // already stopped — fine
  }
}

export function useQuranAudioPlayer(surah) {
  const audioRef = useRef(null);
  if (audioRef.current === null) {
    audioRef.current = new Audio();
  }

  // Two separate pieces of state on purpose: which ayah is loaded, and
  // whether it's currently playing. Conflating these was the source of
  // the old pause/resume bug.
  const [activeAyahNumber, setActiveAyahNumber] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  const surahRef = useRef(surah);
  useEffect(() => { surahRef.current = surah; }, [surah]);

  const findAyah = useCallback(
    (numberInSurah) => surahRef.current?.ayahs.find((a) => a.numberInSurah === numberInSurah) ?? null,
    []
  );

  const updateNowPlaying = useCallback((ayah, playing) => {
    if (!isNative() || !surahRef.current) return;
    const label = `${surahRef.current.englishName} — Ayah ${ayah.numberInSurah}`;
    MediaSession.setMetadata({
      title: label,
      artist: RECITER_NAME,
      album: surahRef.current.englishName,
    }).catch(() => {});
    MediaSession.setPlaybackState({ playbackState: playing ? 'playing' : 'paused' }).catch(() => {});
    updateForeground(label, playing ? 'Playing' : 'Paused');
  }, []);

  const play = useCallback((ayah, chain = false) => {
    const audio = audioRef.current;
    audio.src = ayah.audioUrl;
    audio.play().catch(() => {});
    setActiveAyahNumber(ayah.numberInSurah);
    setIsPlaying(true);
    setAutoAdvance(chain);
    updateNowPlaying(ayah, true);
  }, [updateNowPlaying]);

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

  const resume = useCallback(() => {
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

  const stop = useCallback(() => {
    audioRef.current.pause();
    setIsPlaying(false);
    setAutoAdvance(false);
    setActiveAyahNumber(null);
    if (isNative()) {
      MediaSession.setPlaybackState({ playbackState: 'none' }).catch(() => {});
    }
    stopForeground();
  }, []);

  const toggleAyah = useCallback((ayah) => {
    setActiveAyahNumber((current) => current); // no-op to read latest via closure below
    if (activeAyahNumber === ayah.numberInSurah && isPlaying) pause();
    else play(ayah);
  }, [activeAyahNumber, isPlaying, pause, play]);

  const playSurahFromStart = useCallback(() => {
    const first = surahRef.current?.ayahs[0];
    if (first) play(first, true);
  }, [play]);

  const advance = useCallback((direction) => {
    setActiveAyahNumber((current) => {
      const next = findAyah((current ?? 0) + direction);
      if (next) play(next, autoAdvance);
      return current;
    });
  }, [autoAdvance, findAyah, play]);

  // Native audio "ended" -> auto-advance to the next ayah when chaining
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

  // Lock-screen / notification media controls
  useEffect(() => {
    if (!isNative()) return undefined;
    MediaSession.setActionHandler({ action: 'play' }, resume).catch(() => {});
    MediaSession.setActionHandler({ action: 'pause' }, pause).catch(() => {});
    MediaSession.setActionHandler({ action: 'nexttrack' }, () => advance(1)).catch(() => {});
    MediaSession.setActionHandler({ action: 'previoustrack' }, () => advance(-1)).catch(() => {});
    MediaSession.setActionHandler({ action: 'stop' }, stop).catch(() => {});
    return () => {
      ['play', 'pause', 'nexttrack', 'previoustrack', 'stop'].forEach((action) => {
        MediaSession.setActionHandler({ action }, null).catch(() => {});
      });
    };
  }, [resume, pause, advance, stop]);

  // Reset playback whenever the surah changes; fully stop on unmount
  useEffect(() => { stop(); }, [surah?.number]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stop(), [stop]);

  return {
    activeAyahNumber,
    isPlaying,
    autoAdvance,
    toggleAyah,
    playSurahFromStart,
    stop,
  };
}