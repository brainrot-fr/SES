/**
 * Naql Notifications Module
 * Handles scheduling daily naql notifications and responding to taps
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
const RESCHEDULE_THRESHOLD_DAYS = 3; // refresh once fewer than this many days of coverage remain
const BATCH_SIZE = 50;

const TIMES_OF_DAY = [
  { hour: 5,  minute: 0 },
  { hour: 8,  minute: 0 },
  { hour: 11, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 20, minute: 0 },
];

const PREVIEW_LENGTH = 100;
const FULL_LENGTH = 800;

const CHANNEL_ID = 'naql-notifications';
const CHANNEL_NAME = 'Nuqool reminders';
const CHANNEL_DESC = 'Daily Naql reminders and alerts';

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

/*
 * Convert React JSX content into a plain-text notification body.
 * This avoids sending HTML tags to the native notification payload.
 */

function jsxToPlainText(node, maxLength) {
  const html = renderToStaticMarkup(node);
  const withoutTags = html.replace(/<[^>]*>/g, ' ');
  const text = decodeReactEscapedHtml(withoutTags).replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

const naqlNumbers = Object.keys(nuqoolObject)
  .map(Number)
  .filter((n) => jsxToPlainText(nuqoolObject[n], FULL_LENGTH).length > 0)
  .sort((a, b) => a - b);

function getNaqlIndexForSchedule(day, slot) {
  return (day * TIMES_OF_DAY.length + slot) % naqlNumbers.length;
}

/* Pick a Naql number deterministically based on the schedule slot. */
function pickScheduledNaql(day, slot) {
  return naqlNumbers[getNaqlIndexForSchedule(day, slot)];
}

/* Use a random Naql number for quick test notifications. */
function pickRandomNaql() {
  return naqlNumbers[Math.floor(Math.random() * naqlNumbers.length)];
}

/*
 *
 * EXACT ALARM PERMISSION (Android 12+)
 *
 * SCHEDULE_EXACT_ALARM in the manifest only makes this permission
 * available — it does not grant it. If the user has it off (or later
 * switches it off), scheduled notifications using allowWhileIdle can be
 * silently dropped or wiped entirely. A near-immediate test notification
 * doesn't hit this wall since it never has to survive Doze; the daily
 * batch does.
 *
 */

async function ensureExactAlarmPermission() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return true;
  }
  try {
    const current = await LocalNotifications.checkExactNotificationSetting();
    if (current.exact_alarm === 'granted') return true;
    const result = await LocalNotifications.changeExactNotificationSetting();
    return result.exact_alarm === 'granted';
  } catch (err) {
    console.warn('[naqlNotifications] exact alarm setting check failed', err);
    return false;
  }
}

/*
 *
 * NOTIFICATION MANAGEMENT
 *
 */

async function cancelPendingNaqlNotifications() {
  try {
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(
      (n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE
    );
    for (let i = 0; i < ours.length; i += BATCH_SIZE) {
      const batch = ours.slice(i, i + BATCH_SIZE);
      await LocalNotifications.cancel({ notifications: batch.map((n) => ({ id: n.id })) });
    }
  } catch (err) {
    console.error('[naqlNotifications] error during cancel', err);
  }
}

function coverageEndDate(pendingList) {
  const ours = pendingList.filter((n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE);
  if (ours.length === 0) return null;
  const latest = ours.reduce((max, n) => {
    const at = new Date(n.schedule?.at || 0).getTime();
    return at > max ? at : max;
  }, 0);
  return latest ? new Date(latest) : null;
}

async function needsRescheduling() {
  try {
    const pending = await LocalNotifications.getPending();
    const end = coverageEndDate(pending.notifications);
    if (!end) return true;
    const rescheduleBy = new Date();
    rescheduleBy.setDate(rescheduleBy.getDate() + RESCHEDULE_THRESHOLD_DAYS);
    return end < rescheduleBy;
  } catch (err) {
    console.error('[naqlNotifications] error checking coverage', err);
    return true; // if we can't tell, reschedule rather than go silent
  }
}

export async function scheduleDailyNaqlNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (Capacitor.getPlatform() === 'android') {
      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID,
          name: CHANNEL_NAME,
          description: CHANNEL_DESC,
          importance: 4,
          visibility: 1,
        });
      } catch (channelErr) {
        console.warn('[naqlNotifications] failed to create Android channel', channelErr);
      }
    }

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') {
        console.warn('[naqlNotifications] notification permission denied, nothing scheduled');
        return;
      }
    }

    const exactAlarmsAvailable = await ensureExactAlarmPermission();
    if (!exactAlarmsAvailable) {
      console.warn('[naqlNotifications] exact alarms not granted — scheduling without allowWhileIdle; delivery may drift in Doze.');
    }

    if (!(await needsRescheduling())) {
      console.log('[naqlNotifications] existing schedule has enough runway, skipping');
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

        const naqlNumber = pickScheduledNaql(day, slot);
        notifications.push({
          id: ID_BASE + day * TIMES_OF_DAY.length + slot,
          title: `Naql ${naqlNumber}`,
          body: jsxToPlainText(nuqoolObject[naqlNumber], PREVIEW_LENGTH),
          largeBody: jsxToPlainText(nuqoolObject[naqlNumber], FULL_LENGTH),
          schedule: { at: target, allowWhileIdle: exactAlarmsAvailable },
          extra: { naqlNumber },
          channelId: CHANNEL_ID,
        });
      });
    }

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

async function handleScheduleError(err) {

  /*
   * Different OEM WebViews/plugin versions phrase batch-scheduling
   * failures differently, so we don't try to pattern-match a specific
   * error string anymore — if the whole batch failed, just clear
   * whatever partial state exists and let the next resume retry clean.
   */

  console.error('[naqlNotifications] full scheduling error', err);
  try {
    const allPending = await LocalNotifications.getPending();
    const ours = allPending.notifications.filter(
      (n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE
    );
    for (let i = 0; i < ours.length; i += BATCH_SIZE) {
      const batch = ours.slice(i, i + BATCH_SIZE);
      await LocalNotifications.cancel({ notifications: batch.map((n) => ({ id: n.id })) });
    }
  } catch (clearErr) {
    console.error('[naqlNotifications] failed to clear after error', clearErr);
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
  const notification = {
    id: 1,
    title: `Naql ${naqlNumber}`,
    body: jsxToPlainText(nuqoolObject[naqlNumber], PREVIEW_LENGTH),
    largeBody: jsxToPlainText(nuqoolObject[naqlNumber], FULL_LENGTH),
    schedule: { at: new Date(Date.now() + secondsFromNow * 1000) },
    extra: { naqlNumber },
    channelId: CHANNEL_ID,
  };

  await LocalNotifications.schedule({ notifications: [notification] });
}

export function onNaqlNotificationTapped(onOpenNaql) {
  if (!Capacitor.isNativePlatform()) return () => {};
  let handle;

  /* Listen for a notification tap action and forward the requested Naql number. */
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const naqlNumber = action.notification?.extra?.naqlNumber;
    if (naqlNumber != null) onOpenNaql(naqlNumber);
  }).then((h) => { handle = h; });
  return () => handle?.remove();
}

/**
 * Call once from App.jsx. Schedules immediately, and re-checks every time
 * the app returns to the foreground — Capacitor's own docs recommend this
 * exact pattern, since the OS can wipe exact alarms out from under you if
 * the user flips the "Alarms & reminders" setting off.
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