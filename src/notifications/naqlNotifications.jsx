// src/notifications/naqlNotifications.js
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { renderToStaticMarkup } from 'react-dom/server';
import { nuqoolObject } from '../nuqool/nuqool.jsx';

const ID_BASE = 90000;
const ID_RANGE = 10000;
const DAYS_AHEAD = 90;

const TIMES_OF_DAY = [
  { hour: 8, minute: 0 },
  { hour: 13, minute: 47 },
  { hour: 13, minute: 48 },
  { hour: 13, minute: 49 },
  { hour: 13, minute: 50 },
  { hour: 13, minute: 51 },
];

const PREVIEW_LENGTH = 100; // collapsed one-liner
const FULL_LENGTH = 800;    // expanded "big text" — safety cap, not a real limit for your content

function jsxToPlainText(node, maxLength) {
  const html = renderToStaticMarkup(node);
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

const naqlNumbers = Object.keys(nuqoolObject)
  .map(Number)
  .filter((n) => jsxToPlainText(nuqoolObject[n], FULL_LENGTH).length > 0);

function pickRandomNaql() {
  return naqlNumbers[Math.floor(Math.random() * naqlNumbers.length)];
}

async function cancelPendingNaqlNotifications() {
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter(
    (n) => n.id >= ID_BASE && n.id < ID_BASE + ID_RANGE
  );
  if (ours.length) {
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  }
}

export async function scheduleDailyNaqlNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  let perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;
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
    await LocalNotifications.schedule({ notifications });
  }
}

// Calls onOpenNaql(naqlNumber) whenever the user taps one of our
// notifications — including the one that launched the app from a fully
// killed state, since Capacitor replays the triggering event to the first
// listener registered after launch. Register this as early as possible
// (top-level App effect), not deep inside some lazily-mounted page.
export function onNaqlNotificationTapped(onOpenNaql) {
  if (!Capacitor.isNativePlatform()) return () => {};

  let handle;
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const naqlNumber = action.notification?.extra?.naqlNumber;
    if (naqlNumber != null) onOpenNaql(naqlNumber);
  }).then((h) => { handle = h; });

  return () => handle?.remove();
}