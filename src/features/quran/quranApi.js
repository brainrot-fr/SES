/**
 * Quran Data Access
 * ------------------
 * Arabic text is fetched live from Al Quran Cloud (api.alquran.cloud) — free,
 * keyless, no rate limit, sourced from Tanzil/Quran Academy. Audio streams
 * from the same project's CDN using the global ayah number the text response
 * already includes, so no extra request is needed to resolve a reciter's file.
 *
 * Translations are NOT fetched here — see quranTranslations.js. That data is
 * always local, same as nuqoolObject, since no API carries the exact Urdu
 * wording this app needs.
 */

const API_BASE = 'https://api.alquran.cloud/v1';
const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';
const AUDIO_BITRATE = 128;
const CACHE_PREFIX = 'ses-quran-cache-v3-';
const RECITER_STORAGE_KEY = 'ses-quran-reciter';

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

export function buildAudioUrl(globalAyahNumber, reciterId = getSavedReciter()) {
  return `${AUDIO_CDN}/${AUDIO_BITRATE}/${reciterId}/${globalAyahNumber}.mp3`;
}

/*
 * readCache and writeCache are simple localStorage cache helpers. They keep
 * network usage down by storing API responses per surah or surah list.
 */

function readCache(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    /* Storage full or unavailable — fine, it's just a cache */
  }
}

/**
 * Metadata for all 114 surahs (name, ayah count) — used for the surah picker.
 * Cached indefinitely since this data never changes.
 */
export async function fetchSurahList() {
  const cached = readCache('surah-list');
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/surah`);
  if (!res.ok) throw new Error(`Failed to load surah list (${res.status})`);
  const { data } = await res.json();

  const list = data.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    revelationType: s.revelationType,
    numberOfAyahs: s.numberOfAyahs,
  }));

  writeCache('surah-list', list);
  return list;
}

/**
 * One surah's Arabic text, with each ayah's audio URL pre-built.
 * Cached per-surah so re-visiting doesn't re-fetch.
 */
export async function fetchSurah(surahNumber) {
  const cached = readCache(`surah-${surahNumber}`);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/surah/${surahNumber}/quran-uthmani`);
  if (!res.ok) throw new Error(`Failed to load Surah ${surahNumber} (${res.status})`);
  const { data } = await res.json();

  const surah = {
    number: data.number,
    name: data.name,
    englishName: data.englishName,
    englishNameTranslation: data.englishNameTranslation,
    revelationType: data.revelationType,
    numberOfAyahs: data.numberOfAyahs,
    ayahs: data.ayahs.map((a) => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.numberInSurah === 1 ? stripBismillah(a.text, data.number) : a.text,
    })),
  };

  writeCache(`surah-${surahNumber}`, surah);
  return surah;
}