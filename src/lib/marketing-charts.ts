/**
 * Deterministic pseudo-random series for marketing "preview" chart UIs.
 * Same seed always produces the same series so SSR matches client output and
 * the homepage / affiliate dashboard preview don't flash on hydration. These
 * are NOT real metrics — they only feed visual illusions of dashboards.
 *
 * Real live metrics come off the live-stats Zustand store
 * (`src/store/live-stats.ts`) which is fed by the Pterodactyl console socket.
 */

export function seededSeries(
  seed: number,
  points: number,
  min: number,
  max: number,
  volatility = 0.35,
): number[] {
  const out: number[] = [];
  let v = (min + max) / 2;
  for (let i = 0; i < points; i++) {
    const wave = Math.sin((i + seed) * 0.6) * (max - min) * 0.18;
    const drift =
      (Math.sin((i + seed) * 0.13) + Math.cos((i + seed) * 0.27)) *
      (max - min) *
      volatility *
      0.25;
    v = (min + max) / 2 + wave + drift;
    v = Math.max(min, Math.min(max, v));
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}

export type TimePoint = { t: string; value: number };

export function timeSeries(
  seed: number,
  points: number,
  min: number,
  max: number,
): TimePoint[] {
  const series = seededSeries(seed, points, min, max);
  return series.map((value, i) => {
    const minutesAgo = (points - i) * 2;
    return { t: `${minutesAgo}m`, value };
  });
}

export function multiSeries(seed: number, points: number) {
  return Array.from({ length: points }).map((_, i) => ({
    t: `${(points - i) * 2}m`,
    cpu: seededSeries(seed, points, 8, 74)[i],
    ram: seededSeries(seed + 3, points, 30, 88)[i],
    net: seededSeries(seed + 7, points, 2, 55)[i],
    disk: seededSeries(seed + 11, points, 1, 18)[i],
  }));
}
