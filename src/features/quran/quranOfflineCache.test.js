import assert from "node:assert/strict";
import test from "node:test";
import {
  cacheSurah,
  cacheSurahList,
  readCachedSurah,
  readLastViewedSurah,
  writeLastViewedSurah,
} from "./quranOfflineCache.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("versioned Quran cache stores the last selection and bundled surah data", () => {
  const storage = createStorage();
  const surah = { number: 2, ayahs: [{ number: 1 }] };
  writeLastViewedSurah(2, storage);
  cacheSurahList([{ number: 2, englishName: "Al-Baqarah" }], storage);
  cacheSurah(2, surah, storage);

  assert.equal(readLastViewedSurah(storage), 2);
  assert.deepEqual(readCachedSurah(2, storage), surah);
});

test("Quran cache rejects unsupported versions and migrates the legacy selection", () => {
  const storage = createStorage();
  storage.setItem("ses-current-surah", "3");
  assert.equal(readLastViewedSurah(storage), 3);

  storage.setItem("ses-quran-last-surah-v1", JSON.stringify({ version: 99, surah: 4 }));
  assert.equal(readLastViewedSurah(storage), 3);
});
