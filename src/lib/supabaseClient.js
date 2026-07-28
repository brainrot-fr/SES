/**
 * supabaseClient.js
 * Single shared Supabase client for the whole app.
 *
 * - Credentials come from Vite env vars, bundled at build time.
 * - detectSessionInUrl is off: there's no OAuth redirect flow inside a
 *   Capacitor webview, and leaving it on just costs an unnecessary URL parse
 *   on every launch.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — check your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});