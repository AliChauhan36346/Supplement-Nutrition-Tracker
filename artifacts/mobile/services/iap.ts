import { Alert, Platform } from "react-native";

import {
  PREMIUM_ENTITLEMENT_ID,
  PREMIUM_PRODUCT_ID,
  PREMIUM_STORE_IDENTIFIER,
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
  // Prefer platform-specific Google key; fall back to generic.
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

let configured = false;

export async function configureIAP(): Promise<void> {
  if (configured || Platform.OS === "web") return;
  const apiKey = revenueCatApiKey();
  if (!apiKey) return;
  const Purchases = await getPurchasesModule();
  if (!Purchases) return;
  try {
    Purchases.configure({ apiKey });
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

  const byStoreId = packages.find(
    (p) =>
      p.product?.identifier === PREMIUM_STORE_IDENTIFIER ||
      p.product?.identifier === PREMIUM_PRODUCT_ID ||
      String(p.product?.identifier ?? "").includes(PREMIUM_PRODUCT_ID)
  );
  if (byStoreId) return byStoreId;

  const monthly = packages.find(
    (p) =>
      p.packageType === "MONTHLY" ||
      String(p.identifier ?? "")
        .toLowerCase()
        .includes("monthly") ||
      String(p.product?.identifier ?? "")
        .toLowerCase()
        .includes("monthly")
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
      message:
        "Missing RevenueCat Google API key. Set EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY (starts with goog_).",
    };
  }

  const Purchases = await getPurchasesModule();
  if (!Purchases) {
    return {
      status: "unavailable",
      message:
        "Billing needs an EAS/dev build with react-native-purchases (Expo Go cannot subscribe).",
    };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const pkg = pickPremiumPackage(offerings);

    if (!pkg) {
      return {
        status: "unavailable",
        message: `No Premium offering found. In RevenueCat, attach ${PREMIUM_STORE_IDENTIFIER} to entitlement "${PREMIUM_ENTITLEMENT_ID}" and set an Offering as Current.`,
      };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (hasPremium(customerInfo)) {
      const ent = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
      const isTrial = Boolean(ent?.periodType === "TRIAL" || ent?.periodType === "INTRO");
      return { status: "purchased", isTrial };
    }
    return {
      status: "error",
      message: `Purchase finished but entitlement "${PREMIUM_ENTITLEMENT_ID}" is not active.`,
    };
  } catch (err: unknown) {
    const e = err as { userCancelled?: boolean; message?: string; code?: string };
    if (e?.userCancelled) return { status: "cancelled" };
    return {
      status: "error",
      message: e?.message ?? "Purchase failed",
    };
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
  return `${PREMIUM_TRIAL_DAYS}-day free trial.${price} Cancel anytime in Google Play.`;
}
