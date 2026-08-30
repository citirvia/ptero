"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { cn, formatBytes } from "@/lib/utils";
import { RUNTIME_META } from "@/lib/api/types";
import { useServer, useServerId, useServerQuery } from "../_components/use-server";
import { SectionTitle } from "../_components/shared";
import { consoleSocketUrl } from "@/lib/api/client";
import { useLiveStats } from "@/store/live-stats";
import type { LiveSocketState } from "@/store/live-stats";
import { normalizePteroPowerState } from "@/lib/server-status";

// Subset ANSI: strip CSI color codes, classify line by the first SGR seen so
// errors/warnings get the proper colour without pulling in a full ANSI parser.
const ANSI_CSI = /\[[0-9;]*m/g;
const ANSI_FIRST = /\[(\d+)/;

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

const LEVEL_COLOR: Record<string, string> = {
  info: "text-ink-secondary",
  debug: "text-ink-muted",
  warn: "text-warn",
  error: "text-danger",
  success: "text-online",
};

const RECONNECT_DELAYS = [1_000, 2_000, 5_000, 10_000, 30_000];

export default function ConsolePage() {
  const id = useServerId();
  const server = useServer();
  const serverQuery = useServerQuery();
  const push = useLiveStats((s) => s.push);
  const setStatus = useLiveStats((s) => s.setStatus);
  const socketState = useLiveStats((s) => s.socket[id]);
  const liveStat = useLiveStats((s) => s.latest(id));

  const [lines, setLines] = useState<{ level: string; text: string }[]>([]);
  const [cmd, setCmd] = useState("");
  const [connected, setConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!id || typeof window === "undefined" || typeof WebSocket === "undefined") {
      return;
    }
    let attempt = 0;
    let closed = false;
    let retryHandle: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(consoleSocketUrl(id));
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
          if (msg.event === "console output") {
            const incoming = (msg.args ?? [])
              .flatMap((a) => String(a).split(/\r?\n/))
              .filter(Boolean)
              .map(ansiClassify);
            if (incoming.length) {
              setLines((l) => [...l, ...incoming].slice(-2000));
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
            push(id, {
              cpu: stat.cpu_absolute,
              memBytes: stat.memory_bytes,
              diskBytes: stat.disk_bytes,
              rxBytes: stat.network.rx_bytes,
              txBytes: stat.network.tx_bytes,
              ts: Date.now(),
            });
        if (stat.state) {
          setStatus(
            id,
            normalizePteroPowerState(
              stat.state as LiveSocketState["status"],
              stat.uptime ?? 0,
            ) as LiveSocketState["status"],
          );
        }
          } else if (msg.event === "status") {
            const next = msg.args?.[0];
        if (next) setStatus(id, normalizePteroPowerState(next as LiveSocketState["status"]) as LiveSocketState["status"]);
          }
        } catch {
          /* not JSON — server frames are always JSON, ignore */
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

    const scheduleReconnect = () => {
      attempt = Math.min(attempt + 1, RECONNECT_DELAYS.length);
      const delay = RECONNECT_DELAYS[attempt - 1] ?? RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1];
      retryHandle = setTimeout(connect, delay);
    };

    connect();

    return () => {
      closed = true;
      if (retryHandle) clearTimeout(retryHandle);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [id, push, setStatus]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const runCommand = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const c = cmd.trim();
    if (!c) return;
    setCmd("");
    const sock = wsRef.current;
    if (sock?.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ event: "send command", args: [c] }));
    } else {
      setLines((prev) => [...prev, { level: "warn", text: "[disconnected] command not sent" }]);
    }
  };

  if (serverQuery.isError) {
    return (
      <ErrorState
        description={(serverQuery.error as Error)?.message}
        onRetry={() => void serverQuery.refetch()}
      />
    );
  }
  if (!server) {
    return <Skeleton className="h-[520px]" />;
  }

  const runtime = RUNTIME_META[server.runtime];

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle
          title="Console"
          description={`Live output · ${runtime.label} ${server.runtimeVersion}`}
        />
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{server.name}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">
                {connected ? "connected" : "reconnecting…"}
              </span>
              <StatusBadge status={server.status} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Live stats badge row */}
            <LiveStatsBadges stat={liveStat} state={socketState} />
            <div
              ref={scrollRef}
              className="h-[420px] overflow-y-auto rounded-xl border border-line bg-bg p-4 font-mono text-xs leading-relaxed"
            >
              {lines.length === 0 ? (
                <p className="text-ink-muted">Waiting for output…</p>
              ) : (
                lines.map((l, i) => (
                  <div key={i} className="flex gap-3">
                    <span className={cn(LEVEL_COLOR[l.level] ?? "text-ink")}>{l.text}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={runCommand} className="mt-3 flex gap-2">
              <Input
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                placeholder="Type a command…"
                className="font-mono"
                disabled={!connected}
              />
              <Button type="submit" disabled={!connected}>Send</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LiveStatsBadges({
  stat,
  state,
}: {
  stat: ReturnType<typeof useLiveStats.getState>["history"][string][number] | undefined;
  state: LiveSocketState | undefined;
}) {
  if (!stat) {
    return (
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
        <span>state: {state?.status ?? "—"}</span>
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
