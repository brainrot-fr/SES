// src/notifications/naqlNotifications.js
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { renderToStaticMarkup } from 'react-dom/server';
import { nuqoolObject } from '../nuqool/nuqool.jsx';

const ID_BASE = 90000;
const ID_RANGE = 10000;
const DAYS_AHEAD = 14;

const TIMES_OF_DAY = [
  { hour: 8, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 20, minute: 0 },
];

const PREVIEW_LENGTH = 100;
const FULL_LENGTH = 800;

// React's renderToStaticMarkup only ever escapes these five characters in
// text content — decode them back so "Ma'ud" doesn't show up as "Ma&#x27;ud".
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

async function cancelPendingNaqlNotifications() {
  try {
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(
      (n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE
    );
    if (ours.length > 0) {
      console.log(`[naqlNotifications] cancelling ${ours.length} old notifications`);
      // Cancel in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < ours.length; i += batchSize) {
        const batch = ours.slice(i, i + batchSize);
        await LocalNotifications.cancel({ notifications: batch.map((n) => ({ id: n.id })) });
      }
    }
  } catch (err) {
    console.error('[naqlNotifications] error during cancel', err);
    // Don't throw - this is not fatal
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

    // Check if we already have notifications scheduled for today
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

    // Always cancel old notifications first to avoid hitting the 500-alarm limit
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
        const result = await LocalNotifications.schedule({ notifications });
        console.log('[naqlNotifications] scheduled', result.notifications.length, 'notifications');
      } catch (scheduleErr) {
        console.error('[naqlNotifications] schedule call failed', scheduleErr);
        // Handle 500-alarm limit
        if (scheduleErr?.toString?.().includes('500')) {
          console.error('[naqlNotifications] hit 500-alarm limit, attempting full clear');
          try {
            const allPending = await LocalNotifications.getPending();
            if (allPending.notifications.length > 0) {
              console.log(`[naqlNotifications] clearing ALL ${allPending.notifications.length} notifications`);
              const batchSize = 50;
              for (let i = 0; i < allPending.notifications.length; i += batchSize) {
                const batch = allPending.notifications.slice(i, i + batchSize);
                await LocalNotifications.cancel({ notifications: batch.map((n) => ({ id: n.id })) });
              }
              console.log('[naqlNotifications] cleared all notifications');
            }
          } catch (clearErr) {
            console.error('[naqlNotifications] failed to clear alarms', clearErr);
          }
        }
        throw scheduleErr;
      }
    }
  } catch (err) {
    console.error('[naqlNotifications] fatal error in scheduleDailyNaqlNotifications', err);
    // Don't re-throw - this should not crash the app
  }
}

// Fire-and-forget test helper — no allowWhileIdle, no 9-minute throttle,
// safe to call repeatedly seconds apart while you're iterating.
export async function scheduleTestNotification(secondsFromNow = 10) {
  if (!Capacitor.isNativePlatform()) return;
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

export function onNaqlNotificationTapped(onOpenNaql) {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle;
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const naqlNumber = action.notification?.extra?.naqlNumber;
    if (naqlNumber != null) onOpenNaql(naqlNumber);
  }).then((h) => { handle = h; });

  return () => handle?.remove();
}