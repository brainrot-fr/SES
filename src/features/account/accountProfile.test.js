import assert from "node:assert/strict";
import test from "node:test";
import { getDisplayName, isAccountProfileComplete } from "./accountProfile.js";

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

test("getDisplayName uses metadata and email fallbacks in order", () => {
  assert.equal(getDisplayName({ user_metadata: { display_name: "Display" }, email: "email@example.com" }), "Display");
  assert.equal(getDisplayName({ user_metadata: { username: "User", full_name: "Full" } }), "User");
  assert.equal(getDisplayName({ user_metadata: { full_name: "Full", name: "Name" } }), "Full");
  assert.equal(getDisplayName({ user_metadata: { name: "Name" } }), "Name");
  assert.equal(getDisplayName({ email: "email@example.com" }), "email");
  assert.equal(getDisplayName(null), "");
});
