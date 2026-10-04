import test from "node:test";
import assert from "node:assert/strict";
import { shouldPlayOpeningBismillah } from "./quranPlayback.js";

test("prepends the opening Bismillah only when playback starts at ayah one", () => {
  assert.equal(shouldPlayOpeningBismillah(2, 1), true);
  assert.equal(shouldPlayOpeningBismillah(2, 2), false);
});

test("does not prepend the opening Bismillah for Al-Fatiha or At-Tawba", () => {
  assert.equal(shouldPlayOpeningBismillah(1, 1), false);
  assert.equal(shouldPlayOpeningBismillah(9, 1), false);
});
