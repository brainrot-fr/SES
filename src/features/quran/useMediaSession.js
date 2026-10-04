import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { MediaSession } from "@capgo/capacitor-media-session";

const isNative = () => Capacitor.isNativePlatform();

export function updateMediaSessionNowPlaying({ surahName, ayahNumber, reciterName, playing }) {
  if (!isNative()) return;
  const label = `${surahName} — Ayah ${ayahNumber}`;
  MediaSession.setMetadata({
    title: label,
    artist: reciterName,
    album: surahName,
  }).catch(() => {});
  MediaSession.setPlaybackState({
    playbackState: playing ? "playing" : "paused",
  }).catch(() => {});
}

export function updateMediaSessionPlaybackState(playbackState) {
  if (!isNative()) return;
  MediaSession.setPlaybackState({ playbackState }).catch(() => {});
}

export function useMediaSession({ resume, pause, advance, stop }) {
  useEffect(() => {
    if (!isNative()) return undefined;
    MediaSession.setActionHandler({ action: "play" }, resume).catch(() => {});
    MediaSession.setActionHandler({ action: "pause" }, pause).catch(() => {});
    MediaSession.setActionHandler({ action: "nexttrack" }, () => advance(1)).catch(() => {});
    MediaSession.setActionHandler({ action: "previoustrack" }, () => advance(-1)).catch(() => {});
    MediaSession.setActionHandler({ action: "stop" }, stop).catch(() => {});
    return () => {
      ["play", "pause", "nexttrack", "previoustrack", "stop"].forEach((action) => {
        MediaSession.setActionHandler({ action }, null).catch(() => {});
      });
    };
  }, [resume, pause, advance, stop]);
}
