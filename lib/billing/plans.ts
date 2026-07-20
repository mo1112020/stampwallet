import type { Plan } from "@/types";

export const PLAN_LIMITS: Record<
  Plan,
  { maxActivePrograms: number; maxActiveCustomers: number; customBranding: boolean }
> = {
  free: { maxActivePrograms: 1, maxActiveCustomers: 100, customBranding: false },
  starter: { maxActivePrograms: 3, maxActiveCustomers: 1000, customBranding: true },
  pro: { maxActivePrograms: 20, maxActiveCustomers: 10000, customBranding: true },
  enterprise: {
    maxActivePrograms: 999,
    maxActiveCustomers: 999999,
    customBranding: true,
  },
};

export const STRIPE_PRICE_ENV: Record<"starter" | "pro", string> = {
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
};

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
