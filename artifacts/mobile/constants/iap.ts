/**
 * Google Play + RevenueCat billing config.
 *
 * Play Console:
 *   Subscription product ID: com.vitaroutine.app.premium
 *   Base plan ID:            monthly
 *   Offer:                   30-day free trial, then recurring monthly
 *
 * RevenueCat:
 *   Entitlement ID:          premium
 *   Offering:                default (set as Current)
 *   Package:                 links to the Play subscription above
 */
export const PREMIUM_ENTITLEMENT_ID = "premium";

/** Play subscription product ID (Subscriptions, not one-time IAP). */
export const PREMIUM_PRODUCT_ID = "com.vitaroutine.app.premium";

/** Play base plan ID under that subscription. */
export const PREMIUM_BASE_PLAN_ID = "monthly";

/**
 * RevenueCat / Play identifier for Google subscriptions (productId:basePlanId).
 * Match this when attaching the product in RevenueCat.
 */
export const PREMIUM_STORE_IDENTIFIER = `${PREMIUM_PRODUCT_ID}:${PREMIUM_BASE_PLAN_ID}`;

export const PREMIUM_TRIAL_DAYS = 30;

export const IAP_PRODUCTS = {
  premiumMonthly: PREMIUM_STORE_IDENTIFIER,
} as const;
