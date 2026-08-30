"use client";

import Link from "next/link";
import { TriangleAlert, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServers } from "@/lib/api/hooks";
import { toUiServer, type PteroClientServer } from "@/lib/api/adapters";
import { isServerStatusAttention } from "@/lib/server-status";
import { DataState } from "@/components/ui/data-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Alert {
  id: string;
  server: string;
  serverId: string;
  title: string;
  detail: string;
  severity: "critical" | "warning";
}

const SEVERITY = {
  critical: {
    badge: "border-danger/30 bg-danger/10 text-danger",
    icon: "text-danger",
    bar: "bg-danger",
  },
  warning: {
    badge: "border-warn/30 bg-warn/10 text-warn",
    icon: "text-warn",
    bar: "bg-warn",
  },
} as const;

export function AlertsPanel() {
  const q = useServers();

  return (
    <div className="card-base p-5 sm:p-6">
      <DataState
        query={q}
        loading={
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Alerts
              </h3>
            </div>
            <div className="mt-4 space-y-2.5" aria-hidden>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </>
        }
        error={(e, retry) => (
          <ErrorState description={e.message} onRetry={retry} />
        )}
        isEmpty={() => false}
      >
        {(data) => {
          const alerts: Alert[] = (data as PteroClientServer[])
            .map((s) => toUiServer(s))
            .filter((s) => isServerStatusAttention(s.status))
            .map((s) => ({
              id: s.id,
              server: s.name,
              serverId: s.id,
              title: `Server ${s.status}`,
              detail: `${s.name} is ${s.status}`,
              severity: s.status === "offline" ? ("critical" as const) : ("warning" as const),
            }));

          return (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  Alerts
                </h3>
              </div>

              {alerts.length === 0 ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-hairline bg-overlay p-4">
                  <CheckCircle2 className="size-5 shrink-0 text-online" />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      All systems operational
                    </p>
                    <p className="text-xs text-ink-secondary">
                      No alerts across your fleet.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {alerts.map((alert) => {
                    const sev = SEVERITY[alert.severity];
                    return (
                      <li key={alert.id}>
                        <Link
                          href={`/dashboard/servers/${alert.serverId}/overview`}
                          className="group relative flex items-start gap-3 overflow-hidden rounded-xl border border-line bg-bg p-3.5 transition-colors hover:border-line-active focus-ring"
                        >
                          <span
                            className={cn(
                              "absolute inset-y-0 left-0 w-0.5",
                              sev.bar,
                            )}
                            aria-hidden
                          />
                          <TriangleAlert
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              sev.icon,
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-ink">
                                {alert.title}
                              </p>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                                  sev.badge,
                                )}
                              >
                                {alert.severity}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">
                              {alert.server}
                            </p>
                            <p className="mt-1 text-xs text-ink-secondary">
                              {alert.detail}
                            </p>
                          </div>
                          <ChevronRight className="size-4 shrink-0 self-center text-ink-disabled transition-colors group-hover:text-ink-secondary" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          );
        }}
      </DataState>
    </div>
  );
}
