import type { Plan } from "@/types";

export type PlanLimits = {
  maxActivePrograms: number | null;
  maxActiveCustomers: number | null;
  maxSeats: number | null;
  maxLocations: number | null;
  customBranding: boolean;
};

/** `null` means unlimited — prefer this over magic-number sentinels. */
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxActivePrograms: 1,
    maxActiveCustomers: 100,
    maxSeats: 1,
    maxLocations: 1,
    customBranding: false,
  },
  starter: {
    maxActivePrograms: 3,
    maxActiveCustomers: 1000,
    maxSeats: 3,
    maxLocations: 3,
    customBranding: true,
  },
  pro: {
    maxActivePrograms: 20,
    maxActiveCustomers: 10000,
    maxSeats: 10,
    maxLocations: 20,
    customBranding: true,
  },
  enterprise: {
    maxActivePrograms: null,
    maxActiveCustomers: null,
    maxSeats: null,
    maxLocations: null,
    customBranding: true,
  },
};

/** `limit === null` means unlimited, so the count is always within it. */
export function isWithinLimit(count: number, limit: number | null): boolean {
  return limit === null || count < limit;
}

export const STRIPE_PRICE_ENV: Record<"starter" | "pro", string> = {
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
};

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
