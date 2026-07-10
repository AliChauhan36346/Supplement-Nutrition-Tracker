import { Alert } from "react-native";
import { router } from "expo-router";

import { FREE_SUPPLEMENT_LIMIT } from "@/constants/limits";

/** Show honest premium upsell (no fake App Store trial yet). */
export function showPremiumUpsell(onUnlock?: () => void) {
  Alert.alert(
    "Unlock Premium (Beta)",
    `Premium includes unlimited supplements (free plan: ${FREE_SUPPLEMENT_LIMIT}), barcode scanning, and Supplement Coach tips.\n\nIn-app purchases are not connected yet. Unlock locally for testing until store billing ships.`,
    [
      { text: "Maybe Later", style: "cancel" },
      {
        text: "Unlock Premium",
        onPress: onUnlock,
      },
    ]
  );
}

export function promptFreeLimitReached(onUnlock?: () => void) {
  Alert.alert(
    "Free Plan Limit",
    `Free accounts can track up to ${FREE_SUPPLEMENT_LIMIT} supplements. Upgrade to Premium for unlimited tracking.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "View Premium",
        onPress: () => {
          if (onUnlock) {
            showPremiumUpsell(onUnlock);
          } else {
            router.push("/(tabs)/profile");
          }
        },
      },
    ]
  );
}
