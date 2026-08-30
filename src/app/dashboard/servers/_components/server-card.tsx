"use client";

import Link from "next/link";
import { Cpu, MemoryStick, HardDrive, Globe } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RUNTIME_META, type Server } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { getServerStatusText } from "@/lib/server-status";
import { ServerActions, QuickActionButtons } from "./server-actions";

function pctColor(pct: number) {
  return pct > 80 ? "bg-danger" : pct > 60 ? "bg-warn" : "accent-gradient";
}

function statusSubtitle(server: Server) {
  return getServerStatusText(server.status, server.uptimeSeconds);
}

function RuntimeChip({ runtime }: { runtime: Server["runtime"] }) {
  const meta = RUNTIME_META[runtime];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-elevated px-2 py-0.5 font-mono text-[11px]"
      style={{ color: meta.color }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}

function MiniBar({
  icon: Icon,
  label,
  value,
  pct,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-ink-muted">
          <Icon className="size-3" />
          {label}
        </span>
        <span className="font-mono text-ink-secondary">{value}</span>
      </div>
      <Progress value={pct} indicatorClassName={pctColor(pct)} />
    </div>
  );
}

export function ServerGridCard({ server }: { server: Server }) {
  const ramPct = server.ram.total
    ? Math.round((server.ram.used / server.ram.total) * 100)
    : 0;
  const diskPct = server.disk.total
    ? Math.round((server.disk.used / server.disk.total) * 100)
    : 0;
  const canOpen = server.status !== "installing";

  return (
    <div
      className={cn(
        "group card-base relative flex flex-col p-5 transition-all duration-300",
        canOpen ? "hover:border-hairline2 hover:shadow-glow" : "opacity-80",
      )}
    >
      {canOpen ? (
        <Link
          href={`/dashboard/servers/${server.id}/overview`}
          className="absolute inset-0 rounded-2xl focus-ring"
          aria-label={`Open ${server.name}`}
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-ink">
              {server.name}
            </h3>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
            {server.runtimeVersion ? `${server.runtimeVersion} · ` : ""}
            {server.plan}
          </p>
        </div>
        <div className="relative z-10">
          <ServerActions server={server} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RuntimeChip runtime={server.runtime} />
        <StatusBadge status={server.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
        <span>
          {server.regionFlag} {server.region}
        </span>
        <span className="text-ink-disabled">·</span>
        <span className="font-mono">{server.node}</span>
      </div>

      <div className="mt-4 space-y-2.5">
        <MiniBar
          icon={Cpu}
          label="CPU"
          value={`${server.cpu}%`}
          pct={server.cpu}
        />
        <MiniBar
          icon={MemoryStick}
          label="RAM"
          value={`${(server.ram.used / 1024).toFixed(1)}/${(
            server.ram.total / 1024
          ).toFixed(0)} GB`}
          pct={ramPct}
        />
        <MiniBar
          icon={HardDrive}
          label="Disk"
          value={`${(server.disk.used / 1024).toFixed(1)}/${(
            server.disk.total / 1024
          ).toFixed(0)} GB`}
          pct={diskPct}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
        <div className="min-w-0 font-mono text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Globe className="size-3 shrink-0" />
            <span className="truncate">
              {server.ip}:{server.port}
            </span>
          </span>
          <span className="text-ink-disabled">
            {canOpen ? statusSubtitle(server) : "Dashboard unlocks after install completes"}
          </span>
        </div>
        <div className="relative z-10">
          <QuickActionButtons server={server} />
        </div>
      </div>
    </div>
  );
}

export function ServerListRow({ server }: { server: Server }) {
  const ramPct = server.ram.total
    ? Math.round((server.ram.used / server.ram.total) * 100)
    : 0;
  const diskPct = server.disk.total
    ? Math.round((server.disk.used / server.disk.total) * 100)
    : 0;
  const canOpen = server.status !== "installing";

  return (
    <div
      className={cn(
        "group card-base relative flex flex-col gap-4 p-4 transition-colors duration-300 lg:flex-row lg:items-center",
        canOpen ? "hover:border-hairline2" : "opacity-80",
      )}
    >
      {canOpen ? (
        <Link
          href={`/dashboard/servers/${server.id}/overview`}
          className="absolute inset-0 rounded-2xl focus-ring"
          aria-label={`Open ${server.name}`}
        />
      ) : null}

      {/* identity */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-ink">
              {server.name}
            </h3>
            <StatusBadge status={server.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-ink-muted">
            <RuntimeChip runtime={server.runtime} />
            <span>
              {server.regionFlag} {server.region}
            </span>
            <span className="text-ink-disabled">·</span>
            <span className="font-mono">{server.node}</span>
            <span className="text-ink-disabled">·</span>
            <span className="font-mono">
              {server.ip}:{server.port}
            </span>
          </div>
        </div>
      </div>

      {/* metrics */}
      <div className="grid w-full grid-cols-3 gap-3 lg:w-80">
        <CompactMetric label="CPU" value={`${server.cpu}%`} pct={server.cpu} />
        <CompactMetric label="RAM" value={`${ramPct}%`} pct={ramPct} />
        <CompactMetric label="Disk" value={`${diskPct}%`} pct={diskPct} />
      </div>

      <div className="flex items-center justify-between gap-3 lg:w-44 lg:justify-end">
        <span className="font-mono text-[11px] text-ink-muted">
          {canOpen ? statusSubtitle(server) : "Install in progress"}
        </span>
        <div className="relative z-10">
          <QuickActionButtons server={server} />
        </div>
      </div>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  pct,
}: {
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="text-ink-muted">{label}</span>
        <span className={cn("font-mono", pct > 80 ? "text-danger" : "text-ink-secondary")}>
          {value}
        </span>
      </div>
      <Progress value={pct} indicatorClassName={pctColor(pct)} />
    </div>
  );
}
