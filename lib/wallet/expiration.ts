import type { CardExpirationConfig } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpirationStatus = {
  expiresAt: Date;
  daysRemaining: number;
  expired: boolean;
};

/** `enrolledAt` is customer_progress.created_at — expiration is always
 * computed relative to when that specific customer joined, not a fixed
 * date, so merchants can change the expiration window without punishing
 * existing members. */
export function computeExpirationStatus(
  expiration: CardExpirationConfig | undefined,
  enrolledAt: string | Date
): ExpirationStatus | null {
  if (!expiration?.enabled) return null;
  const enrolled = new Date(enrolledAt);
  const expiresAt = new Date(enrolled.getTime() + expiration.days * DAY_MS);
  const msRemaining = expiresAt.getTime() - Date.now();
  return {
    expiresAt,
    daysRemaining: Math.max(0, Math.ceil(msRemaining / DAY_MS)),
    expired: msRemaining <= 0,
  };
}

export function formatDaysRemaining(status: ExpirationStatus): string {
  if (status.expired) return "Expired";
  if (status.daysRemaining <= 1) return "1 day remaining";
  return `${status.daysRemaining} days remaining`;
}
