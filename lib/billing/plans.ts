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
 * multiplied by staff count. (The original Stripe integration this
 * replaced charged per-seat; deliberately not carried over — see the
 * commit that introduced this file's Paddle rewrite for why.) USD cents,
 * matching Paddle's unit_price.amount convention — see
 * scripts/seed-paddle-catalog.ts, which created these exact amounts. */
export const PLAN_PRICES_USD_CENTS: Record<PaidPlan, Record<PlanInterval, number>> = {
  starter: { monthly: 2900, quarterly: 8300, yearly: 29000 },
  pro: { monthly: 7900, quarterly: 22500, yearly: 79000 },
};

/** Env var names (not the price IDs themselves — those differ between
 * sandbox and production, see .env.local's comment above the Paddle
 * block) holding each plan+interval's Paddle price ID. */
export const PADDLE_PRICE_ENV: Record<PaidPlan, Record<PlanInterval, string>> = {
  starter: {
    monthly: "PADDLE_PRICE_STARTER_MONTHLY",
    quarterly: "PADDLE_PRICE_STARTER_QUARTERLY",
    yearly: "PADDLE_PRICE_STARTER_YEARLY",
  },
  pro: {
    monthly: "PADDLE_PRICE_PRO_MONTHLY",
    quarterly: "PADDLE_PRICE_PRO_QUARTERLY",
    yearly: "PADDLE_PRICE_PRO_YEARLY",
  },
};

export function paddlePriceId(plan: PaidPlan, interval: PlanInterval): string | undefined {
  return process.env[PADDLE_PRICE_ENV[plan][interval]];
}

/** Reverse lookup — the source of truth for plan+interval on any webhook
 * event that carries a Paddle price ID (subscription created/updated),
 * which is the only reliable signal for plan changes made from Paddle's
 * own customer portal rather than through our checkout. */
export function planForPaddlePriceId(priceId: string | undefined): { plan: PaidPlan; interval: PlanInterval } | null {
  if (!priceId) return null;
  for (const plan of Object.keys(PADDLE_PRICE_ENV) as PaidPlan[]) {
    for (const interval of Object.keys(PADDLE_PRICE_ENV[plan]) as PlanInterval[]) {
      if (process.env[PADDLE_PRICE_ENV[plan][interval]] === priceId) return { plan, interval };
    }
  }
  return null;
}

export function isPaddleConfigured() {
  return Boolean(process.env.PADDLE_API_KEY);
}
