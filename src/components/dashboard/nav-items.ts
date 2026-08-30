import {
  LayoutDashboard,
  Server,
  LayoutTemplate,
  Users,
  Bell,
  ScrollText,
  LifeBuoy,
  Settings,
  Gauge,
  HardDrive,
  Boxes,
  Tag,
  AlertTriangle,
  Map,
  Megaphone,
  FileText,
} from "lucide-react";

export const NAV = [
  { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Servers", href: "/dashboard/servers", icon: Server },
  { label: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { label: "Settings", href: "/dashboard/settings/profile", icon: Settings },
] as const;

export const ADMIN_NAV = [
  { label: "Overview", href: "/dashboard/admin/overview", icon: Gauge },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Nodes", href: "/dashboard/admin/nodes", icon: HardDrive },
  { label: "Servers", href: "/dashboard/admin/servers", icon: Boxes },
  { label: "Support", href: "/dashboard/admin/support", icon: LifeBuoy },
  { label: "Plans", href: "/dashboard/admin/plans", icon: Tag },
] as const;

export const ADMIN_CONTENT_NAV = [
  { label: "Incidents", href: "/dashboard/admin/content/incidents", icon: AlertTriangle },
  { label: "Roadmap", href: "/dashboard/admin/content/roadmap", icon: Map },
  { label: "Changelog", href: "/dashboard/admin/content/changelog", icon: Megaphone },
  { label: "Locations", href: "/dashboard/admin/content/locations", icon: FileText },
] as const;
