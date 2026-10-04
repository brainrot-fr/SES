import test from "node:test";
import assert from "node:assert/strict";
import { buildAudioUrl, nextAudioBitrate } from "./quranAudioUrls.js";

test("audio URL builder preserves the CDN path and selected bitrate", () => {
  assert.equal(
    buildAudioUrl(7, "ar.alafasy", 128),
    "https://cdn.islamic.network/quran/audio/128/ar.alafasy/7.mp3",
  );
});

test("bitrate fallback follows the supported quality ladder and stops at its end", () => {
  assert.equal(nextAudioBitrate(192), 160);
  assert.equal(nextAudioBitrate(64), 48);
  assert.equal(nextAudioBitrate(32), null);
  assert.equal(nextAudioBitrate(128), 96);
});
