import { create } from "zustand";

/**
 * Per-server resource stream coming off the Pterodactyl console WebSocket.
 * The console page opens the socket; every other page (overview cards, server
 * detail header, monitoring charts, sidebar status badge) reads from this
 * store so we never duplicate the connection.
 *
 * History is bounded to MAX_POINTS (≈ last 10 min at one tick / 2s) so memory
 * is constant per server. `lastSeen` powers the "stale data" indicator after
 * the socket disconnects.
 */
export interface LiveStat {
  cpu: number; // %
  memBytes: number;
  diskBytes: number;
  rxBytes: number;
  txBytes: number;
  ts: number; // ms epoch
}

export interface LiveSocketState {
  status: "running" | "starting" | "stopping" | "offline" | null;
  lastSeen: number; // ms epoch of last message
}

const MAX_POINTS = 300;

interface LiveStatsState {
  history: Record<string, LiveStat[]>;
  socket: Record<string, LiveSocketState>;
  push(id: string, stat: LiveStat): void;
  setStatus(id: string, status: LiveSocketState["status"]): void;
  reset(id: string): void;
  latest(id: string): LiveStat | undefined;
}

export const useLiveStats = create<LiveStatsState>((set, get) => ({
  history: {},
  socket: {},
  push(id, stat) {
    set((s) => {
      const prev = s.history[id] ?? [];
      const next = [...prev, stat];
      if (next.length > MAX_POINTS) next.splice(0, next.length - MAX_POINTS);
      return {
        history: { ...s.history, [id]: next },
        socket: { ...s.socket, [id]: { ...(s.socket[id] ?? { status: null }), lastSeen: stat.ts } },
      };
    });
  },
  setStatus(id, status) {
    set((s) => ({
      socket: { ...s.socket, [id]: { ...(s.socket[id] ?? { lastSeen: 0 }), status } },
    }));
  },
  reset(id) {
    set((s) => {
      const { [id]: _h, ...history } = s.history;
      const { [id]: _s, ...socket } = s.socket;
      return { history, socket };
    });
  },
  latest(id) {
    const h = get().history[id];
    return h?.[h.length - 1];
  },
}));
