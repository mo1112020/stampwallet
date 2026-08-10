import type { Plan } from "@/types";

export type PlanLimits = {
  maxActivePrograms: number | null;
  maxActiveCustomers: number | null;
  maxSeats: number | null;
  maxLocations: number | null;
  customBranding: boolean;
  /** Card expiration (config.expiration) — Paid plans only. */
  cardExpiration: boolean;
};

/** `null` means unlimited — prefer this over magic-number sentinels. */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxActivePrograms: 1,
    maxActiveCustomers: 100,
    maxSeats: 1,
    maxLocations: 1,
    customBranding: false,
    cardExpiration: false,
  },
  starter: {
    maxActivePrograms: 3,
    maxActiveCustomers: 1000,
    maxSeats: 3,
    maxLocations: 3,
    customBranding: true,
    cardExpiration: true,
  },
  pro: {
    maxActivePrograms: 20,
    maxActiveCustomers: 10000,
    maxSeats: 10,
    maxLocations: 20,
    customBranding: true,
    cardExpiration: true,
  },
  enterprise: {
    maxActivePrograms: null,
    maxActiveCustomers: null,
    maxSeats: null,
    maxLocations: null,
    customBranding: true,
    cardExpiration: true,
  },
};

/** `limit === null` means unlimited, so the count is always within it. */
export function isWithinLimit(count: number, limit: number | null): boolean {
  return limit === null || count < limit;
}

/** Self-serve checkout only exists for these two — Enterprise is
 * contact-sales (no price, no checkout button; see billing-content.tsx),
 * and free has nothing to buy. */
export type PaidPlan = "starter" | "pro";
export type PlanInterval = "monthly" | "quarterly" | "yearly";

/** Flat pricing, seats included up to PLAN_LIMITS[plan].maxSeats — NOT
 * multiplied by staff count. USD cents, matching Stripe's unit_amount
 * convention — see scripts/seed-stripe-catalog.ts, which created these
 * exact amounts. Also the display source of truth for the marketing
 * pricing page (no live price-preview API call, see pricing-plans.tsx). */
export const PLAN_PRICES_USD_CENTS: Record<PaidPlan, Record<PlanInterval, number>> = {
  starter: { monthly: 2900, quarterly: 8300, yearly: 29000 },
  pro: { monthly: 7900, quarterly: 22500, yearly: 79000 },
};

/** Env var names (not the price IDs themselves — those differ between
 * test and live mode, see .env.example's comment above the Stripe block)
 * holding each plan+interval's Stripe price ID. */
export const STRIPE_PRICE_ENV: Record<PaidPlan, Record<PlanInterval, string>> = {
  starter: {
    monthly: "STRIPE_PRICE_STARTER_MONTHLY",
    quarterly: "STRIPE_PRICE_STARTER_QUARTERLY",
    yearly: "STRIPE_PRICE_STARTER_YEARLY",
  },
  pro: {
    monthly: "STRIPE_PRICE_PRO_MONTHLY",
    quarterly: "STRIPE_PRICE_PRO_QUARTERLY",
    yearly: "STRIPE_PRICE_PRO_YEARLY",
  },
};

export function stripePriceId(plan: PaidPlan, interval: PlanInterval): string | undefined {
  return process.env[STRIPE_PRICE_ENV[plan][interval]];
}

/** Reverse lookup — the source of truth for plan+interval on any webhook
 * event that carries a Stripe price ID (subscription created/updated),
 * which is the only reliable signal for plan changes made from Stripe's
 * own customer portal rather than through our checkout. */
export function planForStripePriceId(priceId: string | undefined): { plan: PaidPlan; interval: PlanInterval } | null {
  if (!priceId) return null;
  for (const plan of Object.keys(STRIPE_PRICE_ENV) as PaidPlan[]) {
    for (const interval of Object.keys(STRIPE_PRICE_ENV[plan]) as PlanInterval[]) {
      if (process.env[STRIPE_PRICE_ENV[plan][interval]] === priceId) return { plan, interval };
    }
  }
  return null;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
