import type { Metadata } from "next";
import { Radio, Gauge, MemoryStick, Zap } from "lucide-react";
import { HostingLanding, type HostingConfig } from "../_hosting/hosting-landing";

export const metadata: Metadata = {
  title: "Discord Bot Hosting — Ptero",
  description:
    "Host Discord bots on bare-metal Ryzen with sub-30ms gateway latency, zero-downtime restarts, and git-push deploys. discord.js, Sapphire, Eris, discord.py.",
};

const config: HostingConfig = {
  runtimeKey: "discord",
  accent: "#5865f2",
  eyebrow: "Discord bot hosting",
  headline: (
    <>
      Discord bots that never{" "}
      <span className="accent-text">miss a heartbeat</span>
    </>
  ),
  subheadline:
    "Run sharded Discord bots on bare-metal Ryzen with a persistent gateway connection, automatic reconnects, and a real websocket console. From a single guild to a million.",
  heroBadge: "27ms gateway latency",
  metrics: [
    { icon: Radio, label: "Gateway latency", value: "27", unit: "ms", sub: "p50 round-trip to Discord's gateway edge." },
    { icon: Zap, label: "WebSocket reconnect", value: "<1", unit: "s", sub: "Resumed sessions, no missed events." },
    { icon: MemoryStick, label: "Memory per shard", value: "84", unit: "MB", sub: "Idle footprint with discord.js 14 caching." },
    { icon: Gauge, label: "Cold start", value: "320", unit: "ms", sub: "Process ready before the first READY event." },
  ],
  frameworksTitle: "Tuned for every Discord library",
  frameworksDescription:
    "Whatever framework your bot is built on, the gateway connection, sharding, and reconnect handling are tuned for it out of the box.",
  frameworks: [
    { name: "discord.js", abbr: "dj", desc: "v14 sharding & intents, with cache tuning baked in.", color: "#5865f2" },
    { name: "Sapphire", abbr: "Sp", desc: "Framework on discord.js with first-class command loading.", color: "#3b82f6" },
    { name: "Eris", abbr: "Er", desc: "Lightweight gateway library for high-shard-count bots.", color: "#9b59b6" },
    { name: "discord.py", abbr: "dp", desc: "Async Python bots with cogs and slash commands.", color: "#4b8bbe" },
  ],
  faqs: [
    {
      q: "Will my bot stay connected to the gateway 24/7?",
      a: "Yes. Your process runs as a long-lived service with an always-on websocket to Discord. If the connection drops, we resume the session automatically so no events are lost, and the web console shows the reconnect in realtime.",
    },
    {
      q: "How does sharding work on Ptero?",
      a: "Set SHARD_COUNT in your environment variables and run your shard manager as you normally would. Each shard keeps its own gateway socket; memory and CPU are metered per process so you can scale the plan as your guild count grows.",
    },
    {
      q: "Do you support discord.py and other Python libraries?",
      a: "Yes — Python 3.10 through 3.12 is fully supported, so discord.py, Pycord, and Hikari all run natively alongside the JavaScript libraries. Pick the runtime when you create the server.",
    },
    {
      q: "Can I keep my bot token and secrets safe?",
      a: "DISCORD_TOKEN and any other secrets are stored encrypted and injected at runtime as environment variables. They are never written to disk in plaintext and are masked in the dashboard.",
    },
    {
      q: "What happens during a deploy — does my bot go offline?",
      a: "Deploys build in the background and swap in optimistically, so the gateway disconnect is sub-second. For most bots users never notice; for zero-gap deploys you can run multiple shards and roll them one at a time.",
    },
  ],
  finalCta: {
    title: "Get your Discord bot online in 60 seconds",
    description:
      "Connect a repo, push, and watch it log in. No DevOps, no platform busywork — just a bot that stays online.",
  },
};

export default function DiscordBotHostingPage() {
  return <HostingLanding config={config} />;
}
