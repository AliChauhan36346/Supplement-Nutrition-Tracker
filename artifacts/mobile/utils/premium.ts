import { Alert } from "react-native";
import { router } from "expo-router";

import { FREE_SUPPLEMENT_LIMIT } from "@/constants/limits";
import { PREMIUM_TRIAL_DAYS } from "@/constants/iap";
import {
  explainIAPUnavailable,
  getPremiumEntitlementStatus,
  purchasePremium,
  restorePurchases,
  subscribeToPremiumStatus,
} from "@/services/iap";

/** Show premium upsell — presents the native RevenueCat Paywall. */
export async function showPremiumUpsell(onUnlock?: () => void) {
  const result = await purchasePremium();

  if (result.status === "purchased") {
    onUnlock?.();
    Alert.alert(
      result.isTrial ? "Trial started" : "Welcome to Premium",
      result.isTrial
        ? `Your ${PREMIUM_TRIAL_DAYS}-day free trial is active. You will not be charged until it ends.`
        : "VitaRoutine Pro is active! Thank you for your support."
    );
    return;
  }

  if (result.status === "restored") {
    onUnlock?.();
    Alert.alert("Restored", "VitaRoutine Pro is active on this device.");
    return;
  }

  if (result.status === "cancelled") {
    return;
  }

  if (result.status === "unavailable") {
    // In Dev/Expo Go, this will allow unlocking the app for testing
    explainIAPUnavailable(result.message, onUnlock);
    return;
  }

  if (result.status === "error") {
    Alert.alert("Purchase failed", result.message);
  }
}

export function promptFreeLimitReached(onUnlock?: () => void) {
  Alert.alert(
    "Free Plan Limit",
    `Free accounts can track up to ${FREE_SUPPLEMENT_LIMIT} supplements. Start a ${PREMIUM_TRIAL_DAYS}-day free VitaRoutine Pro trial for unlimited tracking.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "View Premium",
        onPress: () => {
          if (onUnlock) {
            void showPremiumUpsell(onUnlock);
          } else {
            router.push("/(tabs)/profile");
          }
        },
      },
    ]
  );
}

/** Call on app start to refresh entitlement from the store. */
export async function refreshPremiumFromStore(
  setPremium: (v: boolean) => void
): Promise<void> {
  try {
    const entitled = await getPremiumEntitlementStatus();
    // A null result means RevenueCat is unavailable; preserve local state then.
    if (entitled !== null) setPremium(entitled);
  } catch {
    // offline / Expo Go — keep local flag
  }
}

/** Keep local premium state aligned with RevenueCat while the app is open. */
export function watchPremiumEntitlement(
  setPremium: (v: boolean) => void
): () => void {
  return subscribeToPremiumStatus(setPremium);
}
