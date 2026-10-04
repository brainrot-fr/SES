import { useMemo } from "react";
import { RECITERS } from "./quranReciters.js";
import { shouldPlayOpeningBismillah } from "./quranPlayback.js";

const AUDIO_CDN = "https://cdn.islamic.network/quran/audio";
const AUDIO_BITRATES = [192, 160, 128, 96, 64, 48, 32];
const RECITER_STORAGE_KEY = "ses-quran-reciter";
const RECITER_BITRATE_KEY = "ses-quran-reciter-bitrate-v2";

export function getSavedReciter() {
  const savedReciter = localStorage.getItem(RECITER_STORAGE_KEY);
  if (RECITERS.some((reciter) => reciter.id === savedReciter)) {
    return savedReciter;
  }
  return RECITERS[0].id;
}

export function saveReciter(id) {
  localStorage.setItem(RECITER_STORAGE_KEY, id);
}

export function buildAudioUrl(
  globalAyahNumber,
  reciterId = getSavedReciter(),
  bitrate = getReciterBitrate(reciterId),
) {
  return `${AUDIO_CDN}/${bitrate}/${reciterId}/${globalAyahNumber}.mp3`;
}

export function getReciterBitrate(reciterId) {
  try {
    const map = JSON.parse(localStorage.getItem(RECITER_BITRATE_KEY) || "{}");
    return map[reciterId] || AUDIO_BITRATES[0];
  } catch {
    return AUDIO_BITRATES[0];
  }
}

export function setReciterBitrate(reciterId, bitrate) {
  try {
    const map = JSON.parse(localStorage.getItem(RECITER_BITRATE_KEY) || "{}");
    map[reciterId] = bitrate;
    localStorage.setItem(RECITER_BITRATE_KEY, JSON.stringify(map));
  } catch {
    /* It's only a preference map; playback can continue without persistence. */
  }
}

export function nextAudioBitrate(currentBitrate) {
  const index = AUDIO_BITRATES.indexOf(currentBitrate);
  return index >= 0 && index < AUDIO_BITRATES.length - 1
    ? AUDIO_BITRATES[index + 1]
    : null;
}

export function useQuranAudioUrls() {
  return useMemo(
    () => ({
      buildAudioUrl,
      getSavedReciter,
      saveReciter,
      setReciterBitrate,
      nextAudioBitrate,
      shouldPlayOpeningBismillah,
    }),
    [],
  );
}
