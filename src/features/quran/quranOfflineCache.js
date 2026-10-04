const CACHE_VERSION = 1;
const LAST_SURAH_KEY = "ses-quran-last-surah-v1";
const LEGACY_LAST_SURAH_KEY = "ses-current-surah";
const SURAH_LIST_KEY = "ses-quran-surah-list-v1";
const getSurahCacheKey = (number) => `ses-quran-surah-v1:${number}`;

function getStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readLastViewedSurah(storage = getStorage()) {
  if (!storage) return null;
  try {
    const cached = JSON.parse(storage.getItem(LAST_SURAH_KEY) || "null");
    if (cached?.version === CACHE_VERSION && Number.isInteger(cached.surah)) {
      return cached.surah;
    }
    const legacy = Number(storage.getItem(LEGACY_LAST_SURAH_KEY));
    return Number.isInteger(legacy) ? legacy : null;
  } catch {
    return null;
  }
}

export function writeLastViewedSurah(number, storage = getStorage()) {
  if (!storage || !Number.isInteger(number)) return;
  try {
    storage.setItem(LAST_SURAH_KEY, JSON.stringify({ version: CACHE_VERSION, surah: number }));
    storage.setItem(LEGACY_LAST_SURAH_KEY, String(number));
  } catch {
    // Bundled Quran content remains usable without browser storage.
  }
}

export function cacheSurahList(surahs, storage = getStorage()) {
  if (!storage || !Array.isArray(surahs)) return;
  try {
    storage.setItem(SURAH_LIST_KEY, JSON.stringify({ version: CACHE_VERSION, surahs }));
  } catch {
    // The list is also bundled, so storage is only an offline convenience.
  }
}

export function cacheSurah(number, surah, storage = getStorage()) {
  if (!storage || !Number.isInteger(number) || !surah) return;
  try {
    storage.setItem(
      getSurahCacheKey(number),
      JSON.stringify({ version: CACHE_VERSION, surah }),
    );
  } catch {
    // The bundled copy remains the source of truth when storage is unavailable.
  }
}

export function readCachedSurah(number, storage = getStorage()) {
  if (!storage || !Number.isInteger(number)) return null;
  try {
    const cached = JSON.parse(storage.getItem(getSurahCacheKey(number)) || "null");
    return cached?.version === CACHE_VERSION && cached.surah?.number === number
      ? cached.surah
      : null;
  } catch {
    return null;
  }
}
