"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export function MiniArea({
  data,
  dataKey = "value",
  color = "#2f6b85",
  height = 64,
}: {
  data: { t: string; value: number }[];
  dataKey?: string;
  color?: string;
  height?: number;
}) {
  const id = `g-${dataKey}-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

type TooltipPayloadEntry = {
  dataKey?: string | number;
  name?: string;
  value?: string | number;
  color?: string;
  unit?: string;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-elevated px-3 py-2 shadow-panel">
      <p className="mb-1 font-mono text-[10px] text-ink-muted">{label} ago</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-xs text-ink">
          <span style={{ color: p.color }}>●</span> {p.name}: {p.value}
          {p.unit ?? "%"}
        </p>
      ))}
    </div>
  );
}

export function MetricArea({
  data,
  series,
  height = 240,
}: {
  data: Record<string, number | string>[];
  series: { key: string; name: string; color: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`mg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#ffffff" strokeOpacity={0.04} vertical={false} />
        <XAxis
          dataKey="t"
          tick={{ fill: "#666", fontSize: 10, fontFamily: "var(--font-jetbrains)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={32}
        />
        <YAxis
          tick={{ fill: "#666", fontSize: 10, fontFamily: "var(--font-jetbrains)" }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#2c2c2c" }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#mg-${s.key})`}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
