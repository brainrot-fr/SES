/**
 * Naql Notifications Module
 * Handles scheduling daily naql notifications and responding to taps
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { renderToStaticMarkup } from 'react-dom/server';
import { nuqoolObject } from '../nuqool/nuqool.jsx';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const ID_BASE = 90000;
const ID_RANGE = 10000;
const DAYS_AHEAD = 14;
const BATCH_SIZE = 50;

const TIMES_OF_DAY = [
  { hour: 8, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 20, minute: 0 },
];

const PREVIEW_LENGTH = 100;
const FULL_LENGTH = 800;

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Decodes HTML entities that React's renderToStaticMarkup escapes
 * (e.g., "Ma&#x27;ud" becomes "Ma'ud")
 */
function decodeReactEscapedHtml(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Converts a JSX component to plain text, with optional truncation
 */
function jsxToPlainText(node, maxLength) {
  const html = renderToStaticMarkup(node);
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  const text = decodeReactEscapedHtml(withoutTags).replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

/**
 * Get list of valid naql numbers (those with content)
 */
const naqlNumbers = Object.keys(nuqoolObject)
  .map(Number)
  .filter((n) => jsxToPlainText(nuqoolObject[n], FULL_LENGTH).length > 0);

/**
 * Pick a random naql number from available naql content
 */
function pickRandomNaql() {
  return naqlNumbers[Math.floor(Math.random() * naqlNumbers.length)];
}

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATION MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Cancel all pending naql notifications to prevent buildup
 */
async function cancelPendingNaqlNotifications() {
  try {
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(
      (n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE
    );

    if (ours.length > 0) {
      console.log(`[naqlNotifications] cancelling ${ours.length} old notifications`);
      // Cancel in batches to avoid overwhelming the system
      for (let i = 0; i < ours.length; i += BATCH_SIZE) {
        const batch = ours.slice(i, i + BATCH_SIZE);
        await LocalNotifications.cancel({
          notifications: batch.map((n) => ({ id: n.id })),
        });
      }
    }
  } catch (err) {
    console.error('[naqlNotifications] error during cancel', err);
  }
}

/**
 * Check if notifications are already scheduled for today
 */
async function hasNotificationsForToday() {
  try {
    const pending = await LocalNotifications.getPending();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return pending.notifications.some((n) => {
      const scheduled = new Date(n.schedule?.at || 0);
      return scheduled >= today && scheduled < tomorrow;
    });
  } catch (err) {
    console.error('[naqlNotifications] error checking today notifications', err);
    return false;
  }
}

/**
 * Schedule daily naql notifications for the next 14 days
 * Only reschedules if notifications don't already exist for today
 */
export async function scheduleDailyNaqlNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[naqlNotifications] not native platform, skipping');
    return;
  }

  try {
    console.log('[naqlNotifications] starting schedule check');

    // Check and request permissions
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        console.warn('[naqlNotifications] permission denied, nothing scheduled');
        return;
      }
    }

    // Don't reschedule if we already have notifications for today
    if (await hasNotificationsForToday()) {
      console.log('[naqlNotifications] notifications already scheduled for today, skipping reschedule');
      return;
    }

    // Cancel old notifications
    await cancelPendingNaqlNotifications();

    // Build notification list
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

    // Schedule notifications
    if (notifications.length) {
      try {
        const result = await LocalNotifications.schedule({ notifications });
        console.log(`[naqlNotifications] scheduled ${result.notifications.length} notifications`);
      } catch (scheduleErr) {
        console.error('[naqlNotifications] schedule call failed', scheduleErr);
        await handleScheduleError(scheduleErr);
      }
    }
  } catch (err) {
    console.error('[naqlNotifications] fatal error in scheduleDailyNaqlNotifications', err);
  }
}

/**
 * Handle errors that occur during notification scheduling
 */
async function handleScheduleError(err) {
  if (err?.toString?.().includes('500')) {
    console.error('[naqlNotifications] hit 500-alarm limit, attempting full clear');
    try {
      const allPending = await LocalNotifications.getPending();
      if (allPending.notifications.length > 0) {
        console.log(`[naqlNotifications] clearing ALL ${allPending.notifications.length} notifications`);
        for (let i = 0; i < allPending.notifications.length; i += BATCH_SIZE) {
          const batch = allPending.notifications.slice(i, i + BATCH_SIZE);
          await LocalNotifications.cancel({
            notifications: batch.map((n) => ({ id: n.id })),
          });
        }
        console.log('[naqlNotifications] cleared all notifications');
      }
    } catch (clearErr) {
      console.error('[naqlNotifications] failed to clear alarms', clearErr);
    }
  }
}

/**
 * Send a test notification (for development)
 * @param {number} secondsFromNow - How many seconds before the notification fires
 */
export async function scheduleTestNotification(secondsFromNow = 10) {
  if (!Capacitor.isNativePlatform()) return;

  const naqlNumber = pickRandomNaql();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: `Naql ${naqlNumber}`,
        body: jsxToPlainText(nuqoolObject[naqlNumber], PREVIEW_LENGTH),
        largeBody: jsxToPlainText(nuqoolObject[naqlNumber], FULL_LENGTH),
        schedule: { at: new Date(Date.now() + secondsFromNow * 1000) },
        extra: { naqlNumber },
      },
    ],
  });
}

/**
 * Register listener for notification taps
 * @param {function} onOpenNaql - Callback with naql number
 * @returns {function} Cleanup function to remove listener
 */
export function onNaqlNotificationTapped(onOpenNaql) {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle;
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const naqlNumber = action.notification?.extra?.naqlNumber;
    if (naqlNumber != null) onOpenNaql(naqlNumber);
  }).then((h) => {
    handle = h;
  });

  return () => handle?.remove();
}