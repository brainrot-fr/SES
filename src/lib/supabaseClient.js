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