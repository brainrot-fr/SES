/**
 * Quran Data Access
 * ------------------
 * Ayah text is bundled locally (src/data/quran.json, generated once via
 * scripts/fetch-quran-text.mjs) — no network fetch, no cache, works fully
 * offline. To refresh it later (e.g. a correction upstream), just re-run
 * that script.
 *
 * Audio is streamed live from the CDN; the full multi-reciter set is too
 * large to bundle. A small optional duration index is generated separately
 * by scripts/index-quran-audio.mjs. If it is absent, playback still works
 * and the player uses a stable duration estimate.
 */

import quranData from '../../data/quran.json';
import { RECITERS } from './quranReciters';

export { RECITERS } from './quranReciters';
export const QURAN_SURAH_LIST = quranData.surahList;

const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';
// Reciters are available at different bitrates. Start with high quality, then
// fall back until playback succeeds.
const AUDIO_BITRATES = [192, 160, 128, 96, 64, 48, 32];
const RECITER_STORAGE_KEY = 'ses-quran-reciter';
const RECITER_BITRATE_KEY = 'ses-quran-reciter-bitrate-v2';

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const normalizeArabicForMatch = (text) =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[ـ\s]/gu, '')
    .replace(/[ٱأإآ]/gu, 'ا');
const NORMALIZED_BISMILLAH = normalizeArabicForMatch(BISMILLAH);
const NO_BISMILLAH_STRIP = [1, 9]; // Al-Fatiha: Bismillah IS ayah 1 · At-Tawbah: has none to strip

function stripBismillah(text, surahNumber) {
  if (NO_BISMILLAH_STRIP.includes(surahNumber)) return text;

  let normalizedPrefix = '';
  let prefixLength = 0;
  for (const character of text) {
    normalizedPrefix += normalizeArabicForMatch(character);
    prefixLength += character.length;
    if (normalizedPrefix.length >= NORMALIZED_BISMILLAH.length) break;
  }

  if (normalizedPrefix !== NORMALIZED_BISMILLAH) return text;

  while (prefixLength < text.length) {
    const character = String.fromCodePoint(text.codePointAt(prefixLength));
    if (!/\p{M}/u.test(character)) break;
    prefixLength += character.length;
  }

  return text.slice(prefixLength).trimStart();
}

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

export function buildAudioUrl(globalAyahNumber, reciterId = getSavedReciter(), bitrate = getReciterBitrate(reciterId)) {
  return `${AUDIO_CDN}/${bitrate}/${reciterId}/${globalAyahNumber}.mp3`;
}

/* The bitrate that has actually worked for this reciter, once discovered. */
export function getReciterBitrate(reciterId) {
  try {
    const map = JSON.parse(localStorage.getItem(RECITER_BITRATE_KEY) || '{}');
    return map[reciterId] || AUDIO_BITRATES[0];
  } catch {
    return AUDIO_BITRATES[0];
  }
}

export function setReciterBitrate(reciterId, bitrate) {
  try {
    const map = JSON.parse(localStorage.getItem(RECITER_BITRATE_KEY) || '{}');
    map[reciterId] = bitrate;
    localStorage.setItem(RECITER_BITRATE_KEY, JSON.stringify(map));
  } catch {
    /* fine, it's just a tiny preference map — not Quran data */
  }
}

export function nextAudioBitrate(currentBitrate) {
  const idx = AUDIO_BITRATES.indexOf(currentBitrate);
  return idx >= 0 && idx < AUDIO_BITRATES.length - 1 ? AUDIO_BITRATES[idx + 1] : null;
}

/**
 * Metadata for all 114 surahs (name, ayah count) — used for the surah picker.
 * Reads straight from the bundled offline data. Kept async so call sites
 * (QuranSurahList.jsx) need no changes.
 */
export async function fetchSurahList() {
  return quranData.surahList;
}

/**
 * One surah's Arabic text, with each ayah's audio URL resolved by the
 * caller via buildAudioUrl. Reads straight from the bundled offline data.
 */
export async function fetchSurah(surahNumber) {
  const raw = quranData.surahs[surahNumber];
  if (!raw) throw new Error(`Surah ${surahNumber} not found in bundled data`);

  return {
    ...raw,
    ayahs: raw.ayahs.map((a) => ({
      ...a,
      text: a.numberInSurah === 1 ? stripBismillah(a.text, raw.number) : a.text,
    })),
  };
}

let audioDurationIndexPromise;

async function fetchAudioDurationIndex() {
  if (!audioDurationIndexPromise) {
    audioDurationIndexPromise = fetch(
      `${import.meta.env.BASE_URL}quran-audio-durations.json`,
      { cache: 'no-cache' },
    )
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((index) => (
        index?.version === 1 && index.reciters && typeof index.reciters === 'object'
          ? index
          : null
      ))
      .catch(() => null);
  }
  return audioDurationIndexPromise;
}

export async function fetchSurahAudioDuration(surahNumber, reciterId) {
  const index = await fetchAudioDurationIndex();
  const seconds = index?.reciters?.[reciterId]?.surahs?.[surahNumber];
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}