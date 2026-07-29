/**
 * Quran Data Access
 * ------------------
 * Ayah text is bundled locally (src/data/quran.json, generated once via
 * scripts/fetch-quran-text.mjs) — no network fetch, no cache, works fully
 * offline. To refresh it later (e.g. a correction upstream), just re-run
 * that script.
 *
 * Audio is NOT bundled and NOT cached at the application level — a full
 * multi-reciter audio set would be enormous, so it stays streamed live from
 * the CDN. If a reciter's audio is silent, useQuranAudioPlayer automatically
 * falls back through lower bitrates.
 */

import quranData from '../../data/quran.json';

const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';
// Not every reciter is hosted at every bitrate on this CDN — some 404 at
// 128kbps. Try highest quality first, then step down.
const AUDIO_BITRATES = [128, 64, 48, 32];
const RECITER_STORAGE_KEY = 'ses-quran-reciter';
const RECITER_BITRATE_KEY = 'ses-quran-reciter-bitrate';

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
const NO_BISMILLAH_STRIP = [1, 9]; // Al-Fatiha: Bismillah IS ayah 1 · At-Tawbah: has none to strip

function stripBismillah(text, surahNumber) {
  if (NO_BISMILLAH_STRIP.includes(surahNumber)) return text;
  return text.startsWith(BISMILLAH) ? text.slice(BISMILLAH.length).trim() : text;
}

export const RECITERS = [
  { id: 'ar.saoodshuraym', name: 'Saood Ash-Shuraym' },     // default
  { id: 'ar.alafasy', name: 'Mishary Alafasy' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahmaan As-Sudais' },
  { id: 'ar.abdulsamad', name: 'Abdul Samad' },
  { id: 'ar.husarymujawwad', name: 'Husary (Mujawwad)' },
  { id: 'ar.minshawi', name: 'Minshawi' },
];

export function getSavedReciter() {
  return localStorage.getItem(RECITER_STORAGE_KEY) || RECITERS[0].id;
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