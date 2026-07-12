import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";

import { type Supplement } from "@/context/SupplementContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  if (Platform.OS === "web") return "denied";
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return "granted";
    if (status === "denied") return "denied";
    return "undetermined";
  } catch {
    return "undetermined";
  }
}

function mealLabel(timing: string): string {
  switch (timing) {
    case "with_food":
      return " · With food";
    case "before_food":
      return " · Before food";
    case "after_food":
      return " · After food";
    default:
      return "";
  }
}

function parseTime(time: string): { hour: number; minute: number } {
  const parts = time.split(":");
  return {
    hour: parseInt(parts[0] ?? "8", 10),
    minute: parseInt(parts[1] ?? "0", 10),
  };
}

async function scheduleOne(
  sup: Supplement,
  time: string,
  trigger: Notifications.NotificationTriggerInput
): Promise<boolean> {
  const body = `Take your ${sup.dosage} ${sup.unit}${mealLabel(sup.mealTiming)}`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Time for ${sup.name}`,
      body,
      sound: true,
      data: { supplementId: sup.id, screen: "home" },
    },
    trigger,
  });
  return true;
}

export async function scheduleSupplementNotifications(
  supplements: Supplement[],
  options?: { enabled?: boolean }
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (options?.enabled === false) return;

    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const active = supplements.filter(
      (s) => s.isActive && s.remindersEnabled !== false
    );
    let scheduled = 0;
    const IOS_LIMIT = 60;

    for (const sup of active) {
      if (scheduled >= IOS_LIMIT) break;

      for (const time of sup.times) {
        if (scheduled >= IOS_LIMIT) break;
        const { hour, minute } = parseTime(time);

        if (sup.frequency === "once_daily" || sup.frequency === "twice_daily") {
          await scheduleOne(sup, time, {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          });
          scheduled++;
        } else if (sup.frequency === "custom_days" && sup.customDays?.length) {
          for (const dow of sup.customDays) {
            if (scheduled >= IOS_LIMIT) break;
            await scheduleOne(sup, time, {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: dow + 1,
              hour,
              minute,
            });
            scheduled++;
          }
        } else if (sup.frequency === "weekly") {
          const dow = new Date(sup.startDate + "T12:00:00").getDay();
          await scheduleOne(sup, time, {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dow + 1,
            hour,
            minute,
          });
          scheduled++;
        } else if (sup.frequency === "monthly") {
          // Schedule the next 6 monthly occurrences as calendar dates
          const startDay = new Date(sup.startDate + "T12:00:00").getDate();
          const now = new Date();
          for (let i = 0; i < 6 && scheduled < IOS_LIMIT; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, startDay, hour, minute, 0);
            if (d <= now) continue;
            await scheduleOne(sup, time, {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: d,
            });
            scheduled++;
          }
        }
      }
    }
  } catch {
    // swallow scheduling errors — reminders are best-effort
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

/** Navigate to Home and highlight the dose when user taps a reminder. */
export function setupNotificationResponseHandler(): () => void {
  if (Platform.OS === "web") return () => {};

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as {
      supplementId?: string;
    };
    const supplementId = data?.supplementId;
    router.push(
      (supplementId
        ? `/(tabs)/index?highlightId=${encodeURIComponent(supplementId)}`
        : "/(tabs)/index") as `/`
    );
  });

  return () => sub.remove();
}
