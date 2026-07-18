/**
 * Google Play + RevenueCat billing configuration.
 */

// Entitlement ID from RevenueCat dashboard
export const PREMIUM_ENTITLEMENT_ID = "VitaRoutine Pro";

// Product identifiers on Google Play Console
export const PRODUCT_MONTHLY = "com.vitaroutine.app.monthly";
export const PRODUCT_YEARLY = "com.vitaroutine.app.yearly";
export const PRODUCT_LIFETIME = "com.vitaroutine.app.lifetime";

// Subscriptions base plan IDs
export const BASE_PLAN_MONTHLY = "monthly-plan";
export const BASE_PLAN_YEARLY = "yearly-plan";

// Complete store identifiers (ProductId:BasePlanId for subscriptions; ProductId for one-time IAP)
export const STORE_ID_MONTHLY = `${PRODUCT_MONTHLY}:${BASE_PLAN_MONTHLY}`;
export const STORE_ID_YEARLY = `${PRODUCT_YEARLY}:${BASE_PLAN_YEARLY}`;
export const STORE_ID_LIFETIME = PRODUCT_LIFETIME; // Lifetime is a one-time purchase

export const PREMIUM_TRIAL_DAYS = 30;

export const IAP_PRODUCTS = {
  monthly: STORE_ID_MONTHLY,
  yearly: STORE_ID_YEARLY,
  lifetime: STORE_ID_LIFETIME,
} as const;
