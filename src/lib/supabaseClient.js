/**
 * supabaseClient.js
 * Single shared Supabase client for the whole app.
 *
 * - Credentials come from Vite env vars, bundled at build time.
 * - OAuth callback parsing is handled by authSession for both web and native
 *   redirects, so Supabase's automatic URL detection stays disabled.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env file.'
  );
}

export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
}) : null;

export function friendlyError(error, t, fallbackKey = "errorGeneric") {
  const message = String(error?.message || "");
  const code = String(error?.code || "").toLowerCase();
  const offline = (typeof navigator !== "undefined" && navigator.onLine === false)
    || /failed to fetch|networkerror|load failed|network request failed/i.test(message);
  if (offline) return t("errorOffline");
  if (
    code === "invalid_credentials"
    || /invalid login credentials|invalid email or password/i.test(message)
  ) return t("errorInvalidCredentials");
  if (
    code === "email_exists"
    || /user already registered|email.*already.*registered|email.*already.*exists/i.test(message)
  ) return t("errorEmailExists");
  if (
    code === "weak_password"
    || /password should be at least|password.*too weak/i.test(message)
  ) return t("errorWeakPassword");
  if (
    code.includes("rate_limit")
    || /too many requests|rate limit/i.test(message)
  ) return t("errorRateLimit");
  if (code === "invalid_email" || /invalid email/i.test(message)) return t("errorInvalidEmail");

  const applicationErrors = {
    auth_username_invalid: "authUsernameInvalid",
    profile_sign_in_required: "profileSignInRequired",
    profile_gender_invalid: "profileGenderRequired",
    profile_country_invalid: "profileCountryInvalid",
    profile_gender_save_unavailable: "profileGenderSaveUnavailable",
    account_profile_context_missing: "accountProfileContextMissing",
  };
  const applicationKey = applicationErrors[code] || applicationErrors[message];
  return t(applicationKey || fallbackKey);
}