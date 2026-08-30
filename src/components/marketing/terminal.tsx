"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Tone = "ok" | "muted" | "accent" | "warn";

type Line = {
  time: string;
  level: "INFO" | "READY" | "DEBUG" | "WARN" | "CMD";
  source: string;
  shard?: string;
  message: string;
  tone?: Tone;
};

const SCRIPT: Line[] = [
  {
    time: "19:42:11.204",
    level: "INFO",
    source: "Pterodactyl",
    message: "Server marked as running, attaching to live bot console stream...",
    tone: "muted",
  },
  {
    time: "19:42:11.481",
    level: "INFO",
    source: "Node",
    message: "Node.js v20.17.0 detected, booting atlas-bot",
    tone: "muted",
  },
  {
    time: "19:42:11.923",
    level: "INFO",
    source: "ShardManager",
    message: "Launching 6 shards across cluster A",
    tone: "accent",
  },
  {
    time: "19:42:12.307",
    level: "READY",
    source: "Client",
    shard: "00",
    message: "Logged in as atlas#0420 (142381 guilds)",
    tone: "ok",
  },
  {
    time: "19:42:12.442",
    level: "DEBUG",
    source: "Gateway",
    shard: "00",
    message: "Session resumed seq=884120 ping=27ms region=fra-edge",
    tone: "muted",
  },
  {
    time: "19:42:12.918",
    level: "READY",
    source: "Client",
    shard: "01",
    message: "Shard ready, cache warmed in 418ms",
    tone: "ok",
  },
  {
    time: "19:42:13.106",
    level: "CMD",
    source: "Interaction",
    shard: "01",
    message: "/play lo-fi study | user=@doruk guild=Citirvia HQ",
    tone: "accent",
  },
  {
    time: "19:42:13.284",
    level: "INFO",
    source: "Voice",
    shard: "01",
    message: "Voice connection established endpoint=eu-central-1-a",
    tone: "muted",
  },
  {
    time: "19:42:13.601",
    level: "DEBUG",
    source: "Cache",
    shard: "03",
    message: "Autocomplete cache hit rate=99.82% rps=208.2",
    tone: "muted",
  },
  {
    time: "19:42:14.049",
    level: "WARN",
    source: "Gateway",
    shard: "05",
    message: "Heartbeat ACK delayed 182ms, entering soft recovery",
    tone: "warn",
  },
  {
    time: "19:42:14.410",
    level: "INFO",
    source: "Gateway",
    shard: "05",
    message: "Recovery complete, websocket stable ping=31ms",
    tone: "ok",
  },
  {
    time: "19:42:14.892",
    level: "CMD",
    source: "Interaction",
    shard: "02",
    message: "/deploy status | replied in 42ms ephemeral=true",
    tone: "accent",
  },
  {
    time: "19:42:15.203",
    level: "INFO",
    source: "Metrics",
    message: "cpu=12.4% ram=186MB uptime=4d12h shards=6/6",
    tone: "muted",
  },
];

const LEVEL_STYLES: Record<Line["level"], string> = {
  CMD: "text-[#c084fc]",
  DEBUG: "text-[#94a3b8]",
  INFO: "text-[#60a5fa]",
  READY: "text-online",
  WARN: "text-warn",
};

const TONE_STYLES: Record<Tone, string> = {
  ok: "text-online",
  muted: "text-ink-muted",
  accent: "text-accent-soft",
  warn: "text-warn",
};

const MAX_VISIBLE_LINES = 7;

export function Terminal({ className }: { className?: string }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= SCRIPT.length) {
      const reset = setTimeout(() => setVisible(0), 3200);
      return () => clearTimeout(reset);
    }
    const delay = visible === 0 ? 720 : 420;
    const t = setTimeout(() => setVisible((v) => v + 1), delay);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <div
      className={cn(
        "glass overflow-hidden rounded-2xl shadow-glow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-ink-muted">
            /home/ptero/logs/bot.log
          </span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
        </div>
      </div>
      <div className="border-b border-hairline/70 bg-bg/40 px-5 py-2.5">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-muted">
          <span>discord.js 14.16.3</span>
          <span className="text-ink-disabled">/</span>
          <span>gateway v10</span>
          <span className="text-ink-disabled">/</span>
          <span>142k guilds</span>
          <span className="text-ink-disabled">/</span>
          <span>27ms avg ping</span>
        </div>
      </div>
      <div className="h-[264px] overflow-hidden bg-[#0a0c10] p-4 font-mono text-[12.5px] leading-relaxed">
        <div className="space-y-1.5">
          {SCRIPT.slice(Math.max(0, visible - MAX_VISIBLE_LINES), visible).map((line, i) => (
            <div
              key={`${line.time}-${i}`}
              className="animate-fade-up"
            >
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 pt-0.5 font-mono text-[10px] text-[#6b7280]">
                  {line.time}
                </span>
                <span className={cn("shrink-0 text-[10px]", LEVEL_STYLES[line.level])}>
                  [{line.level}]
                </span>
                {line.shard ? (
                  <span className="shrink-0 text-[10px] text-[#818cf8]">
                    [s{line.shard}]
                  </span>
                ) : null}
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words text-[#d1d5db]",
                    line.tone ? TONE_STYLES[line.tone] : "text-ink",
                  )}
                >
                  {line.message}
                </span>
              </div>
            </div>
          ))}
          {visible < SCRIPT.length && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#6b7280]">
                {SCRIPT[Math.max(visible - 1, 0)]?.time ?? "19:42:11.204"}
              </span>
              <span className="text-[10px] text-[#60a5fa]">[INFO]</span>
              <span className="inline-block h-4 w-2 animate-pulse bg-accent-soft align-middle" />
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-hairline/70 bg-bg/35 px-4 py-2">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-ink-muted">
          <span>process: online</span>
          <span className="text-ink-disabled">/</span>
          <span>memory: 186 MB</span>
          <span className="text-ink-disabled">/</span>
          <span>cpu: 12.4%</span>
          <span className="text-ink-disabled">/</span>
          <span>events: 2.8k/min</span>
        </div>
      </div>
    </div>
  );
}
