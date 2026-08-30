"use client";

import {
  Rocket,
  RotateCw,
  DatabaseBackup,
  TriangleAlert,
  BellRing,
  type LucideIcon,
} from "lucide-react";
import { relativeTime, cn } from "@/lib/utils";
import { useNotifications } from "@/lib/api/hooks";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_MAP: Record<string, { icon: LucideIcon; className: string }> = {
  deploy: { icon: Rocket, className: "bg-accent/15 text-accent-soft" },
  restart: { icon: RotateCw, className: "bg-info/15 text-info" },
  backup: { icon: DatabaseBackup, className: "bg-online/15 text-online" },
  alert: { icon: TriangleAlert, className: "bg-warn/15 text-warn" },
};
const MAX_RECENT_ACTIVITY_ITEMS = 5;

type RawNotification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  read: boolean;
  createdAt: string;
};

function iconFor(type?: string): string {
  const t = (type ?? "").toLowerCase();
  if (t.includes("deploy")) return "deploy";
  if (t.includes("alert") || t.includes("system")) return "alert";
  if (t.includes("billing")) return "backup";
  if (t.includes("team")) return "restart";
  return "deploy";
}

export function ActivityFeed() {
  const q = useNotifications();

  return (
    <div className="card-base p-5 sm:p-6">
      <h3 className="text-base font-semibold tracking-tight text-ink">
        Recent activity
      </h3>
      <DataState
        query={q}
        loading={
          <ul className="mt-4 space-y-2" aria-hidden>
            {Array.from({ length: MAX_RECENT_ACTIVITY_ITEMS }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2.5">
                <Skeleton className="size-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        }
        error={(e, retry) => (
          <ErrorState description={e.message} onRetry={retry} />
        )}
        isEmpty={(data) =>
          !data || ((data as { notifications?: unknown[] }).notifications ?? []).length === 0
        }
        empty={
          <EmptyState
            icon={<BellRing />}
            title="No recent activity"
            description="You're all caught up."
          />
        }
      >
        {(data) => {
          const items =
            ((data as { notifications?: RawNotification[] }).notifications ?? []).slice(
              0,
              MAX_RECENT_ACTIVITY_ITEMS,
            );
          return (
            <ul className="mt-4 space-y-1">
              {items.map((event) => {
                const conf = ICON_MAP[iconFor(event.type)] ?? ICON_MAP.deploy;
                const Icon = conf.icon;
                return (
                  <li
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-overlay"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                        conf.className,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{event.title}</p>
                      <p className="font-mono text-[11px] text-ink-muted">
                        {event.body}
                      </p>
                    </div>
                    {event.createdAt && (
                      <span className="shrink-0 whitespace-nowrap font-mono text-[11px] text-ink-disabled">
                        {relativeTime(event.createdAt)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }}
      </DataState>
    </div>
  );
}
