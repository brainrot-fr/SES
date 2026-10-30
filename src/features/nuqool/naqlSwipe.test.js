import test from "node:test";
import assert from "node:assert/strict";
import { getNaqlSwipeDirection } from "./naqlSwipe.js";

test("only horizontal swipes navigate in LTR and RTL", () => {
  assert.equal(getNaqlSwipeDirection(-60, 0, false), 1);
  assert.equal(getNaqlSwipeDirection(60, 0, false), -1);
  assert.equal(getNaqlSwipeDirection(-90, 10, true), -1);
  assert.equal(getNaqlSwipeDirection(90, 10, true), 1);
});

test("ignores short and predominantly vertical gestures", () => {
  assert.equal(getNaqlSwipeDirection(-59, 0, false), 0);
  assert.equal(getNaqlSwipeDirection(-60, 40, false), 0);
  assert.equal(getNaqlSwipeDirection(70, -47, true), 0);
});
