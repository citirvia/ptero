"use client";

import Link from "next/link";
import {
  Rocket,
  Server,
  Bell,
  Settings2,
  Coins,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useServers, useNotifications } from "@/lib/api/hooks";
import { useAuth } from "@/lib/api/auth";
import type { PteroClientServer } from "@/lib/api/adapters";

type QuickLink = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  href: string;
  value: string;
  accent?: boolean;
};

export function Onboarding() {
  const servers = useServers();
  const notifications = useNotifications();
  const { user } = useAuth();

  const liveServers = (servers.data as PteroClientServer[] | undefined) ?? [];
  const hasServer = liveServers.length > 0;
  const notifData = notifications.data as
    | { notifications: unknown[]; unread: number }
    | undefined;
  const unread = notifData?.unread ?? 0;
  const online = liveServers.filter((server) => server.status === "running").length;
  const quickLinks: QuickLink[] = [
    {
      id: "deploy",
      label: hasServer ? "Deploy another bot" : "Deploy your first bot",
      hint: "Launch a new server from your published credit-based plans.",
      icon: Rocket,
      href: "/dashboard/servers/new",
      value: hasServer ? `${liveServers.length} total` : "Ready to start",
      accent: true,
    },
    {
      id: "fleet",
      label: "Review your fleet",
      hint: "Check status, usage and power actions across every server.",
      icon: Server,
      href: "/dashboard/servers",
      value: `${online}/${liveServers.length} online`,
    },
    {
      id: "alerts",
      label: "Open alerts and inbox",
      hint: "Catch crashes, deploy events and system notifications fast.",
      icon: Bell,
      href: "/dashboard/notifications",
      value: unread === 0 ? "All clear" : `${unread} unread`,
    },
    {
      id: "settings",
      label: "Manage account settings",
      hint: "Update profile, security, sessions and personal preferences.",
      icon: Settings2,
      href: "/dashboard/settings/profile",
      value: `${user?.creditBalance ?? 0} credits`,
    },
  ];

  return (
    <div className="card-base relative mb-6 overflow-hidden p-5 sm:p-6">
      <div className="spotlight pointer-events-none absolute inset-0 opacity-50" />

      <div className="relative">
        <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-base font-semibold text-ink">
            Quick access
          </h2>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-line bg-elevated px-3 py-1 text-xs text-ink-muted">
            <Coins className="size-3.5 text-accent-soft" />
            <span>{user?.creditBalance ?? 0} credits</span>
          </div>
        </div>
        <p className="mb-4 max-w-2xl text-xs text-ink-muted">
          Deploy faster, review your fleet, track alerts and jump into account controls from one place.
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-start gap-3 rounded-xl border p-3 transition-colors",
                item.accent
                  ? "border-accent/30 bg-accent/[0.06] hover:border-accent/40 hover:bg-accent/[0.08]"
                  : "border-line hover:border-line-hover hover:bg-overlay",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                  item.accent
                    ? "border-accent/30 bg-accent/10 text-accent-soft"
                    : "border-hairline bg-elevated text-accent-soft",
                )}
              >
                <item.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{item.label}</span>
                <span className="mt-0.5 block font-mono text-[11px] text-accent-soft">
                  {item.value}
                </span>
                <span className="mt-1 block text-xs text-ink-muted">{item.hint}</span>
              </span>
              <ArrowRight className="mt-2 size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
