import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RUNTIME_META, type Server } from "@/lib/api/types";
import { getServerStatusText, isServerStatusActive } from "@/lib/server-status";

export function OverviewServerCard({ server }: { server: Server }) {
  const meta = RUNTIME_META[server.runtime];
  const ramPct = server.ram.total
    ? Math.round((server.ram.used / server.ram.total) * 100)
    : 0;

  return (
    <Link
      href={`/dashboard/servers/${server.id}/overview`}
      className="group card-base block p-4 transition-all duration-300 hover:border-hairline2 hover:shadow-glow focus-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated font-mono text-xs"
            style={{ color: meta.color }}
            aria-hidden
          >
            {meta.mono.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {server.name}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <span style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-ink-disabled">·</span>
              <span>
                {server.regionFlag} {server.region}
              </span>
            </p>
          </div>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-ink-disabled transition-colors group-hover:text-ink-secondary" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={server.status} />
        <span className="font-mono text-[11px] text-ink-muted">
          {isServerStatusActive(server.status) ? getServerStatusText(server.status, server.uptimeSeconds) : "—"}
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        <Metric label="CPU" value={`${server.cpu}%`} pct={server.cpu} />
        <Metric label="RAM" value={`${ramPct}%`} pct={ramPct} />
      </div>
    </Link>
  );
}

function Metric({
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
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-ink-muted">{label}</span>
        <span className="font-mono text-ink-secondary">{value}</span>
      </div>
      <Progress
        value={pct}
        indicatorClassName={
          pct > 80 ? "bg-danger" : pct > 60 ? "bg-warn" : "accent-gradient"
        }
      />
    </div>
  );
}
