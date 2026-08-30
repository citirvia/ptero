"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MiniArea } from "@/components/charts/area";
import { timeSeries } from "@/lib/marketing-charts";

const PANELS = [
  {
    label: "CPU",
    value: "32%",
    trend: "-4%",
    up: false,
    color: "#2f6b85",
    data: timeSeries(7, 28, 8, 74),
  },
  {
    label: "Memory",
    value: "412 MB",
    trend: "+12 MB",
    up: true,
    color: "#68a063",
    data: timeSeries(13, 28, 30, 88),
  },
  {
    label: "Restarts (24h)",
    value: "2",
    trend: "stable",
    up: false,
    color: "#d29922",
    data: timeSeries(21, 28, 0, 6),
  },
];

export function MonitoringPreview() {
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-online animate-pulse-ring" />
          <span className="font-mono text-xs text-ink-secondary">
            atlas-bot · live
          </span>
        </div>
        <Badge variant="online">streaming</Badge>
      </div>

      <div className="flex flex-col gap-4">
        {PANELS.map((p) => (
          <div key={p.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted">{p.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm text-ink">{p.value}</span>
                <span
                  className={`flex items-center gap-0.5 font-mono text-[11px] ${
                    p.up ? "text-warn" : "text-online"
                  }`}
                >
                  {p.up ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {p.trend}
                </span>
              </span>
            </div>
            <MiniArea data={p.data} color={p.color} height={48} />
          </div>
        ))}
      </div>
    </Card>
  );
}
