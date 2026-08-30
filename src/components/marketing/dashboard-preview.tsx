"use client";

import { Activity, Cpu, HardDrive, Server } from "lucide-react";
import { MiniArea } from "@/components/charts/area";
import { timeSeries } from "@/lib/marketing-charts";
import { StatusBadge } from "@/components/ui/badge";

export function DashboardPreview() {
  const cpu = timeSeries(2, 24, 12, 64);
  const ram = timeSeries(6, 24, 30, 78);

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4 shadow-glow-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg accent-gradient">
            <Server className="size-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-ink">atlas-bot</p>
            <p className="font-mono text-[10px] text-ink-muted">fra-node-04</p>
          </div>
        </div>
        <StatusBadge status="online" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-hairline bg-bg/40 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] text-ink-muted">
            <Cpu className="size-3" /> CPU
          </div>
          <p className="font-mono text-lg font-semibold text-ink">32%</p>
          <MiniArea data={cpu} height={36} />
        </div>
        <div className="rounded-xl border border-hairline bg-bg/40 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] text-ink-muted">
            <Activity className="size-3" /> RAM
          </div>
          <p className="font-mono text-lg font-semibold text-ink">412 MB</p>
          <MiniArea data={ram} height={36} color="#3fb950" />
        </div>
      </div>

      <div className="mt-3 space-y-2 rounded-xl border border-hairline bg-bg/40 p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <HardDrive className="size-3" /> Disk
          </span>
          <span className="font-mono text-ink-secondary">1.8 / 10 GB</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
          <div className="h-full w-[18%] accent-gradient" />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-hairline bg-bg/40 p-3 font-mono text-[10px] leading-relaxed text-ink-muted">
        <p className="text-online">✓ [shard 0] Ready — 412 guilds</p>
        <p className="text-online">✓ [shard 1] Ready — 398 guilds</p>
        <p className="text-accent-soft">→ heartbeat ok · lag 1.2ms</p>
      </div>
    </div>
  );
}
