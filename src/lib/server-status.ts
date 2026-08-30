import type { ServerStatus } from "@/lib/api/types";
import { formatUptime } from "@/lib/utils";

const STUCK_STARTING_UPTIME_MS = 60_000;

export type PteroPowerState = "running" | "starting" | "stopping" | "offline" | null | undefined;

export function normalizePteroPowerState(
  state: PteroPowerState,
  uptimeMs = 0,
): Exclude<PteroPowerState, null | undefined> {
  if (state === "starting" && uptimeMs >= STUCK_STARTING_UPTIME_MS) return "running";
  return state ?? "offline";
}

export function pteroStateToServerStatus(
  state: PteroPowerState,
  installing: boolean,
  uptimeMs = 0,
): ServerStatus {
  if (installing) return "installing";
  switch (normalizePteroPowerState(state, uptimeMs)) {
    case "running":
      return "online";
    case "starting":
      return "starting";
    case "stopping":
      return "stopping";
    default:
      return "offline";
  }
}

export function isServerStatusActive(status: ServerStatus): boolean {
  return status === "online" || status === "starting" || status === "restarting";
}

export function isServerStatusAttention(status: ServerStatus): boolean {
  return status === "offline" || status === "stopping";
}

export function canStartServer(status: ServerStatus): boolean {
  return !isServerStatusActive(status) && status !== "stopping" && status !== "installing";
}

export function canStopServer(status: ServerStatus): boolean {
  return status === "online" || status === "starting" || status === "restarting";
}

export function getServerStatusText(status: ServerStatus, uptimeSeconds = 0): string {
  if (status === "online" && uptimeSeconds > 0) return `up ${formatUptime(uptimeSeconds)}`;
  if (status === "starting") return "starting";
  if (status === "stopping") return "stopping";
  if (status === "restarting") return "restarting";
  if (status === "installing") return "installing";
  return "not running";
}

export function formatUsagePercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  if (value < 1) return "<1%";
  if (value < 10) return `${value.toFixed(1)}%`;
  return `${Math.round(value)}%`;
}
