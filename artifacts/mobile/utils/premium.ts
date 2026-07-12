import { Alert } from "react-native";
import { router } from "expo-router";

import { FREE_SUPPLEMENT_LIMIT } from "@/constants/limits";
import { PREMIUM_TRIAL_DAYS } from "@/constants/iap";
import {
  checkPremiumEntitlement,
  explainIAPUnavailable,
  getPremiumPackageInfo,
  premiumTrialCopy,
  purchasePremium,
  restorePurchases,
} from "@/services/iap";

/** Show premium upsell — 30-day free trial then subscription. */
export async function showPremiumUpsell(onUnlock?: () => void) {
  const info = await getPremiumPackageInfo();
  const priceLine = premiumTrialCopy(info?.priceString);

  Alert.alert(
    "Start Premium free trial",
    `Premium includes unlimited supplements (free: ${FREE_SUPPLEMENT_LIMIT}), barcode scanning, and Supplement Coach.\n\n${priceLine}`,
    [
      { text: "Maybe Later", style: "cancel" },
      {
        text: "Restore",
        onPress: async () => {
          const result = await restorePurchases();
          if (result.status === "restored") {
            onUnlock?.();
            Alert.alert("Restored", "Premium is active on this device.");
            return;
          }
          if (result.status === "unavailable") {
            explainIAPUnavailable(result.message, onUnlock);
            return;
          }
          if (result.status === "error") {
            Alert.alert("Restore", result.message);
          }
        },
      },
      {
        text: `Start ${PREMIUM_TRIAL_DAYS}-day trial`,
        onPress: async () => {
          const result = await purchasePremium();
          if (result.status === "purchased") {
            onUnlock?.();
            Alert.alert(
              result.isTrial ? "Trial started" : "Welcome to Premium",
              result.isTrial
                ? `Your ${PREMIUM_TRIAL_DAYS}-day free trial is active. You will not be charged until it ends.`
                : "Unlimited tracking is unlocked."
            );
            return;
          }
          if (result.status === "cancelled") return;
          if (result.status === "unavailable") {
            explainIAPUnavailable(result.message, onUnlock);
            return;
          }
          if (result.status === "error") {
            Alert.alert("Purchase failed", result.message);
          }
        },
      },
    ]
  );
}

export function promptFreeLimitReached(onUnlock?: () => void) {
  Alert.alert(
    "Free Plan Limit",
    `Free accounts can track up to ${FREE_SUPPLEMENT_LIMIT} supplements. Start a ${PREMIUM_TRIAL_DAYS}-day free Premium trial for unlimited tracking.`,
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
    const entitled = await checkPremiumEntitlement();
    // Only force-on when store confirms; never wipe local flag when RC unavailable.
    if (entitled) setPremium(true);
  } catch {
    // offline / Expo Go — keep local flag
  }
}
