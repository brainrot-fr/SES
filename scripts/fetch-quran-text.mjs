/**
 * One-time offline data builder.
 *
 * Run locally with: node scripts/fetch-quran-text.mjs
 *
 * Refreshes only ayah text from Al Quran Cloud in src/data/quran.json.
 * Existing surah metadata and the data shape are retained verbatim.
 * Audio is NOT touched by this script; it stays streamed live from the
 * CDN, unchanged.
 *
 * Needs Node 18+ (native fetch). Re-run any time you want to refresh
 * the bundled text from the source.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.alquran.cloud/v1';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data');
const OUT_FILE = join(OUT_DIR, 'quran.json');

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  const payload = await res.json();
  if (payload.code !== 200 || !payload.data) {
    throw new Error(`${path} returned an invalid API response`);
  }
  const { data } = payload;
  return data;
}

async function main() {
  const quranData = JSON.parse(await readFile(OUT_FILE, 'utf-8'));
  if (!Array.isArray(quranData.surahList) || !quranData.surahs) {
    throw new Error(`${OUT_FILE} does not have the expected Quran data shape`);
  }

  for (let n = 1; n <= 114; n++) {
    console.log(`Fetching surah ${n}/114...`);
    const raw = await fetchJson(`/surah/${n}/quran-uthmani`);
    const existing = quranData.surahs[n];
    if (
      !existing
      || raw.number !== n
      || !Array.isArray(raw.ayahs)
      || raw.ayahs.length !== existing.ayahs.length
    ) {
      throw new Error(`Surah ${n} does not match the existing Quran data`);
    }

    quranData.surahs[n] = {
      ...existing,
      ayahs: existing.ayahs.map((ayah, index) => {
        const sourceAyah = raw.ayahs[index];
        if (
          sourceAyah.numberInSurah !== ayah.numberInSurah
          || typeof sourceAyah.text !== 'string'
        ) {
          throw new Error(`Ayah ${n}:${ayah.numberInSurah} does not match upstream`);
        }
        return { ...ayah, text: sourceAyah.text };
      }),
    };
    // Be polite to the free API between requests.
    await new Promise((r) => setTimeout(r, 150));
  }

  await writeFile(OUT_FILE, JSON.stringify(quranData, null, 4), 'utf-8');
  console.log(`Done. Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
