import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CHANNEL = "alerts";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Ask for notification permission once (first launch) and set up the Android channel. */
export async function initNotifications(): Promise<boolean> {
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

/** Show a local notification immediately. */
export async function notify(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}) },
      trigger: null,
    });
  } catch {
    // Notifications unavailable (permission denied); the in-app list still updates.
  }
}
