"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Database,
  FileCode2,
  HardDriveDownload,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Settings,
  Timer,
} from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { cn } from "@/lib/utils";
import { RUNTIME_META } from "@/lib/api/types";
import { RouteTransition } from "@/components/route-transition";
import { useServer, useServerQuery, useServerId } from "./_components/use-server";
import { QuickActions } from "./_components/quick-actions";
import { useLiveStats } from "@/store/live-stats";
import { socketStatusToBadgeStatus } from "./_components/live-console-panel";
import { getServerStatusText } from "@/lib/server-status";

const TABS = [
  { slug: "overview", label: "Overview", icon: LayoutDashboard },
  { slug: "files", label: "Files", icon: FileCode2 },
  { slug: "databases", label: "Databases", icon: Database },
  { slug: "backups", label: "Backups", icon: HardDriveDownload },
  { slug: "schedules", label: "Schedules", icon: Timer },
  { slug: "startup", label: "Startup", icon: Boxes },
  { slug: "env", label: "Env", icon: KeyRound },
  { slug: "monitoring", label: "Monitoring", icon: LineChart },
  { slug: "activity", label: "Activity", icon: Activity },
  { slug: "settings", label: "Settings", icon: Settings },
];

function HeaderSkeleton() {
  return (
    <div className="card-base relative overflow-hidden p-5 sm:p-6">
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-9 w-56" />
      </div>
    </div>
  );
}

export default function ServerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const id = useServerId();
  const query = useServerQuery();
  const server = useServer();
  const pathname = usePathname();
  const base = `/dashboard/servers/${id}`;
  const installing = server?.status === "installing";

  return (
    <div className="mx-auto max-w-7xl">
      {/* Server header */}
      {query.isError ? (
        <ErrorState
          title="Server unavailable"
          description={(query.error as Error)?.message ?? "Could not load this server."}
          onRetry={() => void query.refetch()}
        />
      ) : !server ? (
        <HeaderSkeleton />
      ) : (
        <ServerHeader server={server} />
      )}

      {installing ? (
        <div className="mt-6">
          <ErrorState
            title="Server is still installing"
            description="This server will become available after the installation finishes. You cannot open the server dashboard yet."
          />
        </div>
      ) : (
        <>
          {/* Tab navigation */}
          <nav className="no-scrollbar mt-5 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 rounded-xl border border-line bg-card p-1">
              {TABS.map((tab) => {
                const href = `${base}/${tab.slug}`;
                const active =
                  pathname === href || pathname?.startsWith(`${href}/`);
                return (
                  <Link
                    key={tab.slug}
                    href={href}
                    className={cn(
                      "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 [&_svg]:size-4",
                      active
                        ? "bg-elevated text-ink shadow-sm"
                        : "text-ink-muted hover:text-ink-secondary",
                    )}
                  >
                    <tab.icon />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <RouteTransition>
            <div className="mt-6">{children}</div>
          </RouteTransition>
        </>
      )}
    </div>
  );
}

function ServerHeader({ server }: { server: NonNullable<ReturnType<typeof useServer>> }) {
  const id = useServerId();
  const socketState = useLiveStats((s) => s.socket[id]);
  const runtime = RUNTIME_META[server.runtime];
  const displayStatus = socketStatusToBadgeStatus(socketState?.status, server.status);
  return (
    <div className="card-base relative overflow-hidden p-5 sm:p-6">
      <div className="spotlight pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
              {server.name}
            </h1>
            <StatusBadge status={displayStatus} />
            <Badge variant="outline" className="gap-1.5">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: runtime.color }}
              />
              {runtime.label} {server.runtimeVersion}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base leading-none">
                {server.regionFlag}
              </span>
              {server.region}
            </span>
            <span className="font-mono text-xs text-ink-secondary">
              {server.ip}:{server.port}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Boxes className="size-3.5" />
              <span className="font-mono text-xs">{server.node}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="size-3.5 text-online" />
              {getServerStatusText(displayStatus, server.uptimeSeconds)}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <QuickActions server={server} currentStatus={displayStatus} />
        </div>
      </div>
    </div>
  );
}
