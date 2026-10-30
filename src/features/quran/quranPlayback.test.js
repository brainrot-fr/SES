import test from "node:test";
import assert from "node:assert/strict";
import { findAyahAtElapsedTime, shouldPlayOpeningBismillah } from "./quranPlayback.js";

test("prepends the opening Bismillah only when playback starts at ayah one", () => {
  assert.equal(shouldPlayOpeningBismillah(2, 1), true);
  assert.equal(shouldPlayOpeningBismillah(2, 2), false);
});

test("does not prepend the opening Bismillah for Al-Fatiha or At-Tawba", () => {
  assert.equal(shouldPlayOpeningBismillah(1, 1), false);
  assert.equal(shouldPlayOpeningBismillah(9, 1), false);
});

test("finds the ayah and offset from cumulative durations", () => {
  assert.deepEqual(findAyahAtElapsedTime([5, 20, 10], 18), {
    index: 1,
    offset: 13,
    duration: 20,
  });
  assert.deepEqual(findAyahAtElapsedTime([5, 20, 10], 5), {
    index: 1,
    offset: 0,
    duration: 20,
  });
});

test("clamps seeks to the full surah duration and handles empty duration lists", () => {
  assert.deepEqual(findAyahAtElapsedTime([5, 20, 10], 50), {
    index: 2,
    offset: 10,
    duration: 10,
  });
  assert.equal(findAyahAtElapsedTime([], 5), null);
  assert.deepEqual(findAyahAtElapsedTime([5, 20], Number.NaN), {
    index: 0,
    offset: 0,
    duration: 5,
  });
});
