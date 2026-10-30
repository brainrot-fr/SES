import test from "node:test";
import assert from "node:assert/strict";
import { getDailyAyahPosition } from "./dailyAyah.js";

const surahs = [
  { number: 1, englishName: "Al-Fatihah", numberOfAyahs: 7 },
  { number: 2, englishName: "Al-Baqarah", numberOfAyahs: 286 },
  { number: 3, englishName: "Aal-Imran", numberOfAyahs: 200 },
  { number: 4, englishName: "An-Nisa", numberOfAyahs: 176 },
  { number: 5, englishName: "Al-Maidah", numberOfAyahs: 120 },
  { number: 6, englishName: "Al-Anam", numberOfAyahs: 165 },
  { number: 7, englishName: "Al-Araf", numberOfAyahs: 206 },
];

test("daily ayah uses the UTC day index across the full Quran", () => {
  const positions = [0, 1, 365, 366, 1000].map((day) =>
    getDailyAyahPosition(new Date(day * 86400000), surahs),
  );

  assert.deepEqual(positions.slice(0, 2).map(({ surah, ayahIndex }) => [surah.number, ayahIndex]), [
    [1, 0],
    [1, 1],
  ]);
  assert.deepEqual(
    positions.slice(2, 4).map(({ surah, ayahIndex }) => [surah.number, ayahIndex]),
    [[3, 72], [3, 73]],
  );
  assert.deepEqual([positions[4].surah.number, positions[4].ayahIndex], [7, 46]);
});
