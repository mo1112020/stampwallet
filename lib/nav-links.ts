import { Home, Smartphone, Users, QrCode, Route, Bell, Settings, Contact, type LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  key: string;
  icon: LucideIcon;
};

/** Dashboard destinations — shared by the sidebar nav and the command palette so they never drift apart.
 * The first 4 are the mobile bottom-tab primaries (see MOBILE_PRIMARY_COUNT in nav.tsx) — new links land
 * after "settings" by default so they don't silently bump an existing primary into the overflow menu. */
export const dashboardNavLinks: NavLink[] = [
  { href: "dashboard", key: "dashboard", icon: Home },
  { href: "dashboard/programs", key: "programs", icon: Smartphone },
  { href: "dashboard/scan", key: "scan", icon: QrCode },
  { href: "dashboard/analytics", key: "analytics", icon: Users },
  { href: "dashboard/notifications", key: "notifications", icon: Bell },
  { href: "dashboard/billing", key: "billing", icon: Route },
  { href: "dashboard/settings", key: "settings", icon: Settings },
  { href: "dashboard/customers", key: "customers", icon: Contact },
];
