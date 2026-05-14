import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

function mealLabel(timing: string): string {
  switch (timing) {
    case "with_food": return " · With food";
    case "before_food": return " · Before food";
    case "after_food": return " · After food";
    default: return "";
  }
}

export async function scheduleSupplementNotifications(
  supplements: Supplement[]
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const active = supplements.filter((s) => s.isActive);
    let scheduled = 0;
    const IOS_LIMIT = 60;

    for (const sup of active) {
      if (scheduled >= IOS_LIMIT) break;

      for (const time of sup.times) {
        if (scheduled >= IOS_LIMIT) break;

        const parts = time.split(":");
        const hour = parseInt(parts[0] ?? "8", 10);
        const minute = parseInt(parts[1] ?? "0", 10);

        const body = `Take your ${sup.dosage} ${sup.unit}${mealLabel(sup.mealTiming)}`;

        if (sup.frequency === "once_daily" || sup.frequency === "twice_daily") {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Time for ${sup.name}`,
              body,
              sound: true,
              data: { supplementId: sup.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour,
              minute,
              repeats: true,
            },
          });
          scheduled++;
        } else if (sup.frequency === "custom_days" && sup.customDays?.length) {
          for (const dow of sup.customDays) {
            if (scheduled >= IOS_LIMIT) break;
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Time for ${sup.name}`,
                body,
                sound: true,
                data: { supplementId: sup.id },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: dow + 1,
                hour,
                minute,
                repeats: true,
              },
            });
            scheduled++;
          }
        } else if (sup.frequency === "weekly") {
          const dow = new Date(sup.startDate + "T12:00:00").getDay();
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Time for ${sup.name}`,
              body,
              sound: true,
              data: { supplementId: sup.id },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: dow + 1,
              hour,
              minute,
              repeats: true,
            },
          });
          scheduled++;
        }
      }
    }
  } catch {
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}
