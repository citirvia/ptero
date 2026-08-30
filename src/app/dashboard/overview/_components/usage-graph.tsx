"use client";

import { Cpu, MemoryStick, HardDrive, Server as ServerIcon } from "lucide-react";
import { useServers } from "@/lib/api/hooks";
import { toUiServer, type PteroClientServer } from "@/lib/api/adapters";
import { DataState } from "@/components/ui/data-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

function fmtRam(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

/** Snapshot: allocated resources aggregated from live server limits. */
function FleetSnapshot({ servers }: { servers: PteroClientServer[] }) {
  const ui = servers.map((s) => toUiServer(s));
  const totalRam = ui.reduce((a, s) => a + s.ram.total, 0);
  const totalCpu = ui.reduce((a, s) => a + (s.cpu || 0), 0);
  const totalDisk = ui.reduce((a, s) => a + s.disk.total, 0);
  const maxRam = Math.max(...ui.map((s) => s.ram.total), 1);

  const meters = [
    { icon: MemoryStick, label: "Allocated RAM", value: fmtRam(totalRam) },
    { icon: HardDrive, label: "Allocated disk", value: fmtRam(totalDisk) },
    { icon: Cpu, label: "CPU limit", value: `${totalCpu}%` },
  ];

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-3">
        {meters.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-hairline bg-overlay p-3"
          >
            <div className="flex items-center gap-1.5 text-ink-muted">
              <m.icon className="size-3.5" />
              <span className="text-[11px]">{m.label}</span>
            </div>
            <p className="mt-1 font-mono text-lg font-semibold text-ink">
              {m.value}
            </p>
          </div>
        ))}
      </div>
      <ul className="space-y-2.5">
        {ui.map((s) => (
          <li key={s.id} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate font-mono text-xs text-ink-secondary">
              {s.name}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-overlay2">
              <div
                className="h-full rounded accent-gradient"
                style={{ width: `${(s.ram.total / maxRam) * 100}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right font-mono text-xs text-ink-muted">
              {fmtRam(s.ram.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UsageGraph() {
  const q = useServers();

  return (
    <div className="card-base p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold tracking-tight text-ink">
            Fleet usage
          </h3>
          <p className="text-sm text-ink-muted">
            Allocated resources · snapshot
          </p>
        </div>
      </div>

      <DataState
        query={q}
        loading={
          <div className="space-y-5" aria-hidden>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[68px] rounded-xl" />
              ))}
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        }
        error={(e, retry) => (
          <ErrorState description={e.message} onRetry={retry} />
        )}
        empty={
          <EmptyState
            icon={<ServerIcon />}
            title="No servers to chart"
            description="Deploy a server to see your fleet usage at a glance."
          />
        }
      >
        {(data) => <FleetSnapshot servers={data as PteroClientServer[]} />}
      </DataState>
    </div>
  );
}
