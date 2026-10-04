/**
 * Quran Data Access
 * ------------------
 * Ayah text is bundled locally (src/data/quran.json, refreshed via
 * scripts/fetch-quran-text.mjs) — no network fetch, no cache, works fully
 * offline. The refresh script updates text only, preserving the bundled
 * surah metadata and data shape.
 *
 * Audio is streamed live from the CDN; the full multi-reciter set is too
 * large to bundle. A small optional duration index is generated separately
 * by scripts/index-quran-audio.mjs. If it is absent, playback still works
 * and the player uses a stable duration estimate.
 */

import quranData from '../../data/quran.json';

export { RECITERS } from './quranReciters';
export {
  buildAudioUrl,
  getReciterBitrate,
  getSavedReciter,
  nextAudioBitrate,
  saveReciter,
  setReciterBitrate,
} from './quranAudioUrls';
export const QURAN_SURAH_LIST = quranData.surahList;

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
export async function fetchSurah(surahNumber, { includeBismillah = false } = {}) {
  const raw = quranData.surahs[surahNumber];
  if (!raw) throw new Error(`Surah ${surahNumber} not found in bundled data`);

  return {
    ...raw,
    ayahs: raw.ayahs.map((a) => ({
      ...a,
      text: a.numberInSurah === 1 && !includeBismillah
        ? stripBismillah(a.text, raw.number)
        : a.text,
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