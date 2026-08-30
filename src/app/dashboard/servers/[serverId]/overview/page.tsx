"use client";

import { useMemo } from "react";
import {
  Cpu,
  MemoryStick,
  Network,
  HardDrive,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { MetricArea } from "@/components/charts/area";
import { StatCard } from "@/components/dashboard/page-header";
import { formatBytes } from "@/lib/utils";
import {
  useServer,
  useServerId,
  useServerQuery,
  useResourcesQuery,
} from "../_components/use-server";
import type { PteroResources } from "@/lib/api/adapters";
import { useLiveStats } from "@/store/live-stats";
import { LiveConsolePanel } from "../_components/live-console-panel";
import { formatUsagePercent } from "@/lib/server-status";

export default function OverviewPage() {
  const id = useServerId();
  const server = useServer();
  const serverQuery = useServerQuery();
  const resQuery = useResourcesQuery();
  const liveStat = useLiveStats((s) => s.latest(id));

  const live = resQuery.data ? (resQuery.data as PteroResources) : null;

  // Prefer the websocket-sourced live stat (sub-2s) when present, fall back to
  // the 5s resources poll, then fall back to zero.
  const cpuUsage = liveStat
    ? liveStat.cpu
    : live
      ? live.resources.cpu_absolute
      : 0;
  const ramUsedBytes = liveStat
    ? liveStat.memBytes
    : live
      ? live.resources.memory_bytes
      : 0;
  const diskUsedBytes = liveStat
    ? liveStat.diskBytes
    : live
      ? live.resources.disk_bytes
      : 0;

  const ramTotal = server?.ram.total || 1;
  const diskTotal = server?.disk.total || 1;
  const ramPct = (ramUsedBytes / (ramTotal * 1_048_576)) * 100;
  const diskPct = (diskUsedBytes / (diskTotal * 1_048_576)) * 100;

  if (serverQuery.isError) {
    return (
      <ErrorState
        title="Could not load server"
        description={(serverQuery.error as Error)?.message}
        onRetry={() => void serverQuery.refetch()}
      />
    );
  }

  if (!server) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} className="sm:grid-cols-4" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resource stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="CPU"
          value={formatUsagePercent(cpuUsage)}
          sub="current usage"
          icon={Cpu}
          accent
        />
        <StatCard
          label="Memory"
          value={formatBytes(ramUsedBytes)}
          sub={`${formatUsagePercent(ramPct)} of ${formatBytes(ramTotal * 1024 * 1024)}`}
          icon={MemoryStick}
        />
        <StatCard
          label="Disk"
          value={formatBytes(diskUsedBytes)}
          sub={`${formatUsagePercent(diskPct)} of ${formatBytes(diskTotal * 1024 * 1024)}`}
          icon={HardDrive}
        />
        <StatCard
          label="Network"
          value={
            liveStat
              ? `${formatBytes(liveStat.rxBytes + liveStat.txBytes)}`
              : live
                ? formatBytes(
                    live.resources.network_rx_bytes +
                      live.resources.network_tx_bytes,
                  )
                : "—"
          }
          sub="rx + tx"
          icon={Network}
        />
      </div>

      <LiveConsolePanel
        serverId={id}
        serverName={server.name}
      />

      {/* Live history chart from the WS-fed store */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Resource usage</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <LiveHistoryChart serverId={id} ramTotalMb={ramTotal} />
        </CardContent>
      </Card>
    </div>
  );
}

/** Chart fed by the WebSocket-driven live-stats store. */
function LiveHistoryChart({
  serverId,
  ramTotalMb,
}: {
  serverId: string;
  ramTotalMb: number;
}) {
  const history = useLiveStats((s) => s.history[serverId]);
  const data = useMemo(() => {
    const points = history ?? [];
    return points.slice(-30).map((p, i, arr) => ({
      t: `${(arr.length - i) * 2}s`,
      cpu: Math.round(p.cpu),
      ram: Math.round((p.memBytes / 1_048_576 / Math.max(1, ramTotalMb)) * 100),
      net: Math.round((p.rxBytes + p.txBytes) / 1024),
    }));
  }, [history, ramTotalMb]);

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-muted">
        Console stream is starting. Live charts appear here in a few seconds.
      </div>
    );
  }

  return (
    <MetricArea
      data={data}
      height={260}
      series={[
        { key: "cpu", name: "CPU", color: "#2f6b85" },
        { key: "ram", name: "RAM", color: "#4b8bbe" },
        { key: "net", name: "Net", color: "#68a063" },
      ]}
    />
  );
}
