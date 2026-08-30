"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  RotateCw,
  Rocket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/dashboard/page-header";
import { MetricArea } from "@/components/charts/area";
import {
  useServer,
  useServerId,
  useResourcesQuery,
} from "../_components/use-server";
import { RelTime } from "../_components/shared";
import { useUsageHistory, useActivity, useDeployments } from "@/lib/api/hooks";
import type { PteroResources } from "@/lib/api/adapters";
import { useLiveStats } from "@/store/live-stats";
import { useConsoleStream } from "../_components/live-console-panel";
import { formatUsagePercent } from "@/lib/server-status";

const RANGES: { id: "1h" | "24h" | "7d"; label: string }[] = [
  { id: "1h", label: "1h" },
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
];

type Snapshot = {
  takenAt: string;
  cpu: number;
  memBytes: number;
  diskBytes: number;
  rxBytes: number;
  txBytes: number;
};

type ActivityLog = {
  id: string;
  event: string;
  description: string | null;
  timestamp: string;
};

type Deployment = {
  id: string;
  commit: string | null;
  status: string;
  startedAt: string;
};

function toChartPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value < 1) return 0.1;
  return Number(value.toFixed(1));
}

function toChartMegabytes(bytes: number): number {
  const value = bytes / 1024 / 1024;
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value < 1) return Number(value.toFixed(2));
  if (value < 10) return Number(value.toFixed(1));
  return Math.round(value);
}

export default function MonitoringPage() {
  const id = useServerId();
  const server = useServer();
  const resQuery = useResourcesQuery();
  const liveStat = useLiveStats((s) => s.latest(id));
  const liveHistory = useLiveStats((s) => s.history[id] ?? []);
  const [range, setRange] = useState(RANGES[0]);
  const historyQuery = useUsageHistory(id, range.id);
  const activityQuery = useActivity(id);
  const deploysQuery = useDeployments(id);
  useConsoleStream(id, false);

  const live = resQuery.data ? (resQuery.data as PteroResources) : null;
  const cpuNow = liveStat
    ? liveStat.cpu
    : live
      ? live.resources.cpu_absolute
      : 0;
  const chartSnapshots = useMemo<Snapshot[]>(() => {
    if (liveHistory.length > 0) {
      return liveHistory.map((point) => ({
        takenAt: new Date(point.ts).toISOString(),
        cpu: point.cpu,
        memBytes: point.memBytes,
        diskBytes: point.diskBytes,
        rxBytes: point.rxBytes,
        txBytes: point.txBytes,
      }));
    }
    return ((historyQuery.data as Snapshot[] | undefined) ?? []).slice();
  }, [historyQuery.data, liveHistory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Monitoring</h2>
          <p className="text-xs text-ink-muted">
            Resource history · {range.label} window
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-line bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r)}
              className={
                range.id === r.id
                  ? "rounded-lg bg-elevated px-3 py-1.5 text-xs font-medium text-ink"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink-secondary"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {historyQuery.isPending && chartSnapshots.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : historyQuery.isError && chartSnapshots.length === 0 ? (
        <ErrorState
          description={(historyQuery.error as Error).message}
          onRetry={() => void historyQuery.refetch()}
        />
      ) : chartSnapshots.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                title="No usage history yet"
                description="Live samples start as soon as Overview or Monitoring opens the console stream."
              />
            </CardContent>
          </Card>
      ) : (
        <MonitoringCharts snapshots={chartSnapshots} ramTotalMb={server?.ram.total ?? 1} />
      )}

      {/* Analytics */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-ink">Analytics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CrashStat activityQuery={activityQuery} />
          <RestartStat activityQuery={activityQuery} />
          <DeployStat deploysQuery={deploysQuery} />
          <StatCard label="CPU now" value={formatUsagePercent(cpuNow)} sub="live" icon={Cpu} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentList
          title="Crash history"
          variant="danger"
          query={activityQuery}
          filter={(e) => /crash|oom|exit/i.test(e.event)}
        />
        <RecentList
          title="Restart history"
          variant="info"
          query={activityQuery}
          filter={(e) => /restart|start|stop|kill|power/i.test(e.event)}
        />
        <DeployList query={deploysQuery} />
      </div>
    </div>
  );
}

function MonitoringCharts({
  snapshots,
  ramTotalMb,
}: {
  snapshots: Snapshot[];
  ramTotalMb: number;
}) {
  const cpuRam = useMemo(
    () =>
      snapshots.map((s, i) => ({
        t: `${snapshots.length - i}`,
        cpu: toChartPercent(s.cpu),
        ram: toChartPercent((s.memBytes / 1_048_576 / Math.max(1, ramTotalMb)) * 100),
      })),
    [snapshots, ramTotalMb],
  );
  const net = useMemo(
    () =>
      snapshots.map((s, i) => ({
        t: `${snapshots.length - i}`,
        value: toChartMegabytes(s.rxBytes + s.txBytes),
      })),
    [snapshots],
  );
  const disk = useMemo(
    () =>
      snapshots.map((s, i) => ({
        t: `${snapshots.length - i}`,
        value: toChartMegabytes(s.diskBytes),
      })),
    [snapshots],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center gap-2.5">
          <Cpu className="size-4 text-accent-soft" />
          <CardTitle>CPU</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricArea
            data={cpuRam}
            height={220}
            series={[{ key: "cpu", name: "CPU", color: "#2f6b85" }]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center gap-2.5">
          <MemoryStick className="size-4 text-info" />
          <CardTitle>Memory</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricArea
            data={cpuRam}
            height={220}
            series={[{ key: "ram", name: "RAM %", color: "#4b8bbe" }]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center gap-2.5">
          <Network className="size-4 text-online" />
          <CardTitle>Network</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricArea
            data={net}
            height={220}
            series={[{ key: "value", name: "MB", color: "#68a063" }]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center gap-2.5">
          <HardDrive className="size-4 text-warn" />
          <CardTitle>Disk</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricArea
            data={disk}
            height={220}
            series={[{ key: "value", name: "MB", color: "#d99a2b" }]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CrashStat({ activityQuery }: { activityQuery: ReturnType<typeof useActivity> }) {
  const count = ((activityQuery.data as ActivityLog[] | undefined) ?? []).filter((e) =>
    /crash|oom|exit/i.test(e.event),
  ).length;
  return <StatCard label="Crashes (30d)" value={String(count)} sub="auto-detected" icon={AlertTriangle} />;
}

function RestartStat({ activityQuery }: { activityQuery: ReturnType<typeof useActivity> }) {
  const count = ((activityQuery.data as ActivityLog[] | undefined) ?? []).filter((e) =>
    /restart|power/i.test(e.event),
  ).length;
  return <StatCard label="Restarts" value={String(count)} sub="all time" icon={RotateCw} />;
}

function DeployStat({ deploysQuery }: { deploysQuery: ReturnType<typeof useDeployments> }) {
  const deploys = (deploysQuery.data as Deployment[] | undefined) ?? [];
  const ok = deploys.filter((d) => d.status.toLowerCase() === "success").length;
  const total = deploys.length || 0;
  const pct = total > 0 ? Math.round((ok / total) * 100) : 0;
  return (
    <StatCard
      label="Deploys"
      value={String(total)}
      sub={`${pct}% success`}
      icon={Rocket}
      accent
    />
  );
}

function RecentList({
  title,
  variant,
  query,
  filter,
}: {
  title: string;
  variant: "danger" | "info";
  query: ReturnType<typeof useActivity>;
  filter: (e: ActivityLog) => boolean;
}) {
  const items = ((query.data as ActivityLog[] | undefined) ?? [])
    .filter(filter)
    .slice(0, 6);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Badge variant={variant}>{items.length}</Badge>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-ink-muted">No events.</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate text-ink-secondary">
                  {i.description ?? i.event}
                </span>
                <span className="shrink-0 text-ink-muted">
                  <RelTime date={i.timestamp} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DeployList({ query }: { query: ReturnType<typeof useDeployments> }) {
  const items = ((query.data as Deployment[] | undefined) ?? []).slice(0, 6);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Deploy history</CardTitle>
        <Badge variant="accent">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-ink-muted">No deployments recorded yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="truncate text-ink-secondary">
                  {d.commit ? `${d.commit.slice(0, 7)} · ${d.status}` : d.status}
                </span>
                <span className="shrink-0 text-ink-muted">
                  <RelTime date={d.startedAt} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
