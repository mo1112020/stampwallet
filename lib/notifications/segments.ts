import { createAdminClient } from "@/lib/supabase/admin";
import type {
  LoyaltyProgram,
  Merchant,
  PointsConfig,
  PointsProgress,
  Progress,
  SegmentDefinition,
  StampConfig,
  StampProgress,
  StepsConfig,
  StepsProgress,
} from "@/types";

export type NotificationTarget = {
  customerProgressId: string;
  passId: string;
  googleObjectId: string | null;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
};

export function progressPercent(program: LoyaltyProgram, progress: Progress): number {
  if (program.type === "stamp") {
    const p = progress as StampProgress;
    const c = program.config as StampConfig;
    return c.stamps_required ? (p.stamps_collected / c.stamps_required) * 100 : 0;
  }
  if (program.type === "points") {
    const p = progress as PointsProgress;
    const c = program.config as PointsConfig;
    return c.points_per_reward ? (p.points / c.points_per_reward) * 100 : 0;
  }
  const p = progress as StepsProgress;
  const c = program.config as StepsConfig;
  const maxThreshold = Math.max(...c.stages.map((s) => s.threshold), 1);
  return (p.current_value / maxThreshold) * 100;
}

/**
 * Resolves a segment definition into the concrete set of passes to notify.
 * Uses the admin client — this runs from cron/campaign-send contexts, not a
 * live merchant session.
 */
export async function resolveSegmentTargets(
  merchantId: string,
  segment: SegmentDefinition
): Promise<NotificationTarget[]> {
  const admin = createAdminClient();

  const { data: merchant } = await admin.from("merchants").select("*").eq("id", merchantId).single();
  if (!merchant) return [];

  let programsQuery = admin
    .from("loyalty_programs")
    .select("id, merchant_id, name, type, is_active, config, created_at, updated_at")
    .eq("merchant_id", merchantId)
    .eq("is_active", true);
  if (segment.scope === "program" && segment.program_id) {
    programsQuery = programsQuery.eq("id", segment.program_id);
  }
  const { data: programs } = await programsQuery;
  const programById = new Map((programs ?? []).map((p) => [p.id, p as LoyaltyProgram]));
  const programIds = [...programById.keys()];
  if (programIds.length === 0) return [];

  const { data: progressRows } = await admin
    .from("customer_progress")
    .select("id, pass_id, program_id, progress, google_object_id, updated_at, customers(birthday)")
    .in("program_id", programIds);

  let rows = progressRows ?? [];

  if (segment.scope === "inactive_days" && segment.inactive_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - segment.inactive_days);
    rows = rows.filter((r) => new Date(r.updated_at as string) < cutoff);
  }

  if (segment.scope === "birthday_month") {
    const currentMonth = new Date().getMonth();
    rows = rows.filter((r) => {
      const customer = r.customers as unknown as { birthday: string | null } | null;
      if (!customer?.birthday) return false;
      return new Date(customer.birthday).getMonth() === currentMonth;
    });
  }

  if (segment.scope === "progress_threshold" && segment.min_progress_percent !== undefined) {
    rows = rows.filter((r) => {
      const program = programById.get(r.program_id as string);
      if (!program) return false;
      return progressPercent(program, r.progress as Progress) >= (segment.min_progress_percent as number);
    });
  }

  return rows
    .map((r) => {
      const program = programById.get(r.program_id as string);
      if (!program) return null;
      return {
        customerProgressId: r.id as string,
        passId: r.pass_id as string,
        googleObjectId: r.google_object_id as string | null,
        program,
        merchant: merchant as Merchant,
        progress: r.progress as Progress,
      };
    })
    .filter((t): t is NotificationTarget => t !== null);
}
