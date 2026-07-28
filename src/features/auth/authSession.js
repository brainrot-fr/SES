/**
 * authSession.js
 * Identity logic per feat-userObject.md: anonymous by default, upgradeable
 * to a real email later, never mandatory.
 *
 * - Silently creates an anonymous Supabase identity on first launch.
 * - Everything downstream (region, Murshid choice, device tokens) attaches
 *   to this identity, whether or not it's ever upgraded.
 * - Upgrade path uses Supabase's email-change flow: updateUser({ email })
 *   sends a 6-digit code to the new address; verifyOtp with type
 *   'email_change' confirms it and converts the anonymous user in place —
 *   same user id throughout, just no longer anonymous after confirmation.
 */

import { supabase } from '../../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

const AUTH_CALLBACK_URL = 'ses://auth-callback';

/* Native apps get the custom scheme so Android/iOS can hand the tapped
 * link back to the running app via appUrlOpen. Web has no OS-level
 * handoff — the browser just navigates to a real page of the app, so the
 * redirect target there is wherever the app is currently being served
 * from (localhost during dev, the real domain once deployed). Both need
 * to be registered as Redirect URLs in the Supabase dashboard. */
function getEmailRedirectTo() {
  return Capacitor.isNativePlatform() ? AUTH_CALLBACK_URL : window.location.origin;
}

/* Reuse an existing session if one is already on-device; only create a new
 * anonymous identity if this is truly the first launch. */
export async function ensureAnonymousSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.error('[auth] anonymous sign-in failed', error);
    throw error;
  }
  return data.session;
}

export function isAnonymousUser(user) {
  return !!user && user.is_anonymous === true;
}

export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription.unsubscribe();
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/* The only step from the app's side: attach a real email to the anonymous
 * identity. Supabase emails a confirmation link to `email` — nothing is
 * confirmed until that link is tapped, which lands back in the app via
 * the deep link handler below rather than a code the user types in. */
export async function requestEmailUpgrade(email) {
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: getEmailRedirectTo() }
  );
  if (error) throw error;
}

/*
 * Registers a listener for the app being reopened via the auth-callback
 * deep link. Supabase's redirect appends the session as a URL fragment
 * (#access_token=...&refresh_token=...&type=email_change) rather than a
 * query string — getSessionFromUrl handles that format directly.
 * `onConfirmed` fires once the email change is verified so the UI can show
 * a success state without the user doing anything else.
 */
export function listenForEmailUpgradeConfirmation(onConfirmed, onError) {
  if (!Capacitor.isNativePlatform()) {
    return listenForWebEmailUpgradeConfirmation(onConfirmed, onError);
  }

  let handle;
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(AUTH_CALLBACK_URL)) return;
    try {
      // Supabase Auth v2 expects the fragment to be parsed from a URL object;
      // swap the custom scheme for https so the URL constructor accepts it.
      const parsed = new URL(url.replace('ses://', 'https://'));
      const { data, error } = await supabase.auth.getSessionFromUrl({ url: parsed.toString() });
      if (error) throw error;
      onConfirmed(data.session);
    } catch (err) {
      console.error('[auth] failed to complete email upgrade', err);
      onError?.(err);
    }
  }).then((h) => { handle = h; });

  return () => handle?.remove();
}

/*
 * Web equivalent: on load, check whether the current page URL carries the
 * fragment Supabase appends after a confirmed email-change redirect
 * (#access_token=...&refresh_token=...&type=email_change). Runs once on
 * mount — AuthProvider's effect only runs once anyway, so this fires
 * right as the app boots on the page the user landed back on.
 */
function listenForWebEmailUpgradeConfirmation(onConfirmed, onError) {
  (async () => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;

    try {
      const params = new URLSearchParams(hash.slice(1)); // drop leading '#'
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) return;

      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;

     // Clean the sensitive tokens out of the visible URL now that
      // they've been consumed, so a refresh/share of the URL bar doesn't
      // resend them anywhere.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      onConfirmed(data.session);
    } catch (err) {
      console.error('[auth] failed to complete web email upgrade', err);
      onError?.(err);
    }
  })();

  return () => {}; // nothing to unsubscribe — this only runs once on load
}