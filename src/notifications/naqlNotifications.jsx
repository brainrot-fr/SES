/**
 * Naql Notifications Module
 * v2 — single "next notification" chain instead of bulk pre-scheduling.
 * See chat for why: the plugin's own boot-restore receiver re-delivers
 * anything whose time passed while the device was off, all at once, ~15s
 * after boot. Keeping only one notification pending at a time caps that
 * flood to 1, and removes the "skip if anything's scheduled today" guard
 * that could wedge scheduling indefinitely.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import { supabase } from '@/lib/supabaseClient';
import { nuqoolData } from '@/features/nuqool/nuqool.data.js';
import { slotsForNaqlReminders } from '../../supabase/functions/_shared/naqlSlots.ts';

const NEXT_NOTIF_ID = 500001; // fixed id — only ever one of these pending
const TEST_NOTIF_ID = 1;
const LEGACY_CLEANUP_KEY = 'ses-notif-legacy-cleanup-v2';
const PUSH_TOKEN_KEY = 'ses-push-token';
const REMINDER_SLOTS_KEY = 'ses-naql-slots-per-day';

const PREVIEW_LENGTH = 100;
const FULL_LENGTH = 800;

const naqlById = new Map(nuqoolData.map((entry) => [entry.id, entry]));

function naqlToPlainText(entry, maxLength) {
  const text = entry.parts.map((part) => part.text).join(' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

function pickRandomNaql() {
  return nuqoolData[Math.floor(Math.random() * nuqoolData.length)].id;
}

function getReminderSlotsPerDay() {
  const saved = localStorage.getItem(REMINDER_SLOTS_KEY);
  if (saved === null) return 7;
  const count = Number(saved);
  return [0, 1, 3, 7].includes(count) ? count : 7;
}

/* Find the next TIME_OF_DAY slot strictly after `from`. */
function getNextSlotDate(from = new Date(), slots = slotsForNaqlReminders(getReminderSlotsPerDay())) {
  for (let day = 0; day < 14; day++) {
    for (const time of slots) {
      const candidate = new Date(from);
      candidate.setDate(candidate.getDate() + day);
      candidate.setHours(time.hour, time.minute, 0, 0);
      if (candidate.getTime() > from.getTime()) return candidate;
    }
  }
  return null;
}

/* One-time cleanup of the old 90000–90069 batch-scheduled ids, so nothing
 * stale from the previous version lingers in the plugin's storage. */
async function cleanupLegacyNotifications() {
  if (localStorage.getItem(LEGACY_CLEANUP_KEY)) return;
  try {
    const pending = await LocalNotifications.getPending();
    const legacy = pending.notifications.filter((n) => n.id >= 90000 && n.id < 90070);
    if (legacy.length) {
      await LocalNotifications.cancel({ notifications: legacy.map((n) => ({ id: n.id })) });
      console.log(`[naqlNotifications] cleared ${legacy.length} legacy notifications`);
    }
  } catch (err) {
    console.warn('[naqlNotifications] legacy cleanup failed', err);
  } finally {
    localStorage.setItem(LEGACY_CLEANUP_KEY, '1');
  }
}

/* Ensure exactly one naql notification is pending for the next upcoming
 * slot. Safe to call as often as you like — no-op if a future one already
 * exists. */
export async function scheduleNextNaqlNotification() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const slots = slotsForNaqlReminders(getReminderSlotsPerDay());
    if (slots.length === 0) {
      await LocalNotifications.cancel({ notifications: [{ id: NEXT_NOTIF_ID }] });
      return;
    }
    if (localStorage.getItem(PUSH_TOKEN_KEY)) return;

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        console.warn('[naqlNotifications] permission denied, nothing scheduled');
        return;
      }
    }

    const pending = await LocalNotifications.getPending();
    const existing = pending.notifications.find((n) => n.id === NEXT_NOTIF_ID);
    if (existing && new Date(existing.schedule?.at || 0).getTime() > Date.now()) {
      return; // already have a future one queued
    }

    const target = getNextSlotDate(new Date(), slots);
    if (!target) return;

    const naqlNumber = pickRandomNaql();
    await LocalNotifications.schedule({
      notifications: [{
        id: NEXT_NOTIF_ID,
        title: `Naql ${naqlNumber}`,
        body: naqlToPlainText(naqlById.get(naqlNumber), PREVIEW_LENGTH),
        largeBody: naqlToPlainText(naqlById.get(naqlNumber), FULL_LENGTH),
        schedule: { at: target },
        extra: { naqlNumber },
      }],
    });
    console.log('[naqlNotifications] next notification scheduled for', target.toISOString());
  } catch (err) {
    console.error('[naqlNotifications] error in scheduleNextNaqlNotification', err);
  }
}

export async function scheduleTestNotification(secondsFromNow = 10) {
  if (!Capacitor.isNativePlatform()) return;

  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      throw new Error('Notification permission not granted');
    }
  }

  const naqlNumber = pickRandomNaql();
  await LocalNotifications.schedule({
    notifications: [{
      id: TEST_NOTIF_ID,
      title: `Naql ${naqlNumber}`,
      body: naqlToPlainText(naqlById.get(naqlNumber), PREVIEW_LENGTH),
      largeBody: naqlToPlainText(naqlById.get(naqlNumber), FULL_LENGTH),
      schedule: { at: new Date(Date.now() + secondsFromNow * 1000) },
      extra: { naqlNumber },
    }],
  });
}

export async function logNotificationDebugInfo() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[naqlNotifications] not running on a native platform');
    return null;
  }
  const permission = await LocalNotifications.checkPermissions();
  const pending = await LocalNotifications.getPending();
  const next = pending.notifications.find((n) => n.id === NEXT_NOTIF_ID);

  const summary = {
    permissionDisplay: permission.display,
    next: next ? { naql: next.extra?.naqlNumber, at: next.schedule?.at } : null,
    allPendingIds: pending.notifications.map((n) => n.id),
  };
  console.log('[naqlNotifications] debug summary', summary);
  return summary;
}

export function onNaqlNotificationTapped(onOpenNaql) {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle;
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const naqlNumber = action.notification?.extra?.naqlNumber;
    if (naqlNumber != null) onOpenNaql(naqlNumber);
  }).then((h) => { handle = h; });

  return () => handle?.remove();
}

export function initNaqlPush({ lang, onOpenNaql }) {
  if (!Capacitor.isNativePlatform()) return () => {};
  let cancelled = false;
  const handles = [];
  const keep = (handle) => { if (cancelled) handle.remove(); else handles.push(handle); };
  (async () => {
    try {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted' || cancelled) return;
      await PushNotifications.createChannel({ id: 'naql-daily', name: 'Daily Naql', importance: 3, visibility: 1 });
      keep(await PushNotifications.addListener('registration', async ({ value }) => {
        const { error } = await supabase.rpc('register_device_token', {
          p_token: value,
          p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          p_lang: lang,
          p_slots_per_day: getReminderSlotsPerDay(),
        });
        if (error) { console.error('[push] could not save token', error); return; }
        localStorage.setItem(PUSH_TOKEN_KEY, value);
        LocalNotifications.cancel({ notifications: [{ id: NEXT_NOTIF_ID }] }).catch(() => {});
      }));
      keep(await PushNotifications.addListener('registrationError', (e) => console.error('[push] registration failed', e)));
      keep(await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        const n = Number(notification.data?.naqlNumber);
        if (Number.isInteger(n)) onOpenNaql(n);
      }));
      if (!cancelled) await PushNotifications.register();
    } catch (err) {
      console.error('[push] init failed', err);
    }
  })();
  return () => { cancelled = true; handles.forEach((h) => h.remove()); };
}

export function initNaqlNotificationLifecycle(onOpenNaql) {
  (async () => {
    await cleanupLegacyNotifications();
    await scheduleNextNaqlNotification();
  })();

  const tapCleanup = onNaqlNotificationTapped(onOpenNaql);

  let receivedHandle;
  let resumeHandle;
  if (Capacitor.isNativePlatform()) {
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      if (notification.id === NEXT_NOTIF_ID) scheduleNextNaqlNotification();
    }).then((h) => { receivedHandle = h; });

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) scheduleNextNaqlNotification();
    }).then((h) => { resumeHandle = h; });
  }

  return () => {
    tapCleanup();
    receivedHandle?.remove();
    resumeHandle?.remove();
  };
}