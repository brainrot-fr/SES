import { Capacitor, registerPlugin } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const NativeNotificationSettings = registerPlugin("NotificationSettings");

export async function getNotificationReadiness() {
  if (!Capacitor.isNativePlatform()) return null;

  const permission = await LocalNotifications.checkPermissions();
  const readiness = { displayGranted: permission.display === "granted" };
  if (Capacitor.getPlatform() !== "android") return readiness;

  const [exact, nativeStatus] = await Promise.all([
    LocalNotifications.checkExactNotificationSetting(),
    NativeNotificationSettings.getStatus(),
  ]);
  return {
    ...readiness,
    displayGranted: readiness.displayGranted && nativeStatus.notificationsEnabled !== false,
    exactAlarmGranted: exact.exact_alarm === "granted" && nativeStatus.exactAlarmGranted !== false,
    batteryOptimizationExempt: nativeStatus.batteryOptimizationExempt === true,
  };
}

export async function requestNotificationPermission() {
  return LocalNotifications.requestPermissions();
}

export async function openExactAlarmSettings() {
  return LocalNotifications.changeExactNotificationSetting();
}

export async function openBatteryOptimizationSettings() {
  return NativeNotificationSettings.openBatteryOptimizationSettings();
}
