#!/usr/bin/env node

/**
 * Download every reciter's ayah audio to a local cache and index exact
 * surah durations from the MPEG audio frames.
 *
 * Run with: node scripts/index-quran-audio.mjs
 * Cache: .cache/quran-audio/<reciter>/<global-ayah-number>.mp3
 * Output: public/quran-audio-durations.json
 *
 * The cache is deliberately outside public/ and src/, so audio files are
 * never included in the application bundle. The generated index is small.
 */

import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RECITERS } from '../src/features/quran/quranReciters.js';

const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio';
const AUDIO_BITRATES = [
  448, 416, 384, 352, 320, 288, 256, 224, 192, 176, 160, 144, 128, 112,
  96, 80, 64, 56, 48, 40, 32, 24, 16, 8,
];
const MAX_RETRIES = 4;
const DEFAULT_CONCURRENCY = 6;
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = dirname(SCRIPT_DIR);
const DATA_FILE = join(ROOT_DIR, 'src', 'data', 'quran.json');
const CACHE_DIR = join(ROOT_DIR, '.cache', 'quran-audio');
const OUTPUT_FILE = join(ROOT_DIR, 'public', 'quran-audio-durations.json');

const BITRATES = {
  1: {
    1: [32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    2: [32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    3: [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  },
  2: {
    1: [32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    2: [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    3: [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  },
};

const SAMPLE_RATES = {
  3: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  0: [11025, 12000, 8000],
};

function parseFrameHeader(buffer, offset) {
  if (offset + 4 > buffer.length) return null;
  const header = buffer.readUInt32BE(offset);
  if (((header & 0xffe00000) >>> 0) !== 0xffe00000) return null;

  const version = (header >>> 19) & 0b11;
  const layer = (header >>> 17) & 0b11;
  const bitrateIndex = (header >>> 12) & 0b1111;
  const sampleRateIndex = (header >>> 10) & 0b11;
  const padding = (header >>> 9) & 1;
  if (
    version === 1 ||
    layer === 0 ||
    bitrateIndex === 0 ||
    bitrateIndex === 15 ||
    sampleRateIndex === 3
  ) {
    return null;
  }

  const layerNumber = 4 - layer;
  const versionTable = version === 3 ? 1 : 2;
  const bitrate = BITRATES[versionTable][layerNumber][bitrateIndex - 1] * 1000;
  const sampleRate = SAMPLE_RATES[version][sampleRateIndex];
  const samplesPerFrame = layerNumber === 1
    ? 384
    : layerNumber === 2 || version === 3
      ? 1152
      : 576;
  const frameLength = layerNumber === 1
    ? Math.floor((12 * bitrate) / sampleRate + padding) * 4
    : Math.floor(((layerNumber === 3 && version !== 3 ? 72 : 144) * bitrate) / sampleRate) + padding;

  return { frameLength, sampleRate, samplesPerFrame };
}

function skipId3v2(buffer) {
  if (buffer.length < 10 || buffer.toString('ascii', 0, 3) !== 'ID3') return 0;
  const sizeBytes = buffer.subarray(6, 10);
  if ([...sizeBytes].some((byte) => byte & 0x80)) {
    throw new Error('Invalid ID3v2 synchsafe size');
  }
  const tagSize =
    (sizeBytes[0] << 21) |
    (sizeBytes[1] << 14) |
    (sizeBytes[2] << 7) |
    sizeBytes[3];
  const offset = 10 + tagSize;
  if (offset > buffer.length) throw new Error('Truncated ID3v2 tag');
  return offset;
}

function isKnownTrailingTag(buffer, offset) {
  const remaining = buffer.length - offset;
  if (remaining === 0) return true;
  if (remaining >= 3 && buffer.toString('ascii', offset, offset + 3) === 'TAG') {
    return remaining === 128;
  }
  if (remaining >= 32) {
    const footerStart = buffer.length - 32;
    return buffer.toString('ascii', footerStart, footerStart + 8) === 'APETAGEX';
  }
  return false;
}

/**
 * Return MPEG frame duration in seconds. Frame sample counts handle both
 * constant- and variable-bitrate files without relying on a bitrate guess.
 */
export function parseMp3Duration(buffer) {
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);
  let offset = skipId3v2(buffer);
  const audioEnd = buffer.length >= 128 &&
    buffer.toString('ascii', buffer.length - 128, buffer.length - 125) === 'TAG'
    ? buffer.length - 128
    : buffer.length;

  let firstFrame = null;
  const searchEnd = Math.min(audioEnd - 4, offset + 1024 * 1024);
  for (; offset <= searchEnd; offset += 1) {
    const header = parseFrameHeader(buffer, offset);
    if (!header || offset + header.frameLength > audioEnd) continue;
    const nextOffset = offset + header.frameLength;
    if (nextOffset + 4 <= audioEnd && !parseFrameHeader(buffer, nextOffset)) continue;
    firstFrame = offset;
    break;
  }
  if (firstFrame === null) throw new Error('No valid MPEG audio frames found');

  let frames = 0;
  let duration = 0;
  offset = firstFrame;
  while (offset < audioEnd) {
    const header = parseFrameHeader(buffer, offset);
    if (!header) {
      if (isKnownTrailingTag(buffer, offset)) break;
      throw new Error(`Invalid or truncated MPEG frame at byte ${offset}`);
    }
    if (offset + header.frameLength > audioEnd) {
      if (frames > 0) break;
      throw new Error(`Truncated MPEG frame at byte ${offset}`);
    }
    frames += 1;
    duration += header.samplesPerFrame / header.sampleRate;
    offset += header.frameLength;
  }
  if (frames === 0) throw new Error('No complete MPEG audio frames found');
  return duration;
}

function getConcurrency() {
  const value = Number(process.env.QURAN_AUDIO_CONCURRENCY || DEFAULT_CONCURRENCY);
  return Number.isInteger(value) && value > 0 ? Math.min(value, 32) : DEFAULT_CONCURRENCY;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function downloadAtBitrate(url) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if ([403, 404, 416].includes(response.status)) {
        const error = new Error(`Audio unavailable (HTTP ${response.status}): ${url}`);
        error.unavailableAtBitrate = true;
        throw error;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      const file = Buffer.from(await response.arrayBuffer());
      const declaredLength = Number(response.headers.get('content-length'));
      if (Number.isFinite(declaredLength) && declaredLength > 0 && file.length !== declaredLength) {
        throw new Error(
          `Incomplete download (${file.length}/${declaredLength} bytes): ${url}`,
        );
      }
      let duration;
      try {
        duration = parseMp3Duration(file);
      } catch (error) {
        error.invalidAudio = true;
        throw error;
      }
      if (!Number.isFinite(duration) || duration <= 0) {
        const error = new Error(`Invalid audio duration: ${url}`);
        error.invalidAudio = true;
        throw error;
      }
      return { file, duration };
    } catch (error) {
      if (error.unavailableAtBitrate) throw error;
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(Math.min(8_000, 500 * 2 ** attempt) + Math.random() * 250);
      }
    }
  }
  if (lastError?.invalidAudio) {
    const error = new Error(
      `Invalid MP3 response after ${MAX_RETRIES + 1} attempts: ${url} (${lastError.message})`,
      { cause: lastError },
    );
    error.unavailableAtBitrate = true;
    throw error;
  }
  throw lastError;
}

async function getAyahAudio(reciterId, ayah, preferredBitrate) {
  const globalAyahNumber = ayah.number;
  const reciterCache = join(CACHE_DIR, reciterId);
  const audioFile = join(reciterCache, `${globalAyahNumber}.mp3`);
  await mkdir(reciterCache, { recursive: true });
  try {
    const cachedFile = await readFile(audioFile);
    return { duration: parseMp3Duration(cachedFile), downloaded: false };
  } catch {
    await rm(audioFile, { force: true });
  }

  let lastError;
  const bitrateLadder = preferredBitrate
    ? [preferredBitrate, ...AUDIO_BITRATES.filter((bitrate) => bitrate !== preferredBitrate)]
    : AUDIO_BITRATES;
  for (const bitrate of bitrateLadder) {
    const url = `${AUDIO_CDN}/${bitrate}/${reciterId}/${globalAyahNumber}.mp3`;
    try {
      const { file, duration } = await downloadAtBitrate(url);
      const partialFile = `${audioFile}.part`;
      await writeFile(partialFile, file);
      await rename(partialFile, audioFile);
      return { duration, downloaded: true, bitrate };
    } catch (error) {
      lastError = error;
      if (!error.unavailableAtBitrate) throw error;
      const fallbackBitrate = bitrateLadder[bitrateLadder.indexOf(bitrate) + 1];
      if (fallbackBitrate) {
        console.warn(
          `  ${reciterId} ayah ${globalAyahNumber}: ${bitrate} kbps unavailable or invalid; trying ${fallbackBitrate} kbps`,
        );
      }
    }
  }

  throw new Error(
    `No valid audio bitrate for ${reciterId} ayah ${globalAyahNumber}: ${lastError?.message}`,
  );
}

async function mapWithConcurrency(items, concurrency, callback) {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= items.length) return;
        await callback(items[index], index);
      }
    },
  );
  await Promise.all(workers);
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(
      'Downloads Quran ayah MP3s for all app reciters, caches them under .cache/quran-audio, and writes public/quran-audio-durations.json.',
    );
    console.log(`Concurrency: QURAN_AUDIO_CONCURRENCY (default ${DEFAULT_CONCURRENCY}, max 32)`);
    return;
  }

  const quranData = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  const surahs = Object.values(quranData.surahs);
  const ayahs = surahs.flatMap((surah) =>
    surah.ayahs.map((ayah) => ({ ...ayah, surahNumber: surah.number })),
  );
  if (surahs.length !== 114 || ayahs.length !== 6236) {
    throw new Error(`Unexpected Quran data: ${surahs.length} surahs, ${ayahs.length} ayahs`);
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(dirname(OUTPUT_FILE), { recursive: true });

  const reciterDurations = {};
  for (const reciter of RECITERS) {
    const totals = {};
    let lastDownloadedBitrate;
    let completed = 0;
    let downloaded = 0;
    console.log(`Indexing ${reciter.name} (${ayahs.length} ayahs)...`);
    await mapWithConcurrency(ayahs, getConcurrency(), async (ayah) => {
      const result = await getAyahAudio(reciter.id, ayah, lastDownloadedBitrate);
      if (result.downloaded) lastDownloadedBitrate = result.bitrate;
      completed += 1;
      if (result.downloaded) downloaded += 1;
      totals[ayah.surahNumber] = (totals[ayah.surahNumber] || 0) + result.duration;
      if (completed % 500 === 0 || completed === ayahs.length) {
        console.log(
          `  ${reciter.name}: ${completed}/${ayahs.length} ayahs (${downloaded} downloaded this run)`,
        );
      }
    });

    reciterDurations[reciter.id] = {
      surahs: Object.fromEntries(
        Object.entries(totals)
          .map(([number, seconds]) => [number, Number(seconds.toFixed(6))]),
      ),
    };
  }

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    reciters: reciterDurations,
  };
  const temporaryOutput = `${OUTPUT_FILE}.part`;
  await writeFile(temporaryOutput, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await rename(temporaryOutput, OUTPUT_FILE);
  console.log(`Wrote ${OUTPUT_FILE}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
