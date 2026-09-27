/**
 * One-time offline data builder.
 *
 * Run locally with: node scripts/fetch-quran-text.mjs
 *
 * Fetches the full Uthmani Quran text (all 114 surahs) from the same
 * Al Quran Cloud API the app already uses, and writes it to
 * src/data/quran.json. After this exists, quranApi.js reads from it
 * directly instead of fetching over the network — text works fully
 * offline. Audio is NOT touched by this script; it stays streamed live
 * from the CDN, unchanged.
 *
 * Needs Node 18+ (native fetch). Re-run any time you want to refresh
 * the bundled text from the source.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.alquran.cloud/v1';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'quran.json');

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  const { data } = await res.json();
  return data;
}

async function main() {
  console.log('Fetching surah list...');
  const rawList = await fetchJson('/surah');
  const surahList = rawList.map((s) => ({
    number: s.number,
    name: s.name,
    englishName: s.englishName,
    englishNameTranslation: s.englishNameTranslation,
    revelationType: s.revelationType,
    numberOfAyahs: s.numberOfAyahs,
  }));

  const surahs = {};
  for (let n = 1; n <= 114; n++) {
    console.log(`Fetching surah ${n}/114...`);
    const raw = await fetchJson(`/surah/${n}/quran-uthmani`);
    surahs[n] = {
      number: raw.number,
      name: raw.name,
      englishName: raw.englishName,
      englishNameTranslation: raw.englishNameTranslation,
      revelationType: raw.revelationType,
      numberOfAyahs: raw.numberOfAyahs,
      ayahs: raw.ayahs.map((a) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        ruku: a.ruku,
        sajda: a.sajda,
        text: a.text, // raw, unstripped — quranApi.js still strips Bismillah at read time
      })),
    };
    // Be polite to the free API between requests.
    await new Promise((r) => setTimeout(r, 150));
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify({ surahList, surahs }), 'utf-8');
  console.log(`Done. Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
