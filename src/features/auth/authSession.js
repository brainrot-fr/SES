/**
 * authSession.js
 * Identity logic for required email accounts.
 *
 * - Existing anonymous identities can be upgraded in place.
 * - New users register with email and password.
 * - Upgrade path uses Supabase's email-change flow: updateUser({ email })
 *   sends a 6-digit code to the new address; verifyOtp with type
 *   'email_change' confirms it and converts the anonymous user in place —
 *   same user id throughout, just no longer anonymous after confirmation.
 */

import { supabase } from '../../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { getDisplayName } from '../account/accountProfile.js';

export { getDisplayName };

const AUTH_CALLBACK_URL = 'ses://auth-callback';

function getAuthRedirectTo() {
  return Capacitor.isNativePlatform() ? AUTH_CALLBACK_URL : window.location.origin;
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
export async function requestEmailUpgrade(email, password) {
  const { error } = await supabase.auth.updateUser(
    { email, password },
    { emailRedirectTo: getAuthRedirectTo() }
  );
  if (error) throw error;
}

/*
 * Sign in on a *different* device using the email+password set above.
 * This deliberately replaces whatever anonymous session already exists on
 * this device — signing into a real account means "become this identity,"
 * not "merge with it." Any local-only data tied to the old anonymous
 * session on this device is left behind (nothing was cloud-synced under
 * it yet, per feat-userObject.md's uninstall-wipes-everything model).
 */
export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle() {
  const native = Capacitor.isNativePlatform();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthRedirectTo(),
      skipBrowserRedirect: native,
    },
  });
  if (error) throw error;
  if (native) await Browser.open({ url: data.url });
}

export async function signUpWithPassword(username, email, password) {
  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 2 || trimmedUsername.length > 40) {
    throw new Error('Username must be between 2 and 40 characters.');
  }
  const { data: { session } } = await supabase.auth.getSession();
  const userMetadata = {
    username: trimmedUsername,
    display_name: trimmedUsername,
  };

  if (isAnonymousUser(session?.user)) {
    const { error } = await supabase.auth.updateUser(
      { email, password, data: userMetadata },
      { emailRedirectTo: getAuthRedirectTo() }
    );
    if (error) throw error;
    return { confirmationRequired: true };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      emailRedirectTo: getAuthRedirectTo(),
    },
  });
  if (error) throw error;
  return { confirmationRequired: !data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
  if (signOutError) throw signOutError;
}

/*
 * Handles PKCE code callbacks and token-fragment callbacks for email
 * confirmations. `onEmailUpgradeConfirmed` fires after an email change is
 * verified so the UI can show a success state without further input.
 */
export function listenForAuthRedirect(onEmailUpgradeConfirmed, onError) {
  if (!Capacitor.isNativePlatform()) {
    return listenForWebEmailUpgradeConfirmation(onEmailUpgradeConfirmed, onError);
  }

  let handle;
  let disposed = false;
  const handledUrls = new Set();

  const processCallback = async (url) => {
    if (!url?.startsWith(AUTH_CALLBACK_URL) || handledUrls.has(url)) return;
    handledUrls.add(url);

    try {
      const parsed = new URL(url.replace('ses://', 'https://'));
      const authError = parsed.searchParams.get('error_description') || parsed.searchParams.get('error');
      if (authError) throw new Error(authError);

      const code = parsed.searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        await Browser.close().catch(() => {});
        return;
      }

      const params = new URLSearchParams(parsed.hash.slice(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) return;

      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
      if (params.get('type') === 'email_change') onEmailUpgradeConfirmed(data.session);
      await Browser.close().catch(() => {});
    } catch (err) {
      console.error('[auth] failed to complete auth redirect', err);
      onError?.(err);
    }
  };

  const listenerPromise = App.addListener('appUrlOpen', ({ url }) => {
    void processCallback(url);
  });
  listenerPromise.then((h) => {
    handle = h;
    if (disposed) handle.remove();
  });

  (async () => {
    try {
      await listenerPromise;
      const launchUrl = await App.getLaunchUrl();
      if (launchUrl?.url) await processCallback(launchUrl.url);
    } catch (err) {
      console.error('[auth] failed to read app launch URL', err);
      onError?.(err);
    }
  })();

  return () => {
    disposed = true;
    handle?.remove();
  };
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
    const callbackUrl = new URL(window.location.href);
    const code = callbackUrl.searchParams.get('code');
    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        callbackUrl.searchParams.delete('code');
        window.history.replaceState(
          null,
          '',
          callbackUrl.pathname + callbackUrl.search + callbackUrl.hash
        );
      } catch (err) {
        console.error('[auth] failed to complete OAuth sign-in', err);
        onError?.(err);
      }
      return;
    }

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

      if (params.get('type') === 'email_change') onConfirmed(data.session);
    } catch (err) {
      console.error('[auth] failed to complete web email upgrade', err);
      onError?.(err);
    }
  })();

  return () => {}; // nothing to unsubscribe — this only runs once on load
}