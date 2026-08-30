"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Activity as ActivityIcon,
  HardDriveDownload,
  Rocket,
  RotateCw,
  Shield,
  UserCog,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";
import { RelTime } from "../_components/shared";
import { useServerId } from "../_components/use-server";
import { useActivity } from "@/lib/api/hooks";

type ActivityLog = {
  id: string;
  event: string;
  ip: string | null;
  description: string | null;
  timestamp: string;
};

function liveEventType(event: string): string {
  const e = event.toLowerCase();
  if (e.includes("auth") || e.includes("login") || e.includes("password")) return "auth";
  if (e.includes("install") || e.includes("deploy") || e.includes("reinstall")) return "deploy";
  if (e.includes("permission") || e.includes("role") || e.includes("subuser")) return "permission";
  if (e.includes("backup")) return "server";
  if (e.includes("alert") || e.includes("crash")) return "alert";
  return "server";
}

const TYPE_META: Record<
  string,
  { icon: React.ElementType; variant: BadgeProps["variant"]; ring: string }
> = {
  server: { icon: RotateCw, variant: "info", ring: "border-info/30 text-info" },
  deploy: { icon: Rocket, variant: "accent", ring: "border-accent/30 text-accent-soft" },
  permission: { icon: UserCog, variant: "warn", ring: "border-warn/30 text-warn" },
  auth: { icon: Shield, variant: "outline", ring: "border-line text-ink-muted" },
  billing: { icon: HardDriveDownload, variant: "default", ring: "border-line text-ink-muted" },
  alert: { icon: AlertTriangle, variant: "danger", ring: "border-danger/30 text-danger" },
};

const FILTERS = ["all", "server", "deploy", "permission", "auth", "alert"];

export default function ActivityPage() {
  const [filter, setFilter] = useState("all");
  const id = useServerId();
  const query = useActivity(id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "secondary" : "ghost"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <DataState
        query={query}
        loading={<TableSkeleton rows={6} columns={3} />}
        empty={
          <EmptyState
            icon={<ActivityIcon />}
            title="No activity yet"
            description="Power actions, deployments and admin events will show up here."
          />
        }
      >
        {(data) => {
          const items = (data as ActivityLog[])
            .map((l) => ({
              id: l.id,
              actor: l.ip ?? "System",
              action: l.event,
              target: l.description ?? "",
              type: liveEventType(l.event),
              time: l.timestamp,
            }))
            .sort((a, b) => (a.time < b.time ? 1 : -1));
          const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

          if (filtered.length === 0) {
            return (
              <Card className="p-5 sm:p-6">
                <p className="py-6 text-center text-sm text-ink-muted">
                  No activity for this filter.
                </p>
              </Card>
            );
          }

          return (
            <Card className="p-5 sm:p-6">
              <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-line">
                {filtered.map((it) => {
                  const meta = TYPE_META[it.type] ?? TYPE_META.server;
                  const Icon = meta.icon;
                  return (
                    <li key={it.id} className="relative flex gap-4 pl-0">
                      <span
                        className={cn(
                          "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-bg [&_svg]:size-3.5",
                          meta.ring,
                        )}
                      >
                        <Icon />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-ink">
                            {it.actor}
                          </span>
                          <span className="text-sm text-ink-secondary">
                            {it.action.toLowerCase()}
                          </span>
                          {it.target ? (
                            <span className="font-mono text-xs text-accent-soft">
                              {it.target}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={meta.variant} className="capitalize">
                            {it.type}
                          </Badge>
                          <span className="text-xs text-ink-muted">
                            <RelTime date={it.time} />
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          );
        }}
      </DataState>
    </div>
  );
}
