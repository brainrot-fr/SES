/**
 * Naql Notifications Module
 * Handles scheduling daily naql notifications and responding to taps.
 *
 * Deliberately kept close to the version that was proven reliable:
 * - No custom notification channel (uses Android's default channel).
 *   Custom channels are immutable once created and can be silently disabled
 *   per-channel in system settings without the app-level permission changing —
 *   that's a real, invisible-from-JS failure mode, so we don't use one here.
 * - allowWhileIdle is always true. We don't gate it on
 *   checkExactNotificationSetting()/changeExactNotificationSetting() — if
 *   that setting isn't actually granted, every notification silently
 *   downgrades to non-exact instead, which is a much quieter failure than
 *   just declaring SCHEDULE_EXACT_ALARM in the manifest (already done) and
 *   letting the OS do its best.
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { renderToStaticMarkup } from 'react-dom/server';
import { nuqoolObject } from '../features/nuqool/en/nuqool.jsx';

/*
* CONSTANTS
*/

const ID_BASE = 90000;
const ID_RANGE = 10000;
const DAYS_AHEAD = 10;
const BATCH_SIZE = 50; // stay well clear of Android's per-app alarm cap

const TIMES_OF_DAY = [
  { hour: 5,  minute: 0 },
  { hour: 8,  minute: 0 },
  { hour: 11, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 25 },
  { hour: 17, minute: 0 },
  { hour: 20, minute: 0 },
];

const PREVIEW_LENGTH = 100;
const FULL_LENGTH = 800;

/*
 *
 * TEXT HELPERS
 *
 */

function decodeReactEscapedHtml(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

function jsxToPlainText(node, maxLength) {
  const html = renderToStaticMarkup(node);
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  const text = decodeReactEscapedHtml(withoutTags).replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

const naqlNumbers = Object.keys(nuqoolObject)
  .map(Number)
  .filter((n) => jsxToPlainText(nuqoolObject[n], FULL_LENGTH).length > 0);

function pickRandomNaql() {
  return naqlNumbers[Math.floor(Math.random() * naqlNumbers.length)];
}

/*
 *
 * NOTIFICATION MANAGEMENT
 *
 */

async function cancelInBatches(notifications) {
  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    await LocalNotifications.cancel({ notifications: batch.map((n) => ({ id: n.id })) });
  }
}

async function scheduleInBatches(notifications) {
  const scheduled = [];
  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    const result = await LocalNotifications.schedule({ notifications: batch });
    scheduled.push(...result.notifications);
  }
  return scheduled;
}

async function cancelPendingNaqlNotifications() {
  try {
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(
      (n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE
    );
    if (ours.length > 0) {
      console.log(`[naqlNotifications] cancelling ${ours.length} old notifications`);
      await cancelInBatches(ours);
    }
  } catch (err) {
    console.error('[naqlNotifications] error during cancel', err);
    // not fatal
  }
}

export async function scheduleDailyNaqlNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[naqlNotifications] not native platform, skipping');
    return;
  }

  try {
    console.log('[naqlNotifications] starting schedule check');

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        console.warn('[naqlNotifications] permission denied, nothing scheduled');
        return;
      }
    }

    // If anything is already scheduled for today, today's batch is still
    // good — skip. Once today's slots have all fired and nothing pending
    // matches today's date, the next app open will extend the window again.
    const pending = await LocalNotifications.getPending();
    const todayNotifications = pending.notifications.filter((n) => {
      const scheduled = new Date(n.schedule?.at || 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return scheduled >= today && scheduled < tomorrow;
    });

    if (todayNotifications.length > 0) {
      console.log(`[naqlNotifications] notifications already scheduled for today (${todayNotifications.length}), skipping reschedule`);
      return;
    }

    await cancelPendingNaqlNotifications();

    const notifications = [];
    for (let day = 0; day < DAYS_AHEAD; day++) {
      TIMES_OF_DAY.forEach((time, slot) => {
        const target = new Date();
        target.setDate(target.getDate() + day);
        target.setHours(time.hour, time.minute, 0, 0);
        if (target.getTime() <= Date.now()) return;

        const naqlNumber = pickRandomNaql();
        notifications.push({
          id: ID_BASE + day * TIMES_OF_DAY.length + slot,
          title: `Naql ${naqlNumber}`,
          body: jsxToPlainText(nuqoolObject[naqlNumber], PREVIEW_LENGTH),
          largeBody: jsxToPlainText(nuqoolObject[naqlNumber], FULL_LENGTH),
          schedule: { at: target, allowWhileIdle: true },
          extra: { naqlNumber },
        });
      });
    }

    if (notifications.length) {
      try {
        const scheduled = await scheduleInBatches(notifications);
        console.log('[naqlNotifications] scheduled', scheduled.length, 'notifications');
        await logPendingSummary();
      } catch (scheduleErr) {
        console.error('[naqlNotifications] schedule call failed', scheduleErr);
        if (scheduleErr?.toString?.().includes('500')) {
          console.error('[naqlNotifications] hit alarm limit, attempting full clear');
          try {
            const allPending = await LocalNotifications.getPending();
            await cancelInBatches(allPending.notifications);
            console.log('[naqlNotifications] cleared all notifications');
          } catch (clearErr) {
            console.error('[naqlNotifications] failed to clear alarms', clearErr);
          }
        }
        // don't re-throw — a failed reschedule should not crash the app
      }
    }
  } catch (err) {
    console.error('[naqlNotifications] fatal error in scheduleDailyNaqlNotifications', err);
  }
}

// Fire-and-forget test helper — no allowWhileIdle, no Doze concerns,
// safe to call repeatedly while iterating.
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
      id: 1,
      title: `Naql ${naqlNumber}`,
      body: jsxToPlainText(nuqoolObject[naqlNumber], PREVIEW_LENGTH),
      largeBody: jsxToPlainText(nuqoolObject[naqlNumber], FULL_LENGTH),
      schedule: { at: new Date(Date.now() + secondsFromNow * 1000) },
      extra: { naqlNumber },
    }],
  });
}

/*
 * Dumps what's actually pending right now, so you can see it instead of
 * guessing. Safe to call any time — read-only.
 */
export async function logNotificationDebugInfo() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[naqlNotifications] not running on a native platform');
    return null;
  }
  const permission = await LocalNotifications.checkPermissions();
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications
    .filter((n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE)
    .sort((a, b) => new Date(a.schedule?.at) - new Date(b.schedule?.at));

  const summary = {
    permissionDisplay: permission.display,
    pendingCount: ours.length,
    pending: ours.map((n) => ({ id: n.id, naql: n.extra?.naqlNumber, at: n.schedule?.at })),
  };
  console.log('[naqlNotifications] debug summary', summary);
  return summary;
}

async function logPendingSummary() {
  try {
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications
      .filter((n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE)
      .sort((a, b) => new Date(a.schedule?.at) - new Date(b.schedule?.at));
    console.log(
      `[naqlNotifications] ${ours.length} pending, next: ${ours[0]?.schedule?.at}, last: ${ours[ours.length - 1]?.schedule?.at}`
    );
  } catch (err) {
    console.warn('[naqlNotifications] could not read back pending list', err);
  }
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

/**
 * Call once from App.jsx. Schedules immediately, and re-checks every time
 * the app returns to the foreground.
 */
export function initNaqlNotificationLifecycle(onOpenNaql) {
  scheduleDailyNaqlNotifications();
  const tapCleanup = onNaqlNotificationTapped(onOpenNaql);

  let resumeHandle;
  if (Capacitor.isNativePlatform()) {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) scheduleDailyNaqlNotifications();
    }).then((h) => { resumeHandle = h; });
  }

  return () => {
    tapCleanup();
    resumeHandle?.remove();
  };
}