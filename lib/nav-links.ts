import { Home, Smartphone, Users, QrCode, Route, Bell, Settings, type LucideIcon } from "lucide-react";

export type NavLink = {
  href: string;
  key: string;
  icon: LucideIcon;
};

/** Dashboard destinations — shared by the sidebar nav and the command palette so they never drift apart. */
export const dashboardNavLinks: NavLink[] = [
  { href: "dashboard", key: "dashboard", icon: Home },
  { href: "dashboard/programs", key: "programs", icon: Smartphone },
  { href: "dashboard/scan", key: "scan", icon: QrCode },
  { href: "dashboard/analytics", key: "analytics", icon: Users },
  { href: "dashboard/notifications", key: "notifications", icon: Bell },
  { href: "dashboard/billing", key: "billing", icon: Route },
  { href: "dashboard/settings", key: "settings", icon: Settings },
];
