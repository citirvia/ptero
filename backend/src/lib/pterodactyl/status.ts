type PteroState = "running" | "starting" | "stopping" | "offline" | null | undefined;

const STUCK_STARTING_UPTIME_MS = 60_000;

export function normalizePteroState(state: PteroState, uptimeMs = 0): Exclude<PteroState, null | undefined> {
  if (state === "starting" && uptimeMs >= STUCK_STARTING_UPTIME_MS) return "running";
  return state ?? "offline";
}
