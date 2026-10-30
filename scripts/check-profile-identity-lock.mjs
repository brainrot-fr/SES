import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_TEST_EMAIL",
  "SUPABASE_TEST_PASSWORD",
];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: process.env.SUPABASE_TEST_EMAIL,
  password: process.env.SUPABASE_TEST_PASSWORD,
});

if (authError) throw authError;

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("onboarding_completed_at,onboarding_gender")
  .eq("id", authData.user.id)
  .single();

if (profileError) throw profileError;
assert.ok(profile.onboarding_completed_at, "Test user must have completed onboarding.");

async function assertTriggerRejects(update, attempt) {
  const { error } = await supabase.from("profiles").update(update).eq("id", authData.user.id);
  assert.equal(error?.code, "P0001", `${attempt} must be rejected by the identity trigger.`);
}

await assertTriggerRejects({ onboarding_completed_at: null }, "Clearing completion");
await assertTriggerRejects(
  { onboarding_gender: profile.onboarding_gender === "girl" ? "boy" : "girl" },
  "Changing gender",
);
await assertTriggerRejects(
  { onboarding_completed_at: new Date(Date.parse(profile.onboarding_completed_at) + 1000).toISOString() },
  "Re-completing onboarding",
);

console.log("Profile identity-lock checks passed.");
