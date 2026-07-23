import type { StaffRole } from "@/types";

export type Capability =
  | "billing"
  | "delete_account"
  | "manage_staff"
  | "manage_settings"
  | "manage_programs"
  | "view_analytics"
  | "export_customers"
  | "scan";

/**
 * Fixed capability matrix — deliberately not a per-permission editor UI.
 * RLS (see migration 005) controls row *visibility* (can this session see
 * this merchant's data at all); this controls *actions* within that data.
 */
const CAPABILITY_ROLES: Record<Capability, StaffRole[]> = {
  billing: ["owner"],
  delete_account: ["owner"],
  manage_staff: ["owner", "admin"],
  manage_settings: ["owner", "admin"],
  manage_programs: ["owner", "admin", "manager"],
  view_analytics: ["owner", "admin", "manager"],
  export_customers: ["owner", "admin", "manager"],
  scan: ["owner", "admin", "manager", "staff"],
};

export function roleHasCapability(role: StaffRole, capability: Capability): boolean {
  return CAPABILITY_ROLES[capability].includes(role);
}
