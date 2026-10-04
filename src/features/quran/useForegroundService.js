import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";

const FG_NOTIFICATION_ID = 5501;
const FG_CHANNEL_ID = "quran-playback-v2";
const isAndroid = () => Capacitor.getPlatform() === "android";

let channelReady = false;
let foregroundServiceStarted = false;
let foregroundServiceQueue = Promise.resolve();
let lastForegroundKey = "";

function enqueueForegroundOperation(operation) {
  const result = foregroundServiceQueue.then(operation, operation);
  foregroundServiceQueue = result.catch(() => {});
  return result;
}

async function ensureForegroundChannel() {
  if (!isAndroid() || channelReady) return;
  try {
    if (typeof ForegroundService.deleteNotificationChannel === "function") {
      ForegroundService.deleteNotificationChannel({ id: "quran-playback" }).catch(() => {});
    }
    await ForegroundService.createNotificationChannel({
      id: FG_CHANNEL_ID,
      name: "Quran playback",
      description: "Shown while Quran audio is playing",
      importance: 2,
    });
    channelReady = true;
  } catch (error) {
    console.warn("[quranAudio] createNotificationChannel failed", error);
  }
}

async function startForeground(title, body) {
  await ensureForegroundChannel();
  await ForegroundService.startForegroundService({
    id: FG_NOTIFICATION_ID,
    title,
    body,
    smallIcon: "ic_quran_notification",
    notificationChannelId: FG_CHANNEL_ID,
    silent: true,
  });
  foregroundServiceStarted = true;
}

async function updateForeground(title, body) {
  if (!isAndroid()) return;
  return enqueueForegroundOperation(async () => {
    try {
      if (!foregroundServiceStarted) {
        await startForeground(title, body);
        return;
      }
      await ForegroundService.updateForegroundService({
        id: FG_NOTIFICATION_ID,
        title,
        body,
        smallIcon: "ic_quran_notification",
      });
    } catch (error) {
      foregroundServiceStarted = false;
      console.warn("[quranAudio] foreground service update failed", error);
    }
  });
}

function syncForegroundNotification(surahName, reciterName) {
  const key = `${surahName}|${reciterName}`;
  if (key === lastForegroundKey) return;
  lastForegroundKey = key;
  updateForeground(surahName, reciterName);
}

async function stopForegroundService() {
  if (!isAndroid()) {
    lastForegroundKey = "";
    return;
  }
  return enqueueForegroundOperation(async () => {
    try {
      if (foregroundServiceStarted) {
        await ForegroundService.stopForegroundService();
      }
    } catch {
      // The service may already have been stopped by Android.
    } finally {
      foregroundServiceStarted = false;
      lastForegroundKey = "";
    }
  });
}

export function useForegroundService() {
  const syncForeground = useCallback(syncForegroundNotification, []);
  const stopForeground = useCallback(stopForegroundService, []);
  return { syncForeground, stopForeground };
}
