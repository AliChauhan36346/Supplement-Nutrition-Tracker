import { Alert, Platform } from "react-native";

import {
  PREMIUM_ENTITLEMENT_ID,
  IAP_PRODUCTS,
  PREMIUM_TRIAL_DAYS,
} from "@/constants/iap";

export type PurchaseResult =
  | { status: "purchased"; isTrial?: boolean }
  | { status: "restored" }
  | { status: "cancelled" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export type PremiumPackageInfo = {
  identifier: string;
  productId: string;
  title: string;
  description: string;
  priceString: string;
  introPriceString?: string;
};

function revenueCatApiKey(): string | undefined {
  if (Platform.OS === "android") {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ||
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
    );
  }
  if (Platform.OS === "ios") {
    return (
      process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ||
      process.env.EXPO_PUBLIC_REVENUECAT_API_KEY
    );
  }
  return process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
}

async function getPurchasesModule(): Promise<any | null> {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-purchases");
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

async function getPurchasesUIModule(): Promise<any | null> {
  if (Platform.OS === "web") return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-purchases-ui");
    return mod?.default ?? mod;
  } catch {
    return null;
  }
}

let configured = false;
const premiumStatusListeners = new Set<(isPremium: boolean) => void>();

function notifyPremiumStatus(customerInfo: {
  entitlements?: { active?: Record<string, unknown> };
}) {
  const isPremium = hasPremium(customerInfo);
  for (const listener of premiumStatusListeners) listener(isPremium);
}

export async function configureIAP(): Promise<void> {
  if (configured || Platform.OS === "web") return;
  const apiKey = revenueCatApiKey();
  if (!apiKey) return;
  const Purchases = await getPurchasesModule();
  if (!Purchases) return;
  try {
    Purchases.configure({ apiKey });
    if (typeof Purchases.addCustomerInfoUpdateListener === "function") {
      Purchases.addCustomerInfoUpdateListener(notifyPremiumStatus);
    }
    configured = true;
  } catch {
    // Expo Go / missing native module — ignore
  }
}

function hasPremium(customerInfo: {
  entitlements?: { active?: Record<string, unknown> };
}): boolean {
  return Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID]);
}

function pickPremiumPackage(offerings: any): any | null {
  const current = offerings?.current;
  if (!current?.availablePackages?.length) return null;

  const packages = current.availablePackages as any[];

  // Try to find monthly first as the default
  const monthly = packages.find(
    (p) =>
      p.packageType === "MONTHLY" ||
      String(p.identifier ?? "").toLowerCase().includes("monthly")
  );
  return monthly ?? packages[0] ?? null;
}

/** Load price / trial copy from the current RevenueCat offering. */
export async function getPremiumPackageInfo(): Promise<PremiumPackageInfo | null> {
  await configureIAP();
  const Purchases = await getPurchasesModule();
  if (!Purchases || !revenueCatApiKey()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = pickPremiumPackage(offerings);
    if (!pkg?.product) return null;
    const product = pkg.product;
    return {
      identifier: pkg.identifier,
      productId: product.identifier,
      title: product.title ?? "Premium",
      description: product.description ?? "",
      priceString: product.priceString ?? "",
      introPriceString: product.introPrice?.priceString,
    };
  } catch {
    return null;
  }
}

/** Presents the RevenueCat Paywall overlay */
export async function purchasePremium(): Promise<PurchaseResult> {
  await configureIAP();
  const apiKey = revenueCatApiKey();

  if (Platform.OS === "web") {
    return {
      status: "unavailable",
      message: "Premium subscriptions are available on the Android app.",
    };
  }

  if (!apiKey) {
    return {
      status: "unavailable",
      message: "Missing RevenueCat API key.",
    };
  }

  const PurchasesUI = await getPurchasesUIModule();
  if (!PurchasesUI) {
    return {
      status: "unavailable",
      message:
        "Billing UI needs a Dev client build with react-native-purchases-ui.",
    };
  }

  try {
    // Show native paywall configured in RevenueCat dashboard
    const result = await PurchasesUI.presentPaywall();

    // Result can be PURCHASED, RESTORED, CANCELLED, etc.
    if (result === "PURCHASED" || result === "RESTORED") {
      const Purchases = await getPurchasesModule();
      const customerInfo = await Purchases.getCustomerInfo();

      const ent = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
      const isTrial = Boolean(ent?.periodType === "TRIAL" || ent?.periodType === "INTRO");

      return { status: "purchased", isTrial };
    }

    if (result === "CANCELLED") {
      return { status: "cancelled" };
    }

    return {
      status: "error",
      message: "Purchase was not completed.",
    };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string };
    if (e?.userCancelled) return { status: "cancelled" };
    return {
      status: "error",
      message: e?.message ?? "Purchase failed",
    };
  }
}

/** Presents the RevenueCat Customer Center */
export async function presentCustomerCenter(): Promise<void> {
  await configureIAP();
  const PurchasesUI = await getPurchasesUIModule();
  if (!PurchasesUI) {
    Alert.alert(
      "Subscription Management",
      "Customer Center needs a Dev client build."
    );
    return;
  }
  try {
    await PurchasesUI.presentCustomerCenter();
  } catch (err) {
    console.error("Error opening Customer Center:", err);
    Alert.alert(
      "Subscription Management",
      "Could not open subscription management at this time."
    );
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  await configureIAP();
  const Purchases = await getPurchasesModule();
  if (!Purchases || !revenueCatApiKey()) {
    return {
      status: "unavailable",
      message: "Restore needs an Android store build with RevenueCat configured.",
    };
  }
  try {
    const info = await Purchases.restorePurchases();
    if (hasPremium(info)) return { status: "restored" };
    return { status: "error", message: "No active Premium subscription found." };
  } catch (err: unknown) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Restore failed",
    };
  }
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  await configureIAP();
  const Purchases = await getPurchasesModule();
  if (!Purchases || !revenueCatApiKey()) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return hasPremium(info);
  } catch {
    return false;
  }
}

/**
 * Subscribe to RevenueCat entitlement changes while the app is running.
 * Returns null when RevenueCat is unavailable, so callers do not accidentally
 * downgrade a user during offline or Expo Go development.
 */
export async function getPremiumEntitlementStatus(): Promise<boolean | null> {
  await configureIAP();
  const Purchases = await getPurchasesModule();
  if (!Purchases || !revenueCatApiKey()) return null;
  try {
    const info = await Purchases.getCustomerInfo();
    return hasPremium(info);
  } catch {
    return null;
  }
}

export function subscribeToPremiumStatus(
  listener: (isPremium: boolean) => void
): () => void {
  premiumStatusListeners.add(listener);
  void configureIAP();
  return () => premiumStatusListeners.delete(listener);
}

export function explainIAPUnavailable(message: string, onDevUnlock?: () => void) {
  const buttons: {
    text: string;
    style?: "cancel" | "destructive";
    onPress?: () => void;
  }[] = [{ text: "OK", style: "cancel" }];
  if (__DEV__ && onDevUnlock) {
    buttons.push({ text: "Dev Unlock", onPress: onDevUnlock });
  }
  Alert.alert("Premium", message, buttons);
}

export function premiumTrialCopy(priceString?: string): string {
  const price = priceString ? ` Then ${priceString}.` : " Then the regular subscription price.";
  return `${PREMIUM_TRIAL_DAYS}-day free trial.${price} Cancel anytime.`;
}
