"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Friendly labels for known dashboard path segments. */
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  overview: "Overview",
  servers: "Servers",
  new: "New Server",
  "audit-logs": "Audit Logs",
  admin: "Admin",
  users: "Users",
  plans: "Plans",
  content: "Content",
  incidents: "Incidents",
  roadmap: "Roadmap",
  changelog: "Changelog",
  locations: "Locations",
  settings: "Settings",
  profile: "Profile",
  preferences: "Preferences",
  notifications: "Notifications",
  metrics: "Metrics",
  backups: "Backups",
  databases: "Databases",
  deployments: "Deployments",
  logs: "Logs",
  console: "Console",
  files: "Files",
  network: "Network",
  schedules: "Schedules",
  support: "Support",
};

function humanize(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  // Dynamic ids (e.g. server slugs) and unknown segments: title-case the dashes.
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Hide on the top-level overview page (the implicit dashboard home).
  if (segments.length <= 2 && segments[1] === "overview") return null;
  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, i) => ({
    label: humanize(segment),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-5 flex items-center gap-1 text-xs", className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <li className="flex items-center">
              {crumb.isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-ink-secondary"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-ink-muted transition-colors hover:text-ink"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
            {!crumb.isLast && (
              <li aria-hidden="true" className="flex items-center">
                <ChevronRight className="size-3.5 text-ink-disabled" />
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
