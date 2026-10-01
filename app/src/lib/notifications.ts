import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

const CHANNEL = "alerts";
let cached: NotificationsModule | null | undefined;

/**
 * Loads expo-notifications lazily. In Expo Go on Android the module throws on import
 * (push support was removed from Expo Go in SDK 53), so there we skip it: alerts still
 * vibrate and appear in the app, and system notifications work in the installed APK.
 */
function load(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === "android" && isRunningInExpoGo()) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications") as NotificationsModule;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    cached = Notifications;
  } catch {
    cached = null;
  }
  return cached;
}

/** Ask for notification permission once (first launch) and set up the Android channel. */
export async function initNotifications(): Promise<boolean> {
  const Notifications = load();
  if (!Notifications) return false;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: "Station alerts",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: "#B42318",
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "granted") return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === "granted";
  } catch {
    return false;
  }
}

/** Show a local notification immediately (no-op where notifications are unavailable). */
export async function notify(title: string, body: string): Promise<void> {
  const Notifications = load();
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}) },
      trigger: null,
    });
  } catch {
    // Permission denied; the in-app list still updates.
  }
}
