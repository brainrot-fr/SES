import assert from "node:assert/strict";
import test from "node:test";
import { isAccountProfileComplete } from "./accountProfile.js";

const completeProfile = {
  onboarding_gender: "girl",
  follower_confirmed: true,
  onboarding_completed_at: "2026-09-29T00:00:00.000Z",
};

test("requires a supported gender, follower confirmation, and completion time", () => {
  assert.equal(isAccountProfileComplete(completeProfile), true);
  assert.equal(isAccountProfileComplete(null), false);
  assert.equal(
    isAccountProfileComplete({ ...completeProfile, onboarding_gender: "other" }),
    false,
  );
  assert.equal(
    isAccountProfileComplete({ ...completeProfile, follower_confirmed: false }),
    false,
  );
  assert.equal(
    isAccountProfileComplete({ ...completeProfile, onboarding_completed_at: null }),
    false,
  );
});
