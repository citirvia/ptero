"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatBytes } from "@/lib/utils";
import { consoleSocketUrl } from "@/lib/api/client";
import { useLiveStats } from "@/store/live-stats";
import type { LiveSocketState } from "@/store/live-stats";
import { normalizePteroPowerState } from "@/lib/server-status";

const ANSI_CSI = /\u001b\[[0-9;]*m/g;
const ANSI_FIRST = /\u001b\[(\d+)/;
const RECONNECT_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000];

const LEVEL_COLOR: Record<string, string> = {
  info: "text-ink-secondary",
  debug: "text-ink-muted",
  warn: "text-warn",
  error: "text-danger",
  success: "text-online",
};

type ServerBadgeStatus =
  | "online"
  | "offline"
  | "installing"
  | "restarting"
  | "starting"
  | "stopping";

function ansiClassify(raw: string): { level: string; text: string } {
  const code = ANSI_FIRST.exec(raw)?.[1] ?? "";
  const text = raw.replace(ANSI_CSI, "");
  let level = "info";
  if (code === "31") level = "error";
  else if (code === "33") level = "warn";
  else if (code === "32") level = "success";
  else if (code === "90") level = "debug";
  return { level, text };
}

export function socketStatusToBadgeStatus(
  status: LiveSocketState["status"] | null | undefined,
  fallback: ServerBadgeStatus,
): ServerBadgeStatus {
  const normalized = normalizePteroPowerState(status);
  if (normalized === "running") return "online";
  if (normalized === "starting") return "starting";
  if (normalized === "stopping") return "stopping";
  if (normalized === "offline") return "offline";
  return fallback;
}

export function useConsoleStream(serverId: string, captureOutput = true) {
  const push = useLiveStats((s) => s.push);
  const setStatus = useLiveStats((s) => s.setStatus);
  const socketState = useLiveStats((s) => s.socket[serverId]);
  const liveStat = useLiveStats((s) => s.latest(serverId));
  const [lines, setLines] = useState<{ level: string; text: string }[]>([]);
  const [cmd, setCmd] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!serverId || typeof window === "undefined" || typeof WebSocket === "undefined") {
      return;
    }

    let attempt = 0;
    let closed = false;
    let retryHandle: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = () => {
      attempt = Math.min(attempt + 1, RECONNECT_DELAYS.length);
      const delay = RECONNECT_DELAYS[attempt - 1] ?? RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
      retryHandle = setTimeout(connect, delay);
    };

    const connect = () => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(consoleSocketUrl(serverId));
      } catch {
        scheduleReconnect();
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setConnected(true);
        try {
          ws.send(JSON.stringify({ event: "send logs", args: [null] }));
          ws.send(JSON.stringify({ event: "send stats", args: [null] }));
        } catch {
          /* socket may have closed mid-send */
        }
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as { event: string; args?: string[] };
          if (msg.event === "console output" && captureOutput) {
            const incoming = (msg.args ?? [])
              .flatMap((a) => String(a).split(/\r?\n/))
              .filter(Boolean)
              .map(ansiClassify);
            if (incoming.length) {
              setLines((prev) => [...prev, ...incoming].slice(-2000));
            }
          } else if (msg.event === "stats" && msg.args?.[0]) {
            const stat = JSON.parse(msg.args[0]) as {
              cpu_absolute: number;
              memory_bytes: number;
              disk_bytes: number;
              network: { rx_bytes: number; tx_bytes: number };
              state?: string;
              uptime?: number;
            };

            push(serverId, {
              cpu: stat.cpu_absolute,
              memBytes: stat.memory_bytes,
              diskBytes: stat.disk_bytes,
              rxBytes: stat.network.rx_bytes,
              txBytes: stat.network.tx_bytes,
              ts: Date.now(),
            });
            if (stat.state) {
              setStatus(
                serverId,
                normalizePteroPowerState(
                  stat.state as LiveSocketState["status"],
                  stat.uptime ?? 0,
                ) as LiveSocketState["status"],
              );
            }
          } else if (msg.event === "status") {
            const next = msg.args?.[0];
            if (next) {
              setStatus(serverId, normalizePteroPowerState(next as LiveSocketState["status"]) as LiveSocketState["status"]);
            }
          }
        } catch {
          /* server frames are JSON, ignore malformed frames */
        }
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        if (closed) return;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryHandle) clearTimeout(retryHandle);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [captureOutput, push, serverId, setStatus]);

  function sendCommand() {
    const next = cmd.trim();
    if (!next) return;
    setCmd("");
    const socket = wsRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: "send command", args: [next] }));
    } else if (captureOutput) {
      setLines((prev) => [...prev, { level: "warn", text: "[disconnected] command not sent" }]);
    }
  }

  return {
    cmd,
    connected,
    lines,
    liveStat,
    sendCommand,
    setCmd,
    socketState,
  };
}

export function LiveStatsBadges({
  stat,
  state,
}: {
  stat: ReturnType<typeof useLiveStats.getState>["history"][string][number] | undefined;
  state: LiveSocketState | undefined;
}) {
  if (!stat) {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
        <span>state: {state?.status ?? "connecting"}</span>
      </div>
    );
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
      <Pill label="state" value={state?.status ?? "running"} />
      <Pill label="cpu" value={`${stat.cpu.toFixed(1)}%`} />
      <Pill label="mem" value={formatBytes(stat.memBytes)} />
      <Pill label="disk" value={formatBytes(stat.diskBytes)} />
      <Pill label="rx" value={formatBytes(stat.rxBytes)} />
      <Pill label="tx" value={formatBytes(stat.txBytes)} />
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 font-mono">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink-secondary">{value}</span>
    </span>
  );
}

export function LiveConsolePanel({
  serverId,
  serverName,
}: {
  serverId: string;
  serverName: string;
}) {
  const { cmd, connected, lines, liveStat, sendCommand, setCmd, socketState } = useConsoleStream(
    serverId,
    true,
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [lines]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Live console</CardTitle>
        </div>

      </CardHeader>
      <CardContent>
        <LiveStatsBadges stat={liveStat} state={socketState} />
        <div
          ref={scrollRef}
          className="h-[420px] overflow-y-auto rounded-xl border border-line bg-bg p-4 font-mono text-xs leading-relaxed"
        >
          {lines.length === 0 ? (
            <p className="text-ink-muted">Waiting for {serverName} output...</p>
          ) : (
            lines.map((line, index) => (
              <div key={`${index}-${line.text.slice(0, 24)}`} className="flex gap-3">
                <span className={cn(LEVEL_COLOR[line.level] ?? "text-ink")}>{line.text}</span>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendCommand();
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={cmd}
            onChange={(event) => setCmd(event.target.value)}
            placeholder="Type a command..."
            className="font-mono"
            disabled={!connected}
          />
          <Button type="submit" disabled={!connected}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
