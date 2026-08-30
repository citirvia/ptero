"use client";

import { useState, useMemo } from "react";
import { Globe2, Activity, ArrowUpRight, MapPinned } from "lucide-react";
import { usePublicLocations } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const MAP_W = 1010;
const MAP_H = 666;
const MAX_MERCATOR_LAT = 85.05112878;

interface LocationRow {
  id: string;
  slug: string;
  city: string;
  region: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  status: "ONLINE" | "DEGRADED" | "MAINTENANCE" | "OFFLINE";
  hardware: string;
  capacity: number;
  sortIndex: number;
}

function project(lat: number, lng: number) {
  const safeLat = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat));
  const x = ((lng + 180) / 360) * MAP_W;
  const latRad = (safeLat * Math.PI) / 180;
  const mercatorY =
    0.5 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / (2 * Math.PI);
  const y = mercatorY * MAP_H;
  return {
    x: Math.max(0, Math.min(MAP_W, x)),
    y: Math.max(0, Math.min(MAP_H, y)),
  };
}

interface LocationsResponse {
  items: LocationRow[];
}

function statusVariant(status: LocationRow["status"]) {
  switch (status) {
    case "ONLINE":
      return "online" as const;
    case "DEGRADED":
      return "warn" as const;
    case "MAINTENANCE":
      return "info" as const;
    default:
      return "outline" as const;
  }
}

function statusDot(status: LocationRow["status"]) {
  switch (status) {
    case "ONLINE":
      return "bg-online";
    case "DEGRADED":
      return "bg-warn";
    case "MAINTENANCE":
      return "bg-info";
    default:
      return "bg-ink-disabled";
  }
}

export function WorldMap({
  className,
  interactive = true,
}: {
  className?: string;
  interactive?: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const query = usePublicLocations<LocationRow>();
  const data = useMemo(
    () =>
      ((query.data as LocationsResponse | undefined)?.items ?? [])
        .slice()
        .sort((a, b) => a.sortIndex - b.sortIndex || a.city.localeCompare(b.city)),
    [query.data],
  );

  const pins = useMemo(
    () => data.map((loc) => ({ loc, pos: project(loc.lat, loc.lng) })),
    [data],
  );

  const frankfurtId = useMemo(
    () =>
      data.find((loc) =>
        /frankfurt|fra/i.test(`${loc.city} ${loc.slug} ${loc.region} ${loc.country}`),
      )?.id ?? null,
    [data],
  );

  const highlightedId = active ?? frankfurtId;

  const hub = useMemo(() => {
    if (!pins.length) return { x: MAP_W / 2, y: MAP_H / 2 };
    const preferred =
      pins.find(({ loc }) => /frankfurt|london|istanbul/i.test(`${loc.city} ${loc.slug}`)) ??
      pins[Math.floor(pins.length / 2)];
    return preferred.pos;
  }, [pins]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-hairline bg-card",
        className,
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative overflow-hidden border-b border-hairline bg-[#081019] lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(47,107,133,0.22),transparent_26%),radial-gradient(circle_at_78%_24%,rgba(111,205,241,0.12),transparent_20%),linear-gradient(180deg,#0a131d_0%,#081019_45%,#09141d_100%)]" />
          <div className="absolute inset-0 bg-dots opacity-[0.16]" />
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(130,149,161,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(130,149,161,0.12)_1px,transparent_1px)] [background-size:84px_84px]" />

          <div className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
            <Globe2 className="size-3.5 text-accent-soft" />
            <span>Global network map</span>
          </div>
          <div className="absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 font-mono text-[11px] text-white/70 backdrop-blur">
            {data.length} active regions
          </div>

          <svg
            className="relative z-[1] w-full"
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            aria-hidden
          >
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#67c2ea" stopOpacity="0" />
                <stop offset="45%" stopColor="#67c2ea" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#67c2ea" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#9bdfff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#9bdfff" stopOpacity="0" />
              </radialGradient>
            </defs>

            <image
              href="/world-map.svg"
              x="0"
              y="0"
              width={MAP_W}
              height={MAP_H}
              preserveAspectRatio="none"
              opacity="0.26"
            />

            {[-120, -60, 0, 60, 120].map((lng) => {
              const x = project(0, lng).x;
              return (
                <line
                  key={`lng-${lng}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2={MAP_H}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 12"
                />
              );
            })}

            {[-60, -30, 0, 30, 60].map((lat) => {
              const y = project(lat, 0).y;
              return (
                <line
                  key={`lat-${lat}`}
                  x1="0"
                  y1={y}
                  x2={MAP_W}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeDasharray="4 12"
                />
              );
            })}

            {pins.map(({ loc, pos }) => {
              if (Math.abs(pos.x - hub.x) < 1 && Math.abs(pos.y - hub.y) < 1) return null;
              const lift = Math.min(96, Math.abs(pos.x - hub.x) * 0.09 + 34);
              const cx = (hub.x + pos.x) / 2;
              const cy = Math.min(hub.y, pos.y) - lift;
              return (
                <path
                  key={`route-${loc.id}`}
                  d={`M ${hub.x} ${hub.y} Q ${cx} ${cy} ${pos.x} ${pos.y}`}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth={highlightedId === loc.id ? 2.2 : 1.5}
                  strokeDasharray={highlightedId === loc.id ? "0" : "5 8"}
                  opacity={highlightedId === loc.id ? 1 : 0.72}
                />
              );
            })}

            {pins.map(({ loc, pos }) => {
              const isActive = highlightedId === loc.id;
              const isFrankfurt = frankfurtId === loc.id;
              return (
                <g key={loc.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isFrankfurt ? 30 : isActive ? 26 : 18}
                    fill="url(#pinGlow)"
                  />
                  {isFrankfurt ? (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="12"
                      fill="none"
                      stroke="rgba(155,223,255,0.45)"
                      strokeWidth="1.5"
                    />
                  ) : null}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isFrankfurt ? 6.8 : isActive ? 6.2 : 4.6}
                    fill="#88d7f8"
                    stroke="rgba(8,16,25,0.95)"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>

          {pins.map(({ loc, pos }) => {
            const isActive = highlightedId === loc.id;
            const isFrankfurt = frankfurtId === loc.id;
            const left = `${(pos.x / MAP_W) * 100}%`;
            const top = `${(pos.y / MAP_H) * 100}%`;
            return (
              <button
                key={`pin-${loc.id}`}
                type="button"
                onMouseEnter={() => interactive && setActive(loc.id)}
                onMouseLeave={() => interactive && setActive(null)}
                onFocus={() => interactive && setActive(loc.id)}
                onBlur={() => interactive && setActive(null)}
                className="absolute z-[2] -translate-x-1/2 -translate-y-1/2"
                style={{ left, top }}
                aria-label={`${loc.city}, ${loc.country}`}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-xl border border-white/10 bg-black/55 px-2.5 py-1.5 text-left shadow-panel backdrop-blur transition-all duration-200",
                    isActive || isFrankfurt ? "opacity-100" : "opacity-0",
                  )}
                >
                  <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-white">
                    {loc.flag} {loc.city}
                    {isFrankfurt ? (
                      <span className="rounded-full border border-accent/30 bg-accent/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent-soft">
                        Hub
                      </span>
                    ) : null}
                  </span>
                  <span className="block whitespace-nowrap font-mono text-[10px] text-white/60">
                    {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}
                  </span>
                </span>
              </button>
            );
          })}

          <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/70 backdrop-blur">
            <span className="size-2 rounded-full bg-accent-soft" />
            <span>Positioned from real latitude / longitude values</span>
          </div>
        </div>

        <div className="relative bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Region index</p>
              <p className="text-xs text-ink-muted">
                Hover a region to highlight its exact place on the map.
              </p>
            </div>
            <div className="rounded-full border border-line bg-elevated px-2.5 py-1 font-mono text-[11px] text-ink-muted">
              Global
            </div>
          </div>

          <div className="space-y-2.5">
            {data.map((loc) => {
              const isActive = highlightedId === loc.id;
              const isFrankfurt = frankfurtId === loc.id;
              return (
                <button
                  key={`list-${loc.id}`}
                  type="button"
                  onMouseEnter={() => interactive && setActive(loc.id)}
                  onMouseLeave={() => interactive && setActive(null)}
                  onFocus={() => interactive && setActive(loc.id)}
                  onBlur={() => interactive && setActive(null)}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition-colors",
                    isActive
                      ? "border-accent/30 bg-accent/[0.06]"
                      : "border-line hover:border-line-hover hover:bg-overlay",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{loc.flag}</span>
                        <span className="text-sm font-medium text-ink">{loc.city}</span>
                        {isFrankfurt ? (
                          <span className="rounded-full border border-accent/20 bg-accent/[0.08] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-soft">
                            Frankfurt Hub
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {loc.country} · {loc.region}
                      </p>
                    </div>
                    <Badge variant={statusVariant(loc.status)}>{loc.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-ink-muted">
                      {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-accent-soft">
                      <Activity className="size-3" />
                      {loc.capacity}% full
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                    <span className="truncate">{loc.hardware}</span>
                    <span className="flex items-center gap-1 text-ink-secondary">
                      <MapPinned className="size-3" />
                      <span className={cn("size-1.5 rounded-full", statusDot(loc.status))} />
                      <ArrowUpRight className="size-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
